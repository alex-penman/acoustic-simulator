/**
 * Recording Controls
 * Record/Stop buttons and recording status
 */

import React, { useState, useEffect } from 'react';
import styles from './RecordingControls.module.css';

export function RecordingControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingCount = 0
}) {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 0.1);
      }, 100);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.toString().padStart(4, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.recordingStatus}>
        {isRecording ? (
          <>
            <span className={styles.indicator}>●</span>
            <span className={styles.status}>Recording...</span>
            <span className={styles.time}>{formatTime(recordingTime)}</span>
          </>
        ) : (
          <>
            <span className={styles.count}>
              {recordingCount} recording{recordingCount !== 1 ? 's' : ''} this round
            </span>
          </>
        )}
      </div>

      <div className={styles.buttons}>
        {!isRecording ? (
          <button className={styles.recordBtn} onClick={onStartRecording}>
            🎤 Start Recording
          </button>
        ) : (
          <button className={styles.stopBtn} onClick={onStopRecording}>
            ⏹ Stop Recording
          </button>
        )}
      </div>

      <div className={styles.instructions}>
        <p>1. Click "Start Recording"</p>
        <p>2. Clearly say the sound "{'{phoneme}'}"</p>
        <p>3. Click "Stop Recording"</p>
        <p>4. Correct the system's guess</p>
      </div>
    </div>
  );
}
