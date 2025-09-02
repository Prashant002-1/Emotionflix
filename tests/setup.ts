/**
 * Frontend Test Environment Setup
 * 
 * Global test configuration for Vitest test suite including comprehensive mocks
 * for face-api.js, MediaDevices API, FileReader, Image constructor, localStorage,
 * and environment variables to enable isolated testing of emotion detection components.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * Mock face-api.js library for emotion detection testing
 * 
 * Provides mock implementations of neural network loading and face detection
 * to avoid actual model downloads and computation during testing.
 */
vi.mock('face-api.js', () => ({
  nets: {
    ssdMobilenetv1: {
      loadFromUri: vi.fn().mockResolvedValue(true),
      isLoaded: true,
    },
    faceLandmark68Net: {
      loadFromUri: vi.fn().mockResolvedValue(true),
      isLoaded: true,
    },
    faceExpressionNet: {
      loadFromUri: vi.fn().mockResolvedValue(true),
      isLoaded: true,
    },
  },
  detectAllFaces: vi.fn().mockResolvedValue([]),
  SsdMobilenetv1Options: vi.fn().mockImplementation(() => ({})),
}));

/**
 * Mock MediaDevices API for webcam testing
 * 
 * Provides mock implementations of getUserMedia and related video track methods
 * to simulate webcam functionality without requiring actual camera access.
 */
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getVideoTracks: vi.fn().mockReturnValue([{
        stop: vi.fn(),
        getSettings: vi.fn().mockReturnValue({
          width: 640,
          height: 480,
        }),
      }]),
      getTracks: vi.fn().mockReturnValue([{
        stop: vi.fn(),
      }]),
      active: true,
    }),
  },
});

/**
 * Mock URL object methods for blob handling
 * 
 * Provides mock implementations of createObjectURL and revokeObjectURL
 * for testing file and media blob operations.
 */
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = vi.fn();

/**
 * Mock FileReader for file upload testing
 * 
 * Simulates file reading operations with mock base64 data output
 * for testing image upload and processing functionality.
 */
global.FileReader = class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  result: string | null = null;
  readyState: number = FileReader.DONE;

  /**
   * Mock implementation of readAsDataURL
   * 
   * @param file - File to read (mocked)
   */
  readAsDataURL(file: File) {
    this.readyState = FileReader.LOADING;
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      this.readyState = FileReader.DONE;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }

  // Add other required FileReader methods
  readAsArrayBuffer(blob: Blob): void {}
  readAsBinaryString(blob: Blob): void {}
  readAsText(blob: Blob, encoding?: string): void {}
  abort(): void {}
  addEventListener(type: string, listener: EventListener): void {}
  removeEventListener(type: string, listener: EventListener): void {}
  dispatchEvent(event: Event): boolean { return true; }
} as any;

/**
 * Mock Image constructor for image loading testing
 * 
 * Provides mock Image implementation with automatic onload triggering
 * for testing image-based emotion detection functionality.
 */
global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 640;
  height: number = 480;
  complete: boolean = true;
  naturalWidth: number = 640;
  naturalHeight: number = 480;
  alt: string = '';
  align: string = '';
  border: string = '';

  /**
   * Mock constructor that auto-triggers onload event
   */
  constructor(width?: number, height?: number) {
    if (width) this.width = width;
    if (height) this.height = height;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  // Add other required HTMLImageElement methods
  addEventListener(type: string, listener: EventListener): void {}
  removeEventListener(type: string, listener: EventListener): void {}
  dispatchEvent(event: Event): boolean { return true; }
  getAttribute(name: string): string | null { return null; }
  setAttribute(name: string, value: string): void {}
  removeAttribute(name: string): void {}
  hasAttribute(name: string): boolean { return false; }
  getBoundingClientRect(): DOMRect { return new DOMRect(); }
} as any;

/**
 * Mock localStorage for browser storage testing
 * 
 * Provides mock implementations of localStorage methods for testing
 * user preferences and authentication token storage.
 */
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * Mock environment variables
 * 
 * Provides test-safe API keys and URLs for testing API integration
 */
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_TMDB_API_KEY: 'mock-api-key',
    VITE_API_BASE_URL: 'http://localhost:3001',
  },
  writable: true,
});