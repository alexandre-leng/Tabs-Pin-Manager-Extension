/**
 * Storage Manager
 * Wraps browser.storage.local with retries, timeouts, throttling and a short-lived read cache.
 */

'use strict';

const STORAGE_TIMEOUT_MS = 10000;
const CRITICAL_ERROR_MARKERS = ['quota', 'permission', 'unavailable', 'disabled'];

class StorageManager {
  constructor() {
    this.retryDelay = 100;
    this.maxRetryDelay = 5000;
    this.maxRetries = 3;
    this.throttleDelay = 50; // Minimum delay between operations
    this.lastOperation = 0;

    this.cache = new Map();
    this.cacheExpiry = 5000;

    // Each extension context (background, popup, options) has its own instance and cache:
    // drop the cache whenever any context writes, so reads never return stale data
    try {
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.onChanged) {
        browser.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'local') {
            this.cache.clear();
          }
        });
      }
    } catch (error) {
      console.warn('Could not watch storage changes:', error);
    }
  }

  /**
   * Reads keys from storage, from the cache when it is fresh.
   * Returns a copy: callers may mutate the result without corrupting the cache.
   * @param {string|string[]} keys
   * @param {boolean} [useCache=true]
   * @returns {Promise<object>}
   */
  async get(keys, useCache = true) {
    const cacheKey = Array.isArray(keys) ? keys.join(',') : keys;

    const cached = this.cache.get(cacheKey);
    if (useCache && cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return structuredClone(cached.data);
    }

    await this.throttle();
    const result = await this.withRetry('GET', cacheKey, async () =>
      (await this.withTimeout(browser.storage.local.get(keys))) || {});
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return structuredClone(result);
  }

  /**
   * Writes data to storage and clears the read cache.
   * @param {object} data
   * @returns {Promise<void>}
   */
  async set(data) {
    await this.throttle();
    await this.withRetry('SET', Object.keys(data).join(','), () =>
      this.withTimeout(browser.storage.local.set(data)));
    // Multi-key cache entries cannot be patched reliably: drop them all
    this.cache.clear();
  }

  /**
   * Writes a value, reads it back and removes it.
   * @returns {Promise<{healthy: boolean, responseTime: number, error?: string}>}
   */
  async healthCheck() {
    const startTime = Date.now();
    const testKey = '__storage_health_test__';
    try {
      const value = Date.now();
      await this.set({ [testKey]: value });
      const retrieved = await this.get(testKey, false);
      if (retrieved[testKey] !== value) {
        throw new Error('Storage round-trip mismatch');
      }
      try {
        await browser.storage.local.remove(testKey);
      } catch (cleanupError) {
        console.warn('Could not clean up test data:', cleanupError);
      }
      return { healthy: true, responseTime: Date.now() - startTime };
    } catch (error) {
      return { healthy: false, error: error.message, responseTime: Date.now() - startTime };
    }
  }

  /** Spaces operations at least `throttleDelay` ms apart. */
  async throttle() {
    const wait = this.throttleDelay - (Date.now() - this.lastOperation);
    if (wait > 0) {
      await this.delay(wait);
    }
    this.lastOperation = Date.now();
  }

  /**
   * Runs `operation`, retrying with exponential backoff unless the error is critical
   * (quota, permission...), where retrying cannot help.
   */
  async withRetry(label, keys, operation) {
    let lastError;
    let currentDelay = this.retryDelay;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Storage ${label} attempt ${attempt} failed for ${keys}:`, error.message);
        if (this.isCriticalError(error)) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          await this.delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, this.maxRetryDelay);
        }
      }
    }
    console.error(`Storage ${label} failed after ${this.maxRetries} attempts for: ${keys}`);
    throw new Error(`Storage ${label} failed: ${lastError.message}`);
  }

  /** Rejects if `promise` does not settle within STORAGE_TIMEOUT_MS. */
  async withTimeout(promise) {
    let timerId;
    const timeout = new Promise((_, reject) => {
      timerId = setTimeout(() => reject(new Error('Storage operation timeout')), STORAGE_TIMEOUT_MS);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timerId);
    }
  }

  isCriticalError(error) {
    const message = String(error && error.message).toLowerCase();
    return CRITICAL_ERROR_MARKERS.some(marker => message.includes(marker));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} else {
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.StorageManager = StorageManager;
}
