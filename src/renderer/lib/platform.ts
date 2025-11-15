export type Platform = 'mac' | 'windows';

const MAC_OS_REGEX = /mac|iphone|ipad|ipod/i;

export function detectPlatform(): Platform {
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform || navigator.userAgent;
    if (MAC_OS_REGEX.test(platform)) {
      return 'mac';
    }
  }

  if (typeof process !== 'undefined' && process.platform === 'darwin') {
    return 'mac';
  }

  return 'windows';
}

export function isMacPlatform(): boolean {
  return detectPlatform() === 'mac';
}
