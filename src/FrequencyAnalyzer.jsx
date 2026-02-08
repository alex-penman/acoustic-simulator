/**
 * Frequency Analyzer Component
 * Displays frequency spectrum like an EQ in Logic Pro
 * Stage 2 of TruePhonetics learning journey
 */

import React, { useEffect, useRef, useState } from 'react';
import styles from './FrequencyAnalyzer.module.css';
import { FFTAnalyzer } from './fftAnalyzer';
import { PHONEMES } from './phonemeDatabase';

export function FrequencyAnalyzer({ pressureData, phoneme, sampleRate = 44100 }) {
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const [peakFrequency, setPeakFrequency] = useState(0);
  const [targetPhoneme, setTargetPhoneme] = useState(null);

  // Initialize FFT analyzer
  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new FFTAnalyzer(1024);
    }
  }, []);

  // Set target phoneme data
  useEffect(() => {
    if (phoneme && PHONEMES[phoneme]) {
      setTargetPhoneme(PHONEMES[phoneme]);
    }
  }, [phoneme]);

  // Render frequency spectrum
  useEffect(() => {
    if (!canvasRef.current || !pressureData || pressureData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Analyze frequency content
    const magnitude = analyzerRef.current.analyze(pressureData);
    const bands = analyzerRef.current.getFrequencyBands(32, sampleRate);
    const peaks = analyzerRef.current.findPeaks(-20);

    // Find peak frequency
    if (peaks.length > 0) {
      setPeakFrequency(Math.round(peaks[0].frequency));
    }

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw target frequency range (if phoneme selected)
    if (targetPhoneme) {
      drawTargetRange(ctx, width, height, targetPhoneme, sampleRate);
    }

    // Draw frequency bars (like EQ)
    drawFrequencyBars(ctx, width, height, bands);

    // Draw peak markers
    drawPeaks(ctx, width, height, peaks.slice(0, 5), sampleRate);

    // Draw waveform overlay
    drawWaveform(ctx, width, height, pressureData);
  }, [pressureData, targetPhoneme, sampleRate]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Frequency Spectrum (EQ View)</h3>
        <div className={styles.info}>
          <span>Peak: {peakFrequency} Hz</span>
          {targetPhoneme && (
            <span style={{ color: targetPhoneme.color }}>
              Target: {targetPhoneme.targetFrequencies.peak || targetPhoneme.targetFrequencies.F1} Hz
            </span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className={styles.canvas}
      />

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.barColor}></span>
          <span>Frequency magnitude</span>
        </div>
        {targetPhoneme && (
          <div className={styles.legendItem}>
            <span
              className={styles.targetColor}
              style={{ backgroundColor: targetPhoneme.color }}
            ></span>
            <span>Target range for {targetPhoneme.symbol}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Draw grid lines and labels
 */
function drawGrid(ctx, width, height) {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';

  // Vertical grid lines (frequency)
  const frequencies = [0, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
  for (const freq of frequencies) {
    const x = (freq / 8000) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillText(freq, x, height - 5);
  }

  // Horizontal grid lines (magnitude)
  ctx.fillStyle = '#64748b';
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Labels
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Frequency (Hz)', 10, 15);
  ctx.fillText('Magnitude (dB)', 10, 30);
}

/**
 * Draw target frequency range for phoneme
 */
function drawTargetRange(ctx, width, height, phoneme, sampleRate) {
  const target = phoneme.targetFrequencies;
  if (!target.min || !target.max) return;

  const xMin = (target.min / 8000) * width;
  const xMax = (target.max / 8000) * width;

  ctx.fillStyle = phoneme.color;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(xMin, 0, xMax - xMin, height);
  ctx.globalAlpha = 1.0;

  // Draw border
  ctx.strokeStyle = phoneme.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(xMin, 0, xMax - xMin, height);
}

/**
 * Draw frequency bars (like EQ sliders)
 */
function drawFrequencyBars(ctx, width, height, bands) {
  const barWidth = width / bands.length;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const normalizedMagnitude = Math.min(band.magnitude * 10, 1); // Normalize
    const barHeight = normalizedMagnitude * height * 0.9;

    const x = i * barWidth;
    const y = height - barHeight;

    // Color based on magnitude
    const hue = (1 - normalizedMagnitude) * 240; // Blue to Red
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(x, y, barWidth - 2, barHeight);

    // Outline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth - 2, barHeight);
  }
}

/**
 * Draw peak frequency markers
 */
function drawPeaks(ctx, width, height, peaks, sampleRate) {
  ctx.font = 'bold 10px monospace';

  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    const x = (peak.frequency / 8000) * width;
    const y = height - peak.magnitude * height * 10;

    // Draw marker
    ctx.fillStyle = i === 0 ? '#FFD700' : '#FFA500'; // Gold for peak, orange for others
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw frequency label
    ctx.fillStyle = i === 0 ? '#FFD700' : '#FFA500';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(peak.frequency)}`, x, Math.max(y - 15, 15));
  }
}

/**
 * Draw waveform overlay (semi-transparent)
 */
function drawWaveform(ctx, width, height, pressureData) {
  if (!pressureData || pressureData.length === 0) return;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;

  const step = Math.ceil(pressureData.length / width);
  const baseline = height / 2;

  ctx.beginPath();
  for (let i = 0; i < pressureData.length; i += step) {
    const x = (i / pressureData.length) * width;
    const y = baseline - (pressureData[i] / 10000) * (height / 2);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}
