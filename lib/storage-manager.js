/**
 * Storage Manager for Firefox Extension
 * Robust storage management with error handling and recovery mechanisms
 * Addresses IndexedDB ActorsParent.cpp errors
 */

'use strict';

class StorageManager {
  constructor() {
    this.isLocked = false;
    this.pendingOperations = new Map();
    this.retryDelay = 100; // Start with 100ms
    this.maxRetryDelay = 5000; // Max 5 seconds
    this.maxRetries = 3;
    this.throttleDelay = 50; // Minimum delay between operations
    this.lastOperation = 0;
    
    // Cache for frequently accessed data
    this.cache = new Map();
    this.cacheExpiry = 5000; // 5 seconds cache
    
    console.log('🗄️ StorageManager initialized');
  }

  /**
   * Throttle storage operations to prevent overwhelming Firefox
   */
  async throttle() {
    const now = Date.now();
    const timeSinceLastOp = now - this.lastOperation;
    
    if (timeSinceLastOp < this.throttleDelay) {
      const delay = this.throttleDelay - timeSinceLastOp;
      await this.delay(delay);
    }
    
    this.lastOperation = Date.now();
  }

  /**
   * Get data from storage with error handling and retry mechanism
   * @param {string|string[]} keys - Storage keys to retrieve
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<object>} - Retrieved data
   */
  async get(keys, useCache = true) {
    const keyString = Array.isArray(keys) ? keys.join(',') : keys;
    
    // Check cache first
    if (useCache && this.cache.has(keyString)) {
      const cached = this.cache.get(keyString);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`📋 Cache hit for: ${keyString}`);
        return cached.data;
      } else {
        this.cache.delete(keyString);
      }
    }

    await this.throttle();
    
    const operationId = `get_${keyString}_${Date.now()}`;
    
    // Prevent duplicate concurrent operations
    if (this.pendingOperations.has(operationId)) {
      return this.pendingOperations.get(operationId);
    }

    const operation = this.performGetOperation(keys, keyString, operationId);
    this.pendingOperations.set(operationId, operation);
    
    try {
      const result = await operation;
      return result;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Perform the actual get operation with retry logic
   */
  async performGetOperation(keys, keyString, operationId) {
    let lastError;
    let currentDelay = this.retryDelay;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📥 Storage GET attempt ${attempt}/${this.maxRetries} for: ${keyString}`);
        
        const result = await this.executeStorageGet(keys);
        
        // Cache successful result
        this.cache.set(keyString, {
          data: result,
          timestamp: Date.now()
        });
        
        console.log(`✅ Storage GET successful for: ${keyString}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Storage GET attempt ${attempt} failed for ${keyString}:`, error.message);
        
        // Don't retry on certain critical errors
        if (this.isCriticalError(error)) {
          throw error;
        }
        
        // Wait before retry
        if (attempt < this.maxRetries) {
          await this.delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, this.maxRetryDelay);
        }
      }
    }
    
    console.error(`❌ Storage GET failed after ${this.maxRetries} attempts for: ${keyString}`);
    throw new Error(`Storage GET failed: ${lastError.message}`);
  }

  /**
   * Set data to storage with error handling and retry mechanism
   * @param {object} data - Data to store
   * @param {boolean} updateCache - Whether to update cache
   * @returns {Promise<void>}
   */
  async set(data, updateCache = true) {
    await this.throttle();
    
    const dataKeys = Object.keys(data).join(',');
    const operationId = `set_${dataKeys}_${Date.now()}`;
    
    // Prevent duplicate concurrent operations
    if (this.pendingOperations.has(operationId)) {
      return this.pendingOperations.get(operationId);
    }

    const operation = this.performSetOperation(data, dataKeys, updateCache);
    this.pendingOperations.set(operationId, operation);
    
    try {
      const result = await operation;
      return result;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Perform the actual set operation with retry logic
   */
  async performSetOperation(data, dataKeys, updateCache) {
    let lastError;
    let currentDelay = this.retryDelay;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📤 Storage SET attempt ${attempt}/${this.maxRetries} for: ${dataKeys}`);
        
        await this.executeStorageSet(data);
        
        // Clear all cache on any write to ensure subsequent reads are fresh
        // Partial cache updates are unreliable with multi-key queries
        this.cache.clear();
        console.log(`✅ Storage SET successful and cache cleared for: ${dataKeys}`);
        return;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Storage SET attempt ${attempt} failed for ${dataKeys}:`, error.message);
        
        // Don't retry on certain critical errors
        if (this.isCriticalError(error)) {
          throw error;
        }
        
        // Wait before retry
        if (attempt < this.maxRetries) {
          await this.delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, this.maxRetryDelay);
        }
      }
    }
    
    console.error(`❌ Storage SET failed after ${this.maxRetries} attempts for: ${dataKeys}`);
    throw new Error(`Storage SET failed: ${lastError.message}`);
  }

  /**
   * Execute the actual browser.storage.local.get with error handling
   */
  async executeStorageGet(keys) {
    let timerId;
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('Storage operation timeout')), 10000);
      });
      
      const storagePromise = browser.storage.local.get(keys);
      const result = await Promise.race([storagePromise, timeoutPromise]);
      
      return result || {};
    } catch (error) {
      // Enhanced error information
      const enhancedError = new Error(`IndexedDB Error: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.operation = 'GET';
      enhancedError.keys = keys;
      throw enhancedError;
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }

  /**
   * Execute the actual browser.storage.local.set with error handling
   */
  async executeStorageSet(data) {
    let timerId;
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('Storage operation timeout')), 10000);
      });
      
      const storagePromise = browser.storage.local.set(data);
      await Promise.race([storagePromise, timeoutPromise]);
      
    } catch (error) {
      // Enhanced error information
      const enhancedError = new Error(`IndexedDB Error: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.operation = 'SET';
      enhancedError.data = data;
      throw enhancedError;
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }

  /**
   * Check if error is critical and shouldn't be retried
   */
  isCriticalError(error) {
    const criticalErrors = [
      'quota',
      'permission',
      'unavailable',
      'disabled'
    ];
    
    const message = error.message.toLowerCase();
    return criticalErrors.some(critical => message.includes(critical));
  }

  /**
   * Clear storage with confirmation
   * @param {boolean} force - Force clear without confirmation
   * @returns {Promise<void>}
   */
  async clear(force = false) {
    if (!force) {
      console.warn('Storage clear requested but not forced. Use clear(true) to proceed.');
      return;
    }

    await this.throttle();
    
    try {
      await browser.storage.local.clear();
      this.cache.clear();
      console.log('🗑️ Storage cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      throw new Error(`Storage clear failed: ${error.message}`);
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<object>} - Usage information
   */
  async getUsage() {
    try {
      if (browser.storage.local.getBytesInUse) {
        const usage = await browser.storage.local.getBytesInUse();
        return {
          bytesInUse: usage,
          humanReadable: this.formatBytes(usage)
        };
      }
      return { bytesInUse: 0, humanReadable: '0 B' };
    } catch (error) {
      console.warn('Could not get storage usage:', error);
      return { bytesInUse: 0, humanReadable: 'Unknown' };
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check for storage system
   * @returns {Promise<object>} - Health status
   */
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      // Test write operation
      const testKey = '__storage_health_test__';
      const testData = { [testKey]: Date.now() };
      
      await this.set(testData, false);
      const retrieved = await this.get(testKey, false);
      
      // Clean up test data
      try {
        await browser.storage.local.remove(testKey);
      } catch (cleanupError) {
        console.warn('Could not clean up test data:', cleanupError);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        healthy: true,
        responseTime: duration,
        cacheSize: this.cache.size,
        pendingOperations: this.pendingOperations.size
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        cacheSize: this.cache.size,
        pendingOperations: this.pendingOperations.size
      };
    }
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Storage cache cleared');
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      expiry: this.cacheExpiry
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} else {
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.StorageManager = StorageManager;
} 