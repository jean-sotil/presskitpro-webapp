import type { CollectionBeforeChangeHook } from 'payload';

export type PressKitProvider =
  | 'unknown'
  | 'google-drive'
  | 'dropbox'
  | 'onedrive'
  | 'wetransfer'
  | 'notion'
  | 'mediafire'
  | 'other';

export function derivePressKitProvider(url: unknown): PressKitProvider {
  if (typeof url !== 'string' || url.length === 0) return 'unknown';
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
  if (host.endsWith('drive.google.com')) return 'google-drive';
  if (host.endsWith('dropbox.com')) return 'dropbox';
  if (host.endsWith('onedrive.live.com') || host === '1drv.ms') return 'onedrive';
  if (host.endsWith('wetransfer.com')) return 'wetransfer';
  // notion.so for personal pages, *.notion.site for team-published pages.
  if (host.endsWith('notion.so') || host.endsWith('notion.site')) return 'notion';
  if (host.endsWith('mediafire.com')) return 'mediafire';
  return 'other';
}

/**
 * Per task-08 implementation note: don't accept `pressKitProvider` as raw
 * user input — derive it from the URL on every save. Health status fields
 * are owned by the daily cron (task-30) and are NOT touched here.
 */
export const derivePressKitProviderHook: CollectionBeforeChangeHook = ({ data }) => {
  if ('pressKitUrl' in data) {
    data.pressKitProvider = derivePressKitProvider(data.pressKitUrl);
  }
  return data;
};
