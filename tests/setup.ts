import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock face-api.js
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

// Mock MediaDevices API
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

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
};

// Mock Image constructor
global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 640;
  height: number = 480;

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_TMDB_API_KEY: 'mock-api-key',
    VITE_API_BASE_URL: 'http://localhost:3001',
  },
  writable: true,
});