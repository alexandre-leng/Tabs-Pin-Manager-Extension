import { jest } from '@jest/globals';
import { UiUtils } from '../lib/ui-utils.js';

describe('UiUtils', () => {
  test('isValidUrl accepts only well-formed http(s) URLs', () => {
    expect(UiUtils.isValidUrl('https://example.com/a?b=1')).toBe(true);
    expect(UiUtils.isValidUrl('http://example.com')).toBe(true);
    expect(UiUtils.isValidUrl('http://')).toBe(false);
    expect(UiUtils.isValidUrl('javascript:alert(1)')).toBe(false);
    expect(UiUtils.isValidUrl('')).toBe(false);
    expect(UiUtils.isValidUrl(undefined)).toBe(false);
  });

  test('extractDomain returns the hostname, or the input when unparsable', () => {
    expect(UiUtils.extractDomain('https://docs.github.com/en')).toBe('docs.github.com');
    expect(UiUtils.extractDomain('not a url')).toBe('not a url');
  });

  test('loadFavicon walks through providers then reports failure', () => {
    const img = {};
    const onFail = jest.fn();
    UiUtils.loadFavicon(img, 'example.com', { onFail });
    const services = UiUtils.getFaviconServices('example.com');

    expect(img.src).toBe(services[0]);
    img.onerror();
    expect(img.src).toBe(services[1]);
    img.onerror();
    expect(img.src).toBe(services[2]);
    expect(onFail).not.toHaveBeenCalled();
    img.onerror();
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  test('showToast restarts the auto-hide timer', () => {
    jest.useFakeTimers();
    const classes = new Set();
    const manager = {
      elements: { toast: { className: '', classList: { remove: c => classes.delete(c) } } },
      hideToast: jest.fn()
    };
    UiUtils.showToast(manager, 'success', '✅', 'one', 3000);
    jest.advanceTimersByTime(2000);
    UiUtils.showToast(manager, 'success', '✅', 'two', 3000);
    jest.advanceTimersByTime(2000);
    expect(manager.hideToast).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(manager.hideToast).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  describe('sendMessage', () => {
    afterEach(() => { delete global.browser; });
    const withSendMessage = (impl) => { global.browser = { runtime: { sendMessage: jest.fn(impl) } }; };

    test('retries until the background script answers', async () => {
      let calls = 0;
      withSendMessage(async () => {
        if (++calls < 2) throw new Error('Receiving end does not exist');
        return { success: true };
      });
      await expect(UiUtils.sendMessage({ action: 'ping' })).resolves.toEqual({ success: true });
      expect(global.browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('returns failed responses without retrying', async () => {
      withSendMessage(async () => ({ success: false, error: 'nope' }));
      await expect(UiUtils.sendMessage({ action: 'x' })).resolves.toEqual({ success: false, error: 'nope' });
      expect(global.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });

    test('rejects after the last attempt', async () => {
      withSendMessage(async () => { throw new Error('Receiving end does not exist'); });
      await expect(UiUtils.sendMessage({ action: 'x' }, 2)).rejects.toThrow('not responding');
      expect(global.browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
});
