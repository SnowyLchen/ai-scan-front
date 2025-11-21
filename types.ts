
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'detecting' | 'detected' | 'cropping' | 'cropped' | 'error';

export interface ScanItem {
  id: string;
  file?: File; 
  originalUrl: string;
  name: string;
  status: ProcessingStatus;
  boundingBox?: BoundingBox;
  croppedUrl?: string;
  width?: number;
  height?: number;
  errorMessage?: string;
}

export enum AppStep {
  UPLOAD = 0,
  DETECT = 1,
  CROP = 2,
}

// Re-export network types if needed globally
export type { ApiResponse } from './utils/network';
