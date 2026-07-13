import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Camera, Check, ChevronDown, RotateCcw, SlidersHorizontal, Upload } from 'lucide-react';
import { EmotionScores } from '../types/emotion';
import EmotionDisplay from './features/emotion/EmotionDisplay';
import ManualEmotionInput from './features/emotion/ManualEmotionInput';

interface EmotionCaptureProps {
  onEmotionsDetected: (emotions: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

type Step = 'choose' | 'camera' | 'processing' | 'review' | 'manual';
type ExpressionAdapter = typeof import('../services/emotionDetection');

export const EmotionCapture: React.FC<EmotionCaptureProps> = ({ onEmotionsDetected, onCancel, isLoading = false }) => {
  const [step, setStep] = useState<Step>('choose');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedEmotions, setDetectedEmotions] = useState<EmotionScores | null>(null);
  const [liveEmotions, setLiveEmotions] = useState<EmotionScores | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [method, setMethod] = useState<'webcam' | 'upload'>('webcam');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adapterRef = useRef<ExpressionAdapter | null>(null);

  const getAdapter = useCallback(async () => {
    if (adapterRef.current) return adapterRef.current;
    const adapter = await import('../services/emotionDetection');
    adapterRef.current = adapter;
    return adapter;
  }, []);

  const stopCamera = useCallback(() => {
    adapterRef.current?.StopWebcamStream();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const reset = () => {
    stopCamera();
    setStep('choose');
    setCapturedImage(null);
    setDetectedEmotions(null);
    setLiveEmotions(null);
    setConfidence(0);
    setError('');
  };

  const startCamera = async () => {
    setStep('camera');
    setBusy(true);
    setError('');
    try {
      const adapter = await getAdapter();
      await adapter.LoadModels();
      const stream = await adapter.StartWebcamStream();
      await new Promise(resolve => window.setTimeout(resolve, 30));
      if (!videoRef.current) throw new Error('Camera view could not start.');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      intervalRef.current = setInterval(async () => {
        if (videoRef.current?.readyState && videoRef.current.readyState >= 2) {
          const scores = await adapter.DetectEmotionsFromVideo(videoRef.current).catch(() => null);
          if (scores) setLiveEmotions(scores);
        }
      }, 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Camera access failed.');
    } finally {
      setBusy(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    setError('');
    try {
      const adapter = await getAdapter();
      const result = await adapter.CapturePhotoFromVideo(videoRef.current);
      if (!result) throw new Error('No face was found in the frame.');
      setCapturedImage(result.imageDataUrl);
      setDetectedEmotions(result.emotions);
      setConfidence(result.confidence);
      setMethod('webcam');
      stopCamera();
      setStep('review');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The frame could not be analyzed.');
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    setStep('processing');
    setBusy(true);
    setError('');
    try {
      const adapter = await getAdapter();
      const result = await adapter.DetectEmotionsFromFile(file);
      if (!result) throw new Error('No face was found in that image.');
      setCapturedImage(result.imageDataUrl);
      setDetectedEmotions(result.emotions);
      setConfidence(result.confidence);
      setMethod('upload');
      setStep('review');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The image could not be analyzed.');
      setStep('choose');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  if (isLoading) return <div className="loading-state"><div className="loading-spinner" /><span>Updating recommendations</span></div>;

  if (step === 'choose') {
    return (
      <div className="capture-shell">
        <div className="capture-copy">
          <h3>Set the emotional mix</h3>
          <p>Direct input is the primary record. Expression estimates are optional suggestions that you review before saving.</p>
        </div>
        {error && <div className="notice notice--error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
        <button className="capture-primary-path" onClick={() => setStep('manual')} type="button">
          <span className="capture-primary-path__icon"><SlidersHorizontal size={23} /></span>
          <span><strong>Set it yourself</strong><small>Use direct controls to record the emotional mix in your own terms.</small></span>
          <ArrowLeft className="capture-primary-path__arrow" size={19} />
        </button>
        <details className="optional-sources">
          <summary>
            <span><strong>Optional expression estimate</strong><small>Use one frame or photo as an editable starting suggestion.</small></span>
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <div className="optional-source-grid">
            <button className="optional-source" onClick={() => void startCamera()} type="button"><Camera size={20} /><span><strong>Use camera</strong><small>Estimate from one expression frame.</small></span></button>
            <button className="optional-source" onClick={() => fileRef.current?.click()} type="button"><Upload size={20} /><span><strong>Use a photo</strong><small>Choose an image already on this device.</small></span></button>
          </div>
          <p className="capture-privacy">Frames and photos are analyzed in this browser and are never attached to the diary entry.</p>
        </details>
        <input accept="image/*" className="sr-only" onChange={uploadPhoto} ref={fileRef} type="file" />
        {onCancel && <button className="button button--ghost" onClick={onCancel} type="button">Cancel</button>}
      </div>
    );
  }

  if (step === 'processing') {
    return <div className="loading-state"><div className="loading-spinner" /><span>Estimating the expression</span></div>;
  }

  if (step === 'camera') {
    return (
      <div className="capture-shell">
        {error && <div className="notice notice--error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
        <div className="capture-video">
          <video aria-label="Camera preview" muted playsInline ref={videoRef} />
          <span className="capture-status">{busy ? 'Starting camera' : liveEmotions ? 'Face found' : 'Looking for a face'}</span>
        </div>
        {liveEmotions && <EmotionDisplay emotions={liveEmotions} />}
        <div className="capture-actions">
          <button className="button button--primary" disabled={busy} onClick={() => void captureFrame()} type="button"><Camera size={17} />Use this frame</button>
          <button className="button button--ghost" onClick={reset} type="button"><ArrowLeft size={17} />Choose another method</button>
        </div>
      </div>
    );
  }

  if (step === 'manual') {
    return (
      <div className="capture-shell">
        <ManualEmotionInput onSubmit={(scores) => onEmotionsDetected(scores, 'manual', 1)} showSubmitButton />
        <button className="button button--ghost" onClick={reset} type="button"><ArrowLeft size={17} />Choose another method</button>
      </div>
    );
  }

  return (
    <div className="capture-shell">
      {capturedImage && <div className="capture-preview"><img alt="Selected expression preview" src={capturedImage} /></div>}
      <div className="capture-copy">
        <h3>Review the result</h3>
        <p>This is an expression estimate. Keep it, try again, or replace it with your own input.</p>
      </div>
      {detectedEmotions && <EmotionDisplay emotions={detectedEmotions} />}
      <p className="metadata">Estimate confidence: {Math.round(confidence * 100)}%</p>
      <div className="capture-actions">
        <button className="button button--primary" disabled={!detectedEmotions} onClick={() => detectedEmotions && onEmotionsDetected(detectedEmotions, method, confidence)} type="button"><Check size={17} />Use this feeling</button>
        <button className="button button--secondary" onClick={reset} type="button"><RotateCcw size={17} />Try again</button>
        <button className="button button--ghost" onClick={() => setStep('manual')} type="button"><SlidersHorizontal size={17} />Adjust manually</button>
      </div>
    </div>
  );
};

export default EmotionCapture;
