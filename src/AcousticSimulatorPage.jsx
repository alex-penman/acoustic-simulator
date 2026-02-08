/**
 * Acoustic Simulator Feature Page
 * Integrates into lit-mvp React architecture
 *
 * Place at: web/src/pages/AcousticSimulatorPage.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './AcousticSimulatorPage.module.css';
import { AcousticSimulator, AudioBuffer } from '../components/acoustics/acousticCore';

export function AcousticSimulatorPage() {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simulator, setSimulator] = useState(null);
  const [parameters, setParameters] = useState({
    frequency: 440,
    amplitude: 5000,
    sourceX: 0.5,
    sourceY: 0.5,
    sourceType: 'sine',
    gridSize: 128,
    dampingFactor: 0.9995,
    visualizationMode: 'pressure'
  });
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioContextRef = useRef(null);
  const animationIdRef = useRef(null);
  const timeRef = useRef(0);
  const sampleRateRef = useRef(44100);

  // Initialize simulator
  useEffect(() => {
    const sim = new AcousticSimulator({
      width: parameters.gridSize,
      height: parameters.gridSize,
      dampingFactor: parameters.dampingFactor,
      timeStep: 1 / sampleRateRef.current
    });

    const x = Math.floor(parameters.sourceX * parameters.gridSize);
    const y = Math.floor(parameters.sourceY * parameters.gridSize);

    sim.addSource(x, y, parameters.frequency, parameters.amplitude, parameters.sourceType, 100);

    setSimulator(sim);
    setAudioBuffer(new AudioBuffer(sampleRateRef.current));
  }, [parameters]);

  // Draw pressure field
  const drawPressure = (ctx, pressureField) => {
    const canvas = canvasRef.current;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    const maxPressure = Math.max(1, simulator.maxPressure);

    for (let y = 0; y < parameters.gridSize; y++) {
      for (let x = 0; x < parameters.gridSize; x++) {
        const idx = (y * parameters.gridSize + x) * 4;
        const pressure = pressureField[y][x];
        const normalized = Math.max(-1, Math.min(1, pressure / maxPressure));

        if (normalized > 0) {
          data[idx] = Math.floor(255 * normalized);
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = Math.floor(255 * -normalized);
        }
        data[idx + 3] = 255;
      }
    }

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvas.width;
    scaledCanvas.height = canvas.height;
    const scaledCtx = scaledCanvas.getContext('2d');

    scaledCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(scaledCanvas, 0, 0, canvas.width, canvas.height);
  };

  // Draw velocity vectors
  const drawVelocity = (ctx, velocityMagnitude) => {
    const canvas = canvasRef.current;
    const cellPixels = canvas.width / parameters.gridSize;
    const maxVelocity = Math.max(1, Math.max(...velocityMagnitude.flat()));

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.lineWidth = 1;

    for (let y = 0; y < parameters.gridSize; y += 4) {
      for (let x = 0; x < parameters.gridSize; x += 4) {
        const vx = simulator.velocityX[y][x];
        const vy = simulator.velocityY[y][x];
        const magnitude = Math.sqrt(vx * vx + vy * vy);

        const scale = Math.min(1, magnitude / maxVelocity) * cellPixels * 0.8;

        const px1 = (x + 0.5) * cellPixels;
        const py1 = (y + 0.5) * cellPixels;
        const px2 = px1 + vx * scale / maxVelocity;
        const py2 = py1 + vy * scale / maxVelocity;

        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      }
    }
  };

  // Animation loop
  const animate = () => {
    if (!simulator || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const time = timeRef.current / sampleRateRef.current;

    simulator.step(time);

    const pressureField = simulator.getPressureField();
    const velocityMagnitude = simulator.getVelocityMagnitude();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (parameters.visualizationMode === 'pressure' || parameters.visualizationMode === 'both') {
      drawPressure(ctx, pressureField);
    }

    if (parameters.visualizationMode === 'velocity' || parameters.visualizationMode === 'both') {
      drawVelocity(ctx, velocityMagnitude);
    }

    // Microphone position
    const micPixelX = (simulator.microphoneX + 0.5) * (canvasRef.current.width / parameters.gridSize);
    const micPixelY = (simulator.microphoneY + 0.5) * (canvasRef.current.height / parameters.gridSize);

    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(micPixelX, micPixelY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Collect audio
    const signal = simulator.getMicrophoneSignal();
    audioBuffer.addSample(signal);

    // Stats
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`Pressure: ${simulator.maxPressure.toFixed(1)} Pa`, 10, 20);
    ctx.fillText(`Energy: ${(simulator.energyContent / 1e6).toFixed(2)} MJ`, 10, 35);
    ctx.fillText(`Time: ${time.toFixed(3)}s`, 10, 50);

    timeRef.current++;

    if (isRunning) {
      animationIdRef.current = requestAnimationFrame(animate);
    }
  };

  const toggleSimulation = () => {
    if (isRunning) {
      setIsRunning(false);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    } else {
      setIsRunning(true);
      timeRef.current = 0;
      setAudioBuffer(new AudioBuffer(sampleRateRef.current));
      animate();
    }
  };

  const playAudio = async () => {
    if (!audioBuffer || audioBuffer.samples.length === 0) {
      alert('No audio to play. Run simulation first.');
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const audioData = audioBuffer.toAudioBuffer();

    const buffer = ctx.createBuffer(1, audioData.length, sampleRateRef.current);
    buffer.getChannelData(0).set(audioData);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  const reset = () => {
    setIsRunning(false);
    timeRef.current = 0;
    if (simulator) {
      simulator.reset();
    }
    setAudioBuffer(new AudioBuffer(sampleRateRef.current));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🌊 Acoustic Wave Simulator</h1>
        <p>Visualize sound waves generated from vibrations</p>
      </header>

      <div className={styles.mainContent}>
        {/* Canvas visualization */}
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className={styles.canvas}
          />
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#ff0000' }}></div>
              <span>Positive Pressure</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#0000ff' }}></div>
              <span>Negative Pressure</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#00ff00' }}></div>
              <span>Particle Velocity</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#ffff00' }}></div>
              <span>Microphone</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlSection}>
            <h3>Source Parameters</h3>

            <div className={styles.controlGroup}>
              <label>Frequency (Hz)</label>
              <input
                type="range"
                min="20"
                max="2000"
                value={parameters.frequency}
                onChange={(e) => setParameters({ ...parameters, frequency: parseFloat(e.target.value) })}
                disabled={isRunning}
                className={styles.slider}
              />
              <span className={styles.value}>{parameters.frequency} Hz</span>
            </div>

            <div className={styles.controlGroup}>
              <label>Amplitude</label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={parameters.amplitude}
                onChange={(e) => setParameters({ ...parameters, amplitude: parseFloat(e.target.value) })}
                disabled={isRunning}
                className={styles.slider}
              />
              <span className={styles.value}>{parameters.amplitude}</span>
            </div>

            <div className={styles.controlGroup}>
              <label>Source X Position</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parameters.sourceX}
                onChange={(e) => setParameters({ ...parameters, sourceX: parseFloat(e.target.value) })}
                disabled={isRunning}
                className={styles.slider}
              />
              <span className={styles.value}>{(parameters.sourceX * 100).toFixed(0)}%</span>
            </div>

            <div className={styles.controlGroup}>
              <label>Source Y Position</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parameters.sourceY}
                onChange={(e) => setParameters({ ...parameters, sourceY: parseFloat(e.target.value) })}
                disabled={isRunning}
                className={styles.slider}
              />
              <span className={styles.value}>{(parameters.sourceY * 100).toFixed(0)}%</span>
            </div>

            <div className={styles.controlGroup}>
              <label>Source Type</label>
              <select
                value={parameters.sourceType}
                onChange={(e) => setParameters({ ...parameters, sourceType: e.target.value })}
                disabled={isRunning}
                className={styles.select}
              >
                <option value="sine">Sine Wave</option>
                <option value="square">Square Wave</option>
                <option value="point">Point Pulse</option>
              </select>
            </div>
          </div>

          <div className={styles.controlSection}>
            <h3>Simulation Settings</h3>

            <div className={styles.controlGroup}>
              <label>Grid Size</label>
              <select
                value={parameters.gridSize}
                onChange={(e) => setParameters({ ...parameters, gridSize: parseInt(e.target.value) })}
                disabled={isRunning}
                className={styles.select}
              >
                <option value="64">64×64 (Fast)</option>
                <option value="128">128×128 (Balanced)</option>
                <option value="256">256×256 (Detailed)</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label>Damping Factor</label>
              <input
                type="range"
                min="0.99"
                max="0.9999"
                step="0.0001"
                value={parameters.dampingFactor}
                onChange={(e) => setParameters({ ...parameters, dampingFactor: parseFloat(e.target.value) })}
                disabled={isRunning}
                className={styles.slider}
              />
              <span className={styles.value}>{parameters.dampingFactor.toFixed(4)}</span>
            </div>

            <div className={styles.controlGroup}>
              <label>Visualization Mode</label>
              <select
                value={parameters.visualizationMode}
                onChange={(e) => setParameters({ ...parameters, visualizationMode: e.target.value })}
                className={styles.select}
              >
                <option value="pressure">Pressure Field</option>
                <option value="velocity">Velocity Vectors</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.buttons}>
        <button
          onClick={toggleSimulation}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          {isRunning ? '⏸ Stop' : '▶ Start'}
        </button>

        <button
          onClick={playAudio}
          className={`${styles.button} ${styles.buttonSecondary}`}
        >
          🔊 Play Audio
        </button>

        <button
          onClick={reset}
          className={`${styles.button} ${styles.buttonTertiary}`}
        >
          ↺ Reset
        </button>
      </div>

      {/* Info */}
      <footer className={styles.footer}>
        <p>
          <strong>How it works:</strong> The wave equation (∂²p/∂t² = c²∇²p) simulates how sound propagates through air.
          The yellow dot captures pressure at a microphone location, which is converted to audio via Web Audio API.
        </p>
      </footer>
    </div>
  );
}

export default AcousticSimulatorPage;
