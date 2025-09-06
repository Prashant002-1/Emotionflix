/**
 * Emotion Detection Service
 * 
 * Service for analyzing emotions from images and webcam using face-api.js.
 * Provides face detection, emotion recognition, and utility functions
 * for capturing photos and managing webcam streams.
 */

import * as faceapi from 'face-api.js';
import { EmotionScores } from '../types/emotion';

let modelsLoaded = false;
let currentStream: MediaStream | null = null;
let modelLoadingPromise: Promise<void> | null = null;

/**
 * Loads face-api.js neural network models for emotion detection.
 * Must be called before performing any emotion detection operations.
 * Includes validation and retry logic for robust model loading.
 * 
 * @returns Promise that resolves when all required models are loaded
 */
export const LoadModels = async (): Promise<void> => {
  if (modelsLoaded) return;
  
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  const MODEL_URL = '/models';
  
  modelLoadingPromise = (async () => {
    try {
      modelsLoaded = false;
      
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        throw new Error('SSD MobileNet v1 failed to load');
      }
      
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      if (!faceapi.nets.faceLandmark68Net.isLoaded) {
        throw new Error('Face Landmark 68 failed to load');
      }
      
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      if (!faceapi.nets.faceExpressionNet.isLoaded) {
        throw new Error('Face Expression model failed to load');
      }

      modelsLoaded = true;
      
    } catch (error) {
      modelsLoaded = false;
      modelLoadingPromise = null;
      
      if (error instanceof Error) {
        if (error.message.includes('tensor')) {
          throw new Error('Model files corrupted or incompatible');
        } else if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
          throw new Error('Model files not found');
        }
      }
      
      throw error;
    }
  })();
  
  return modelLoadingPromise;
};

/**
 * Detects emotions from a static image element
 * 
 * Uses face-api.js to detect faces and analyze emotional expressions
 * from the provided image. Returns scores from the highest-confidence face.
 * 
 * @param imageElement - HTML image element to analyze
 * @returns Promise resolving to EmotionScores object or null if no face detected
 */
export const DetectEmotionsFromImage = async (imageElement: HTMLImageElement): Promise<EmotionScores | null> => {
  if (!modelsLoaded) {
    await LoadModels();
  }

  try {
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.3,
        maxResults: 10
      }))
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) {
      return null;
    }

    const detection = detections.reduce((prev, current) => 
      (current.detection.score > prev.detection.score) ? current : prev
    );

    const expressions = detection.expressions;
    const rawEmotions = {
      neutral: expressions.neutral,
      happy: expressions.happy,
      sad: expressions.sad,
      angry: expressions.angry,
      fearful: expressions.fearful,
      disgusted: expressions.disgusted,
      surprised: expressions.surprised,
    };

    return EnhanceEmotionScores(rawEmotions);
  } catch (error) {
    return null;
  }
};

/**
 * Determines the strongest emotion from scores
 * 
 * Identifies the emotion with the highest confidence score.
 * Used for simplified emotion-to-genre mapping and dominant emotion display.
 * 
 * @param a_emotionScores - The emotion scores to analyze
 * @returns The emotion key with the highest score
 */
export const GetDominantEmotion = (a_emotionScores: EmotionScores): keyof EmotionScores => {
  return Object.entries(a_emotionScores).reduce((a, b) => 
    a_emotionScores[a[0] as keyof EmotionScores] > a_emotionScores[b[0] as keyof EmotionScores] ? a : b
  )[0] as keyof EmotionScores;
};

/**
 * Starts webcam stream for live emotion detection
 * 
 * Requests webcam access and returns the media stream for live video feed.
 * Includes comprehensive error handling for various webcam access issues.
 * 
 * @returns Promise resolving to MediaStream or null if failed
 */
export const StartWebcamStream = async (): Promise<MediaStream | null> => {
  try {
    // Stop existing stream if any
    if (currentStream) {
      StopWebcamStream();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported in this browser');
    }

    currentStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: 'user'
      },
      audio: false
    });
    
    return currentStream;
  } catch (error) {
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Camera settings not supported');
      }
    }
    
    throw error;
  }
};

/**
 * Stops the current webcam stream
 * 
 * Stops all tracks in the current media stream and cleans up resources
 * to free camera access for other applications.
 */
export const StopWebcamStream = (): void => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => {
      track.stop();
    });
    currentStream = null;
  }
};

/**
 * Analyzes emotions from video element in real-time
 * 
 * Analyzes emotions from a live video stream using face-api.js.
 * Should be called repeatedly for real-time emotion detection.
 * Includes comprehensive validation and error handling.
 * 
 * @param video - HTML video element to analyze
 * @returns Promise resolving to EmotionScores object or null if no face detected
 */
export const DetectEmotionsFromVideo = async (video: HTMLVideoElement): Promise<EmotionScores | null> => {
  try {
    if (!modelsLoaded) {
      await LoadModels();
    }

    if (!video || video.readyState < 2) {
      return null;
    }

    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    if (video.paused || video.ended) {
      return null;
    }
    
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.3,
        maxResults: 5
      }))
      .withFaceLandmarks()
      .withFaceExpressions();
    
    if (detections.length === 0) {
      return null;
    }

    const bestDetection = detections.reduce((prev, current) => 
      (current.detection.score > prev.detection.score) ? current : prev
    );

    const confidence = bestDetection.detection.score;

    if (confidence < 0.2) {
      return null;
    }

    const expressions = bestDetection.expressions;

    const rawEmotions = {
      neutral: expressions.neutral,
      happy: expressions.happy,
      sad: expressions.sad,
      angry: expressions.angry,
      fearful: expressions.fearful,
      disgusted: expressions.disgusted,
      surprised: expressions.surprised,
    };

    return EnhanceEmotionScores(rawEmotions);
  } catch (error) {
    
    if (error instanceof Error && error.message.includes('tensor')) {
      modelsLoaded = false;
      modelLoadingPromise = null;
    }
    
    return null;
  }
};

/**
 * Captures photo from video element and analyzes emotions
 * 
 * Captures a frame from video element, analyzes emotions, and returns
 * the captured image data along with emotion scores and confidence.
 * 
 * @param video - HTML video element to capture from
 * @returns Promise resolving to object with emotions, image data, and confidence
 */
export const CapturePhotoFromVideo = async (video: HTMLVideoElement): Promise<{ emotions: EmotionScores; imageDataUrl: string; confidence: number } | null> => {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const emotions = await DetectEmotionsFromVideo(video);
    
    if (!emotions) {
      return null;
    }

    const confidence = GetConfidenceLevel(emotions);

    return { emotions, imageDataUrl, confidence };
  } catch (error) {
    return null;
  }
};

/**
 * Analyzes emotions from uploaded image file
 * 
 * Processes an uploaded image file by converting to data URL,
 * loading as Image element, and analyzing emotions using face detection.
 * 
 * @param file - Image file to analyze
 * @returns Promise resolving to object with emotions, image data, and confidence
 */
export const DetectEmotionsFromFile = async (file: File): Promise<{ emotions: EmotionScores; imageDataUrl: string; confidence: number } | null> => {
  if (!modelsLoaded) {
    await LoadModels();
  }

  try {
    const imageDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    const emotions = await DetectEmotionsFromImage(img);
    
    if (!emotions) {
      return null;
    }

    const confidence = GetConfidenceLevel(emotions);

    return { emotions, imageDataUrl, confidence };
  } catch (error) {
    return null;
  }
};

/**
 * Post-processes emotion scores for better sensitivity
 * 
 * Applies post-processing to make emotion detection more sensitive:
 * - Amplifies non-neutral emotions using power scaling
 * - Applies emotion-specific thresholds and amplification factors
 * - Redistributes scores to show more varied emotions
 * - Includes diversity bonus for multiple detected emotions
 * 
 * @param a_emotionScores - Raw emotion scores from face-api.js
 * @returns Enhanced emotion scores with better sensitivity
 */
export const EnhanceEmotionScores = (a_emotionScores: EmotionScores): EmotionScores => {
  // Emotion amplification factors - Aggressive boosting for subtle emotions
  const amplificationFactors = {
    neutral: 0.4,    
    happy: 0.8,      
    sad: 1.8,        
    angry: 2.5,      
    fearful: 2.8,    
    disgusted: 2.2,  
    surprised: 1.6   
  };

  const powerScale = 0.5;
  
  // Step 1: Apply power scaling to reduce dominance
  const scaledScores = Object.entries(a_emotionScores).reduce((acc, [emotion, score]) => {
    acc[emotion as keyof EmotionScores] = Math.pow(score, powerScale);
    return acc;
  }, {} as EmotionScores);

  // Step 2: Apply amplification factors
  const amplifiedScores = Object.entries(scaledScores).reduce((acc, [emotion, score]) => {
    const factor = amplificationFactors[emotion as keyof EmotionScores];
    acc[emotion as keyof EmotionScores] = score * factor;
    return acc;
  }, {} as EmotionScores);

  // Step 3: Normalize scores to sum to 1
  const total = Object.values(amplifiedScores).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) return a_emotionScores; // Fallback to original if all zeros
  
  const normalizedScores = Object.entries(amplifiedScores).reduce((acc, [emotion, score]) => {
    acc[emotion as keyof EmotionScores] = score / total;
    return acc;
  }, {} as EmotionScores);

  // Step 4: Apply VERY low thresholds to capture subtle emotions
  const minThresholds = {
    neutral: 0.05,   
    happy: 0.04,     
    sad: 0.015,      
    angry: 0.008,    
    fearful: 0.005,  
    disgusted: 0.01, 
    surprised: 0.02  
  };

  const enhancedScores = Object.entries(normalizedScores).reduce((acc, [emotion, score]) => {
    const threshold = minThresholds[emotion as keyof EmotionScores];
    // If score is above threshold, keep it, otherwise set to 0
    acc[emotion as keyof EmotionScores] = score >= threshold ? score : 0;
    return acc;
  }, {} as EmotionScores);

  // Final normalization after thresholding
  const finalTotal = Object.values(enhancedScores).reduce((sum, val) => sum + val, 0);
  
  if (finalTotal === 0) return a_emotionScores; // Fallback to original
  
  let finalScores = Object.entries(enhancedScores).reduce((acc, [emotion, score]) => {
    acc[emotion as keyof EmotionScores] = score / finalTotal;
    return acc;
  }, {} as EmotionScores);

  // Step 5: DIVERSITY BONUS - If multiple subtle emotions detected, boost them further
  const subtleEmotions = ['angry', 'fearful', 'disgusted'] as const;
  const detectedSubtleCount = subtleEmotions.filter(emotion => finalScores[emotion] > 0.01).length;
  
  if (detectedSubtleCount >= 2) {
    
    const diversityBoostedScores = Object.entries(finalScores).reduce((acc, [emotion, score]) => {
      if (subtleEmotions.includes(emotion as 'angry' | 'fearful' | 'disgusted') && score > 0.01) {
        acc[emotion as keyof EmotionScores] = score * 1.4;
      } else if (emotion === 'neutral' || emotion === 'happy') {
        acc[emotion as keyof EmotionScores] = score * 0.7;
      } else {
        acc[emotion as keyof EmotionScores] = score;
      }
      return acc;
    }, {} as EmotionScores);
    
    const diversityTotal = Object.values(diversityBoostedScores).reduce((sum, val) => sum + val, 0);
    if (diversityTotal > 0) {
      finalScores = Object.entries(diversityBoostedScores).reduce((acc, [emotion, score]) => {
        acc[emotion as keyof EmotionScores] = score / diversityTotal;
        return acc;
      }, {} as EmotionScores);
    }
  }


  return finalScores;
};

/**
 * Calculates confidence level of emotion detection
 * 
 * Calculates a confidence score based on the spread of emotion values.
 * Higher confidence when one emotion dominates, lower when emotions are similar.
 * 
 * @param a_emotionScores - The emotion scores to analyze
 * @returns Confidence level between 0-1
 */
export const GetConfidenceLevel = (a_emotionScores: EmotionScores): number => {
  const values = Object.values(a_emotionScores);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Higher confidence when max is much higher than average
  return Math.min(1, (max - avg) * 2);
};

/**
 * Formats emotion scores for UI display
 * 
 * Formats emotions as Font Awesome icons + percentages, showing only
 * emotions above threshold. Returns HTML string for direct DOM insertion.
 * 
 * @param a_emotionScores - The emotion scores to format
 * @returns Formatted emotion string with icons and percentages
 */
export const FormatEmotionsForDisplay = (a_emotionScores: EmotionScores): string => {
  const emotionIcons = {
    happy: 'fas fa-smile',
    sad: 'fas fa-frown',
    angry: 'fas fa-angry',
    fearful: 'fas fa-grimace',
    disgusted: 'fas fa-dizzy',
    surprised: 'fas fa-surprise',
    neutral: 'fas fa-meh'
  };

  return Object.entries(a_emotionScores)
    .filter(([, score]) => score > 0.008)
    .sort(([, a], [, b]) => b - a)
    .map(([emotion, score]) => `<i class="${emotionIcons[emotion as keyof typeof emotionIcons]}"></i> ${Math.round(score * 100)}%`)
    .join(' ');
};

/**
 * Gets Font Awesome icon class for an emotion
 * 
 * @param emotion - The emotion to get icon for
 * @returns Font Awesome CSS class string
 */
export const GetEmotionIcon = (emotion: keyof EmotionScores): string => {
  const emotionIcons = {
    happy: 'fas fa-smile',
    sad: 'fas fa-frown',
    angry: 'fas fa-angry',
    fearful: 'fas fa-grimace',
    disgusted: 'fas fa-dizzy',
    surprised: 'fas fa-surprise',
    neutral: 'fas fa-meh'
  };
  
  return emotionIcons[emotion];
};

/**
 * Gets Tailwind CSS color class for an emotion
 * 
 * @param emotion - The emotion to get color for
 * @returns Tailwind CSS text color class string
 */
export const GetEmotionColor = (emotion: keyof EmotionScores): string => {
  const emotionColors = {
    happy: 'text-yellow-500',
    sad: 'text-blue-500',
    angry: 'text-red-500',
    fearful: 'text-purple-500',
    disgusted: 'text-green-500',
    surprised: 'text-orange-500',
    neutral: 'text-gray-500'
  };
  
  return emotionColors[emotion];
};