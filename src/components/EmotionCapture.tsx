
/**
 * EmotionCapture Component
 * 
 * A comprehensive emotion capture component that provides three methods for emotion detection:
 * - Live webcam capture with real-time emotion analysis
 * - Photo upload with emotion detection from static images
 * - Manual emotion input with sliders for user-defined emotion scores
 * 
 * Uses face-api.js for facial emotion recognition and provides confidence scoring
 * for automated detection methods. Supports both dark and light themes.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EmotionScores } from '../types/emotion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  StartWebcamStream,
  StopWebcamStream,
  DetectEmotionsFromVideo,
  CapturePhotoFromVideo,
  DetectEmotionsFromFile,
  GetEmotionIcon,
  GetEmotionColor
} from '../services/emotionDetection';

interface EmotionCaptureProps {
  onEmotionsDetected: (emotions: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const EmotionCapture: React.FC<EmotionCaptureProps> = ({
  onEmotionsDetected,
  onCancel,
  isLoading = false
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<'choose' | 'webcam' | 'upload' | 'review' | 'manual'>('choose');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedEmotions, setDetectedEmotions] = useState<EmotionScores | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionScores | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webcamError, setWebcamError] = useState<string>('');
  const [manualEmotions, setManualEmotions] = useState<EmotionScores>({
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emotionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      StopWebcamStream();
      if (emotionUpdateInterval.current) {
        clearInterval(emotionUpdateInterval.current);
      }
    };
  }, []);

  /**
   * Initiates webcam capture for live emotion detection.
   * Loads emotion detection models, starts webcam stream, and begins real-time emotion analysis.
   * Handles various error states including model loading failures and webcam access issues.
   */
  const handleWebcamCapture = useCallback(async () => {
    setCurrentStep('webcam');
    setWebcamError('');
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const { LoadModels } = await import('../services/emotionDetection');
      setWebcamError('Loading analysis models...');
      await LoadModels();

      setWebcamError('Starting camera...');
      const stream = await StartWebcamStream();
      
      if (!stream) {
        throw new Error('Failed to start webcam stream');
      }

      setWebcamError('');
      
      await new Promise<void>((resolve, reject) => {
        const connectStream = () => {
          const video = videoRef.current;
          if (!video) {
            setTimeout(connectStream, 50);
            return;
          }

          video.srcObject = stream;
          resolve();
        };
        
        connectStream();
        
        // Timeout after 3 seconds
        setTimeout(() => {
          reject(new Error('Timeout waiting for video element'));
        }, 3000);
      });
      
      // Wait for video to be ready and start playback
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current;
        if (!video) {
          reject(new Error('Video element lost during setup'));
          return;
        }

        const handleLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          
          video.play().then(() => {
            resolve();
          }).catch(() => {
            video.play();
            resolve();
          });
        };

        const handleError = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          reject(new Error('Video playback failed'));
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
        
        setTimeout(() => {
          if (video.readyState >= 1) {
            handleLoadedMetadata();
          } else {
            reject(new Error('Video failed to load'));
          }
        }, 5000);
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      emotionUpdateInterval.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const emotions = await DetectEmotionsFromVideo(videoRef.current);
            if (emotions) {
              setCurrentEmotions(emotions);
            }
          } catch (detectionError) {
            // Silent retry for error handling
          }
        }
      }, 1500);

      setIsProcessing(false);
    } catch (error) {
      let errorMessage = 'Failed to access webcam';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setWebcamError(errorMessage);
      setIsProcessing(false);
      
      setTimeout(() => {
        if (webcamError) {
          setCurrentStep('choose');
        }
      }, 3000);
    }
  }, [webcamError]);

  /**
   * Captures a photo from the live webcam stream and analyzes emotions.
   * Processes the captured image for emotion detection and transitions to review step.
   * @returns {Promise<void>} Resolves when photo capture and analysis is complete
   */
  const handleCapturePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    try {
      const result = await CapturePhotoFromVideo(videoRef.current);
      
      if (result) {
        setCapturedImage(result.imageDataUrl);
        setDetectedEmotions(result.emotions);
        setConfidence(result.confidence);
        setCurrentStep('review');
        
        StopWebcamStream();
        if (emotionUpdateInterval.current) {
          clearInterval(emotionUpdateInterval.current);
          emotionUpdateInterval.current = null;
        }
      } else {
        setWebcamError('No face detected');
      }
    } catch (error) {
      setWebcamError('Capture failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Handles file upload for emotion detection from static images.
   * Validates file type, processes the uploaded image, and analyzes emotions.
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input change event
   * @returns {Promise<void>} Resolves when file processing is complete
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setCurrentStep('upload');
    setIsProcessing(true);

    try {
      const result = await DetectEmotionsFromFile(file);
      
      if (result) {
        setCapturedImage(result.imageDataUrl);
        setDetectedEmotions(result.emotions);
        setConfidence(result.confidence);
        setCurrentStep('review');
      } else {
        alert('No face detected in the uploaded image. Please try another image or use manual input.');
        setCurrentStep('choose');
      }
    } catch (error) {
      alert('Failed to process image');
      setCurrentStep('choose');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Switches to manual emotion input mode.
   * Stops any active webcam streams and transitions to manual slider interface.
   */
  const handleManualInput = useCallback(() => {
    // Stop webcam if active
    StopWebcamStream();
    if (emotionUpdateInterval.current) {
      clearInterval(emotionUpdateInterval.current);
      emotionUpdateInterval.current = null;
    }
    setCurrentStep('manual');
  }, []);

  /**
   * Confirms and submits the detected emotions to the parent component.
   * Determines the detection method based on the captured image source.
   */
  const handleConfirmEmotions = useCallback(() => {
    if (detectedEmotions) {
      const method = capturedImage?.startsWith('data:') && capturedImage.includes('base64') ? 'upload' : 'webcam';
      onEmotionsDetected(detectedEmotions, method, confidence);
    }
  }, [detectedEmotions, confidence, capturedImage, onEmotionsDetected]);

  /**
   * Resets the component state to allow for a new emotion capture attempt.
   * Clears captured data and returns to the initial selection screen.
   */
  const handleRetryCapture = useCallback(() => {
    setCapturedImage(null);
    setDetectedEmotions(null);
    setCurrentEmotions(null);
    setConfidence(0);
    setCurrentStep('choose');
  }, []);

  /**
   * Submits manually entered emotion scores to the parent component.
   * Converts percentage values (0-100) to decimal scores (0-1) and validates input.
   */
  const handleManualSubmit = useCallback(() => {
    const total = Object.values(manualEmotions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      // Convert from percentage (0-100) to decimal (0-1)
      const normalizedEmotions: EmotionScores = {
        neutral: manualEmotions.neutral / 100,
        happy: manualEmotions.happy / 100,
        sad: manualEmotions.sad / 100,
        angry: manualEmotions.angry / 100,
        fearful: manualEmotions.fearful / 100,
        disgusted: manualEmotions.disgusted / 100,
        surprised: manualEmotions.surprised / 100
      };
      onEmotionsDetected(normalizedEmotions, 'manual', 1.0);
    }
  }, [manualEmotions, onEmotionsDetected]);

  /**
   * Updates a specific emotion value in the manual input state.
   * @param {keyof EmotionScores} emotion - The emotion type to update
   * @param {number} value - The new value (0-100 percentage)
   */
  const updateManualEmotion = useCallback((emotion: keyof EmotionScores, value: number) => {
    setManualEmotions(prev => ({ ...prev, [emotion]: value }));
  }, []);

  /**
   * Renders emotion scores as styled badges with icons and percentages.
   * Filters out emotions below threshold and sorts by intensity.
   * @param {EmotionScores} emotions - The emotion scores to display
   * @param {boolean} showTitle - Whether to show the "Detected Emotions" title
   * @returns {JSX.Element} The rendered emotion display component
   */
  const renderEmotionDisplay = (emotions: EmotionScores, showTitle: boolean = true) => {
    const sortedEmotions = Object.entries(emotions)
      .filter(([_, score]) => score > 0.008) // VERY low threshold to capture subtle emotions
      .sort(([_, a], [__, b]) => b - a);

    return (
      <div className="space-y-2">
        {showTitle && <p className="text-sm font-medium text-gray-700">Detected Emotions:</p>}
        <div className="flex flex-wrap gap-2">
          {sortedEmotions.map(([emotion, score]) => (
            <span
              key={emotion}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              <i className={`${GetEmotionIcon(emotion as keyof EmotionScores)} ${GetEmotionColor(emotion as keyof EmotionScores)} mr-1`}></i>
              <span className="capitalize">{emotion}</span>
              <span className="ml-1">{Math.round(score * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Processing...</span>
      </div>
    );
  }

  if (currentStep === 'choose') {
    return (
      <div className={`rounded-lg shadow-lg p-6 max-w-md mx-auto ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          How would you like to log your emotions?
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={handleWebcamCapture}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-video mr-2"></i>
            Live Camera
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="fas fa-upload mr-2"></i>
            Upload Photo
          </button>
          
          <button
            onClick={handleManualInput}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-sliders-h mr-2"></i>
            Enter Manually
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {onCancel && (
          <button
            onClick={onCancel}
            className={`w-full mt-3 px-4 py-2 border rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  if (currentStep === 'webcam') {
    return (
      <div className={`rounded-lg shadow-lg p-6 max-w-lg mx-auto ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 text-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Live Emotion Detection
        </h3>
        
        {webcamError ? (
          <div className="text-center p-4">
            <i className={`text-2xl mb-2 ${webcamError.includes('Loading') || webcamError.includes('Starting') ? 'fas fa-spinner fa-spin text-blue-500' : 'fas fa-exclamation-triangle text-red-500'}`}></i>
            <p className={`text-sm ${webcamError.includes('Loading') || webcamError.includes('Starting') ? 'text-blue-600' : 'text-red-600'}`}>{webcamError}</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg bg-gray-200"
                playsInline
                muted
                autoPlay
              />
              {!isProcessing && currentEmotions && (
                <div className="absolute top-2 left-2 bg-green-600 bg-opacity-90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="fas fa-check-circle"></i>
                  <span>Face Detected</span>
                </div>
              )}
              {!isProcessing && !currentEmotions && (
                <div className="absolute top-2 left-2 bg-yellow-600 bg-opacity-90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="fas fa-search"></i>
                  <span>Looking for faces...</span>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-center text-white">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>

            {currentEmotions && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-brain text-green-600"></i>
                  <span className="text-sm font-medium text-green-800">Live Emotion Analysis</span>
                </div>
                {renderEmotionDisplay(currentEmotions)}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleCapturePhoto}
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-camera mr-2"></i>
                Capture Photo
              </button>
              
              <button
                onClick={handleRetryCapture}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Options
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (currentStep === 'upload') {
    return (
      <div className={`rounded-lg shadow-lg p-6 max-w-md mx-auto text-center ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <div className="animate-pulse mb-4">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
          }`}>
            <i className="fas fa-upload text-2xl text-green-600"></i>
          </div>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Processing Image...
        </h3>
        <p className={`${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Analyzing emotions from your uploaded photo.
        </p>
      </div>
    );
  }

  if (currentStep === 'review' && detectedEmotions && capturedImage) {
    return (
      <div className={`rounded-lg shadow-lg p-6 max-w-md mx-auto ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Review Detected Emotions
        </h3>
        
        <div className="mb-4">
          <img 
            src={capturedImage} 
            alt="Captured emotion" 
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        <div className="mb-4">
          {renderEmotionDisplay(detectedEmotions)}
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <span className={`text-sm mr-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Confidence:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${confidence > 0.7 ? 'bg-green-500' : confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(confidence * 100)}%</span>
          </div>
        </div>

        {confidence < 0.5 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-700/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Low confidence detected. You may want to try again or enter emotions manually.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleConfirmEmotions}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="fas fa-check mr-2"></i>
            Use These Emotions
          </button>
          
          <button
            onClick={handleRetryCapture}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Try Again
          </button>
          
          <button
            onClick={handleManualInput}
            className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-edit mr-2"></i>
            Enter Manually Instead
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'manual') {
    const total = Object.values(manualEmotions).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className={`rounded-lg shadow-lg p-6 max-w-md mx-auto ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Rate Your Current Emotions
        </h3>
        
        <div className="space-y-4">
          {(Object.keys(manualEmotions) as Array<keyof EmotionScores>).map((emotion) => (
            <div key={emotion} className="flex items-center space-x-3">
              <div className="w-20 flex items-center">
                <i className={`${GetEmotionIcon(emotion)} ${GetEmotionColor(emotion)} mr-2`}></i>
                <span className="text-sm font-medium capitalize">
                  {emotion}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualEmotions[emotion]}
                onChange={(e) => updateManualEmotion(emotion, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className={`w-10 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {manualEmotions[emotion]}%
              </span>
            </div>
          ))}
        </div>

        {total > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">Preview:</p>
            {renderEmotionDisplay({
              neutral: manualEmotions.neutral / 100,
              happy: manualEmotions.happy / 100,
              sad: manualEmotions.sad / 100,
              angry: manualEmotions.angry / 100,
              fearful: manualEmotions.fearful / 100,
              disgusted: manualEmotions.disgusted / 100,
              surprised: manualEmotions.surprised / 100
            }, false)}
          </div>
        )}

        <div className="space-y-2 mt-6">
          <button
            onClick={handleManualSubmit}
            disabled={total === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-save mr-2"></i>
            Save Emotions
          </button>
          
          <button
            onClick={handleRetryCapture}
            className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-camera mr-2"></i>
            Try Camera Instead
          </button>
        </div>
      </div>
    );
  }

  return null;
};