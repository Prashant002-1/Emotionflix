/**
 * Frontend Emotional Record Component Tests
 * 
 * Covers the direct emotional-record controls, emotional display, and the
 * optional camera and photo expression adapters.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmotionCapture } from '../../src/components/EmotionCapture';
import EmotionDisplay from '../../src/components/features/emotion/EmotionDisplay';
import ManualEmotionInput from '../../src/components/features/emotion/ManualEmotionInput';
import { UserProvider } from '../../src/contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';
import { createMockEmotionScores } from '../test-utils';

/**
 * Mock expression-estimate adapter for component testing
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
    getStoredToken: vi.fn().mockReturnValue(null),
    getStoredUser: vi.fn().mockReturnValue(null),
    getProfile: vi.fn(),
    storeAuthData: vi.fn(),
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
    <UserProvider>{children}</UserProvider>
  </BrowserRouter>
);

describe('Frontend Emotional Record - UI Components', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EmotionCapture Component', () => {
    it('presents direct input before optional expression estimates', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmotionCapture onEmotionsDetected={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /set it yourself/i })).toBeInTheDocument();
      await user.click(screen.getByText(/optional expression estimate/i));
      expect(screen.getByRole('button', { name: /use camera/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use a photo/i })).toBeInTheDocument();
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

      expect(screen.getByRole('slider', { name: /joy intensity/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /melancholy intensity/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /friction intensity/i })).toBeInTheDocument();
    });

  });
});
