export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface SubtitleFile {
  id: string;
  originalName: string;
  newName: string;
  size: number;
  status: FileStatus;
  content: string | null; // The converted SRT content
  error?: string;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  processing: boolean;
}