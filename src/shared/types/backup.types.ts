export interface BackupInfo {
  name: string;
  path: string;
  date: string;
  size: number;
}

export interface RestoreBackupPayload {
  path: string;
}
