# Emotion Detection System

## Overview
The EmotionFlix emotion detection system uses face-api.js to analyze facial expressions from webcam photos and provides manual input as a fallback option.

## Features

### Webcam Capture
- Real-time photo capture using user's webcam
- Automatic face detection and emotion analysis
- Confidence scoring for detection accuracy
- Immediate stream cleanup after capture
- No persistent image storage for privacy

### Manual Input
- Slider-based emotion intensity controls
- Real-time preview of emotion distribution
- Fallback when webcam detection fails or confidence is low

### Confidence System
- Detection confidence calculated based on emotion value spread
- Low confidence triggers manual input recommendation
- Confidence stored with emotion data for future analysis

## Technical Implementation

### Core Components
- `EmotionCapture.tsx` - Main UI component for emotion capture
- `emotionDetection.ts` - Service layer for face-api.js integration
- Face-api.js models stored in `/public/models/`

### Models Required
- SSD MobileNet v1 (face detection)
- Face Landmark 68 (facial landmarks)
- Face Expression Net (emotion classification)

### Emotion Types
All emotions are scored on a 0-1 scale:
- neutral
- happy
- sad
- angry
- fearful
- disgusted
- surprised

### Database Schema
```sql
-- Updated emotions table
ALTER TABLE emotions ADD COLUMN confidence DECIMAL(3,2) DEFAULT 0.00;
```

## Usage Flow

### 1. Webcam Detection
1. User selects "Take Photo with Camera"
2. System requests webcam permission
3. Photo is captured after 1-second adjustment period
4. Face-api.js analyzes emotions
5. Results displayed with confidence indicator
6. User can accept, retry, or switch to manual input

### 2. Manual Input
1. User selects "Enter Manually" or system fallback
2. Emotion sliders displayed (0-100%)
3. Real-time preview shows normalized percentages
4. User submits when satisfied

### 3. Confidence Handling
- High confidence (>70%): Green indicator, direct acceptance
- Medium confidence (40-70%): Yellow indicator, user choice
- Low confidence (<40%): Red indicator, manual input recommended

## Privacy & Security
- No images stored permanently
- Webcam stream immediately closed after capture
- Face detection runs locally in browser
- Emotion data stored with user consent only

## Browser Compatibility
- Requires modern browser with MediaDevices API
- HTTPS required for webcam access in production
- Progressive enhancement for unsupported browsers

## Performance Considerations
- Face-api.js models (~5MB total) cached after first load
- Processing time ~1-2 seconds for emotion analysis
- Automatic memory cleanup prevents leaks

## Error Handling
- Webcam permission denied → Manual input fallback
- No face detected → Manual input option
- Low confidence → User choice with recommendation
- Network issues → Graceful degradation to manual input