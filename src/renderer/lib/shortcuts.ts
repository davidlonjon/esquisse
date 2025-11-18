import type { TFunction } from 'i18next';

import {
  getShortcutDisplayMetadata,
  getShortcutById,
  type ShortcutId,
  type ShortcutDisplayMetadata,
} from '@config/shortcuts';

import { detectPlatform, type Platform } from './platform';

export interface ShortcutDisplayInfo {
  id: ShortcutId;
  combo: string;
  label: string;
  description?: string;
}

const FALLBACK_COMBO = '';

export function getShortcutCombo(
  id: ShortcutId,
  platform: Platform = detectPlatform()
): string | null {
  const metadata = getShortcutDisplayMetadata(id);
  if (!metadata) {
    return null;
  }
  return metadata.combos[platform] ?? FALLBACK_COMBO;
}

export function getShortcutDisplayInfo(
  id: ShortcutId,
  t: TFunction,
  platform: Platform = detectPlatform()
): ShortcutDisplayInfo | null {
  const shortcut = getShortcutById(id);
  const metadata = shortcut?.display;
  if (!shortcut || !metadata) {
    return null;
  }

  const combo = metadata.combos[platform] ?? FALLBACK_COMBO;
  return {
    id,
    combo,
    // Type assertion needed here because labelKey/descriptionKey come from configuration
    // and TypeScript can't narrow the union type to specific literals at runtime
    label: t(metadata.labelKey as never),
    description: metadata.descriptionKey ? t(metadata.descriptionKey as never) : undefined,
  };
}

export function getShortcutDisplayList(
  ids: ShortcutId[],
  t: TFunction,
  platform: Platform = detectPlatform()
): ShortcutDisplayInfo[] {
  return ids
    .map((id) => getShortcutDisplayInfo(id, t, platform))
    .filter((value): value is ShortcutDisplayInfo => value !== null);
}

export function getShortcutMetadata(id: ShortcutId): ShortcutDisplayMetadata | undefined {
  return getShortcutDisplayMetadata(id);
}
