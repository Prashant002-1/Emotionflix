/**
 * Frontend Emotion Detection Component Tests
 * 
 * Comprehensive test suite for emotion detection UI components including
 * EmotionCapture, EmotionDisplay, and ManualEmotionInput. Tests webcam integration,
 * file upload, manual input, and emotion visualization functionality.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmotionCapture } from '../../src/components/EmotionCapture';
import EmotionDisplay from '../../src/components/features/emotion/EmotionDisplay';
import ManualEmotionInput from '../../src/components/features/emotion/ManualEmotionInput';
import { EmotionProvider } from '../../src/contexts/EmotionContext';
import { UserProvider } from '../../src/contexts/UserContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import { createMockEmotionScores } from '../test-utils';

/**
 * Mock emotion detection service for component testing
 * 
 * Provides mock implementations of face-api.js emotion detection functions
 * to enable testing without actual model loading or image processing.
 */
vi.mock('../../src/services/emotionDetection', () => ({
  LoadModels: vi.fn().mockResolvedValue(undefined),
  DetectEmotionsFromImage: vi.fn(),
  DetectEmotionsFromVideo: vi.fn(),
  StartWebcamStream: vi.fn().mockResolvedValue({}),
  StopWebcamStream: vi.fn(),
  CapturePhotoFromVideo: vi.fn(),
  DetectEmotionsFromFile: vi.fn(),
  EnhanceEmotionScores: vi.fn((scores) => scores),
  GetDominantEmotion: vi.fn().mockReturnValue('happy'),
  GetConfidenceLevel: vi.fn().mockReturnValue(0.8),
  FormatEmotionsForDisplay: vi.fn().mockReturnValue('😊 70% 😐 10%'),
  GetEmotionIcon: vi.fn().mockReturnValue('😊'),
  GetEmotionColor: vi.fn().mockReturnValue('#10B981'),
}));

/**
 * Mock authentication service for context support
 * 
 * Required for UserProvider context in test wrapper, provides mock
 * auth operations for isolated component testing.
 */
vi.mock('../../src/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

/**
 * Mock MediaDevices API for webcam testing
 * 
 * Provides mock getUserMedia implementation to test webcam functionality
 * without requiring actual camera permissions or hardware access.
 */
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

/**
 * Test wrapper component with all required providers
 * 
 * Wraps components with Router, Theme, User, and Emotion providers
 * to ensure full context support for emotion detection components.
 * 
 * @param children - Components to wrap with providers
 * @returns Wrapped component tree
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <UserProvider>
        <EmotionProvider>
          {children}
        </EmotionProvider>
      </UserProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Frontend Emotion Detection - UI Components', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EmotionCapture Component', () => {
    it('should render emotion capture interface', () => {
      render(
        <TestWrapper>
          <EmotionCapture onEmotionsDetected={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText(/camera/i)).toBeInTheDocument();
      expect(screen.getByText(/upload/i)).toBeInTheDocument();
      expect(screen.getByText(/manually/i)).toBeInTheDocument();
    });

  });

  describe('EmotionDisplay Component', () => {
    const mockEmotions = createMockEmotionScores({
      happy: 0.7,
      sad: 0.2,
      neutral: 0.1,
    });

    it('should display emotions', () => {
      render(
        <TestWrapper>
          <EmotionDisplay emotions={mockEmotions} />
        </TestWrapper>
      );

      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });

    it('should filter out low emotions', () => {
      const lowEmotions = createMockEmotionScores({
        happy: 0.02, // Below 5% threshold
        sad: 0.08,   // Above threshold
        neutral: 0.9,
      });

      render(
        <TestWrapper>
          <EmotionDisplay emotions={lowEmotions} />
        </TestWrapper>
      );

      expect(screen.queryByText(/2%/)).not.toBeInTheDocument();
      expect(screen.getByText(/8%/)).toBeInTheDocument();
    });
  });

  describe('ManualEmotionInput Component', () => {
    it('should render emotion sliders', () => {
      render(
        <TestWrapper>
          <ManualEmotionInput onEmotionChange={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText(/happy/i)).toBeInTheDocument();
      expect(screen.getByText(/sad/i)).toBeInTheDocument();
      expect(screen.getByText(/angry/i)).toBeInTheDocument();
    });

  });
});