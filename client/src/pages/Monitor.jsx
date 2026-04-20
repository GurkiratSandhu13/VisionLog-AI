import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../services/api';
import { useAttendanceCapture } from '../hooks/useWebcam';

export default function Monitor() {
  const [session, setSession] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [activeMatches, setActiveMatches] = useState([]);
  const canvasRef = useRef(null);
  
  const handleMatch = (matches) => {
    setActiveMatches(prev => {
      const merged = [...prev];
      matches.forEach(m => {
        if (!merged.find(x => x.user_id === m.user_id)) {
          merged.push(m);
        }
      });
      return merged;
    });
    drawOverlays(matches);
  };
  
  const webcamRef = useAttendanceCapture(session?.id, handleMatch);
  
  const startSession = async () => {
    if (!sessionName) return;
    try {
      const { data } = await api.post('/attendance/sessions', { session_name: sessionName });
      setSession(data);
    } catch(e) {
      console.error(e);
    }
  };
  
  const submitSession = async () => {
    if (!session) return;
    try {
      await api.post('/attendance/submit', { session_id: session.id, submitted_by: 'Admin' });
      setSession(null);
      setSessionName('');
      setActiveMatches([]);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const drawOverlays = (matches) => {
    const canvas = canvasRef.current;
    const webcam = webcamRef.current;
    if (!canvas || !webcam) return;

    const video = webcam.video;
    if (!video || video.readyState !== 4) return;

    // Use displayed size, not raw video resolution
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    const rawWidth = video.videoWidth;
    const rawHeight = video.videoHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Scale factors to convert raw video coords to display coords
    const scaleX = displayWidth / rawWidth;
    const scaleY = displayHeight / rawHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    matches.forEach(match => {
      const [top, right, bottom, left] = match.location;

      // Apply scale factors
      const x1 = left * scaleX;
      const y1 = top * scaleY;
      const x2 = right * scaleX;
      const y2 = bottom * scaleY;
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      // Bounding box
      ctx.strokeStyle = '#B8953F';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, boxWidth, boxHeight);

      // Label background
      ctx.fillStyle = '#B8953F';
      const labelHeight = 28;
      ctx.fillRect(x1, y2, boxWidth, labelHeight);

      // Label text — increased font size for readability
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "DM Sans", sans-serif';
      ctx.fillText(
        `${match.name}  ${(match.confidence * 100).toFixed(1)}%`,
        x1 + 6,
        y2 + 19
      );
    });

    setTimeout(() => {
      if (canvasRef.current) {
        const c = canvasRef.current;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
      }
    }, 1900);
  };

  return (
    <>
      {!session ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '40px'
        }}>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '52px',
            fontWeight: 300,
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            Live Monitor
          </h1>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '48px' }}>
            <div className="form-group">
              <label className="input-label">Session Name</label>
              <input
                className="input-field"
                placeholder="e.g. CS101 Morning Lecture"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startSession()}
              />
            </div>
            <button 
              className="btn-primary" 
              onClick={startSession}
              style={{ width: '100%', marginTop: '8px' }}
            >
              INITIALIZE SESSION
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 40px'
        }}>
          
          {/* LEFT — webcam 70% */}
          <div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              position: 'relative', 
              border: '2px solid #B8953F',
              lineHeight: 0,
              overflow: 'hidden'
            }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
            </div>
            <button 
              className="btn-primary" 
              onClick={submitSession}
              style={{ marginTop: '16px', width: '100%' }}
            >
              FINALIZE SESSION
            </button>
          </div>

          {/* RIGHT — detected list 30% */}
          <div style={{ 
            flex: '0 0 calc(30% - 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <p style={{ 
              fontSize: '12px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: 'var(--color-text-muted)',
              margin: '0 0 8px 0',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)'
            }}>
              Detected
            </p>
            
            {activeMatches.map((m, i) => (
              <div key={m.user_id || i} 
                className="card"
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  animation: 'fadeIn 300ms ease forwards', 
                  opacity: 0 
                }}
              >
                <div style={{ 
                  width: '36px', height: '36px', flexShrink: 0,
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-alt)',
                  display: 'flex', alignItems: 'center', 
                  justifyContent: 'center',
                  fontFamily: '"Cormorant Garamond", serif',
                  color: 'var(--color-accent)', fontSize: '18px'
                }}>
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: 500 }}>
                    {m.name}
                  </p>
                  <span style={{ 
                    fontSize: '11px', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 8px'
                  }}>
                    {(m.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}

            {activeMatches.length === 0 && (
              <p style={{ 
                fontSize: '13px', fontStyle: 'italic',
                color: 'var(--color-text-muted)', 
                textAlign: 'center', paddingTop: '40px',
                fontFamily: '"Cormorant Garamond", serif'
              }}>
                Awaiting detection...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
