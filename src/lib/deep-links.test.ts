import { isSafeExternalUrl, isSafeInAppPath, safeInAppPath } from './deep-links';

/**
 * Deep links arrive from push payloads and announcement records, so these are
 * the checks that stop a hostile or malformed server value reaching the router.
 */
describe('isSafeInAppPath', () => {
  it('allows known in-app destinations', () => {
    expect(isSafeInAppPath('/sermons/42')).toBe(true);
    expect(isSafeInAppPath('/courses/co-1')).toBe(true);
    expect(isSafeInAppPath('/giving/history')).toBe(true);
    expect(isSafeInAppPath('/notifications')).toBe(true);
    expect(isSafeInAppPath('/sermons/42?autoplay=1')).toBe(true);
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(isSafeInAppPath('https://example.org/sermons/42')).toBe(false);
    expect(isSafeInAppPath('//example.org/sermons/42')).toBe(false);
    expect(isSafeInAppPath('twainman://sermons/42')).toBe(false);
  });

  it('rejects traversal and backslash tricks', () => {
    expect(isSafeInAppPath('/sermons/../../etc/passwd')).toBe(false);
    expect(isSafeInAppPath('/sermons\\42')).toBe(false);
  });

  it('rejects unknown prefixes and near-misses', () => {
    expect(isSafeInAppPath('/admin')).toBe(false);
    expect(isSafeInAppPath('/sermonsdelete')).toBe(false);
    expect(isSafeInAppPath('')).toBe(false);
    expect(isSafeInAppPath(null)).toBe(false);
  });

  it('safeInAppPath returns the path or null', () => {
    expect(safeInAppPath('/events/ev-1')).toBe('/events/ev-1');
    expect(safeInAppPath('https://example.org')).toBeNull();
  });
});

describe('isSafeExternalUrl', () => {
  it('allows https and the contact schemes the church uses', () => {
    expect(isSafeExternalUrl('https://example.org/receipt.pdf')).toBe(true);
    expect(isSafeExternalUrl('mailto:office@example.org')).toBe(true);
    expect(isSafeExternalUrl('tel:+2348000000000')).toBe(true);
  });

  it('rejects plain http and anything exotic', () => {
    expect(isSafeExternalUrl('http://example.org')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeExternalUrl('not a url')).toBe(false);
    expect(isSafeExternalUrl(null)).toBe(false);
  });
});
