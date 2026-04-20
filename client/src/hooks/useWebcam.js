import { useRef, useCallback, useEffect } from 'react';
import api from '../services/api';

export function useAttendanceCapture(sessionId, onMatch) {
  const webcamRef = useRef(null);

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current || !sessionId) return;
    const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!imageSrc) return;
    
    const base64 = imageSrc.split(',')[1]; 
    if (!base64) return;
    
    try {
      const { data } = await api.post('/attendance/recognize', {
        frame_base64: base64,
        session_id: sessionId
      });
      if (data.matches && data.matches.length > 0) {
        onMatch(data.matches);
      }
    } catch (e) {
      console.error('Recognition error:', e);
    }
  }, [sessionId, onMatch]);

  useEffect(() => {
    const interval = setInterval(captureAndRecognize, 2000);
    return () => clearInterval(interval);
  }, [captureAndRecognize]);

  return webcamRef;
}
