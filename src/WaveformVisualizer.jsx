/**
 * Waveform Visualizer
 * Displays audio waveform as a visual representation
 */

import React, { useEffect, useRef } from 'react';
import styles from './WaveformVisualizer.module.css';

export function WaveformVisualizer({ data, phonemeColor = '#60a5fa' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = phonemeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const samplesPerPixel = data.length / width;
    const centerY = height / 2;

    for (let x = 0; x < width; x++) {
      const startIdx = Math.floor(x * samplesPerPixel);
      const endIdx = Math.floor((x + 1) * samplesPerPixel);

      let max = 0;
      for (let i = startIdx; i < endIdx && i < data.length; i++) {
        max = Math.max(max, data[i]);
      }

      const y = centerY - max * (height / 2);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, [data, phonemeColor]);

  return (
    <div className={styles.container}>
      <h4>Waveform</h4>
      <canvas ref={canvasRef} width={800} height={150} className={styles.canvas} />
      <div className={styles.info}>
        <span className={styles.label}>Visual representation of recorded audio</span>
      </div>
    </div>
  );
}
