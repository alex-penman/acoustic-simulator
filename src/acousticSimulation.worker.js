/**
 * Acoustic Simulation Web Worker
 *
 * Runs acoustic simulation in background thread to avoid blocking main UI
 * Sends back pressure samples at intervals
 */

import { AcousticSimulator, AudioBuffer } from './acousticCore';

let simulator = null;
let audioBuffer = null;
let isRunning = false;
let totalStepsRun = 0;

/**
 * Initialize simulation from main thread request
 */
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      initializeSimulation(data);
      break;

    case 'addSource':
      if (simulator) {
        simulator.addSource(
          data.x,
          data.y,
          data.frequency,
          data.amplitude,
          data.type,
          data.duration
        );
      }
      break;

    case 'addStringSource':
      if (simulator) {
        simulator.addStringSource(
          data.startX,
          data.startY,
          data.endX,
          data.endY,
          data.frequency,
          data.amplitude
        );
      }
      break;

    case 'addMembraneSource':
      if (simulator) {
        simulator.addMembraneSource(
          data.centerX,
          data.centerY,
          data.radius,
          data.frequency,
          data.amplitude,
          data.mode
        );
      }
      break;

    case 'run':
      runSimulation(data);
      break;

    case 'reset':
      if (simulator) {
        simulator.reset();
        audioBuffer.clear();
        totalStepsRun = 0;
      }
      self.postMessage({ type: 'reset', success: true });
      break;

    case 'getAudio':
      if (audioBuffer) {
        const audioData = audioBuffer.toAudioBuffer();
        // Transfer the array buffer for zero-copy
        self.postMessage({
          type: 'audioData',
          samples: audioData,
          sampleRate: audioBuffer.sampleRate,
          numSamples: audioData.length
        }, [audioData.buffer]);
      }
      break;

    case 'getState':
      if (simulator) {
        self.postMessage({
          type: 'state',
          maxPressure: simulator.maxPressure,
          energy: simulator.energyContent,
          totalSteps: totalStepsRun,
          gridWidth: simulator.width,
          gridHeight: simulator.height
        });
      }
      break;
  }
};

/**
 * Initialize simulator
 */
function initializeSimulation(config) {
  const {
    gridWidth = 128,
    gridHeight = 128,
    sampleRate = 44100,
    speedOfSound = 343,
    dampingFactor = 0.9995
  } = config;

  simulator = new AcousticSimulator({
    width: gridWidth,
    height: gridHeight,
    speedOfSound,
    dampingFactor,
    timeStep: 1 / sampleRate
  });

  audioBuffer = new AudioBuffer(sampleRate);
  totalStepsRun = 0;

  self.postMessage({
    type: 'initialized',
    config: {
      gridWidth,
      gridHeight,
      sampleRate,
      speedOfSound,
      dampingFactor
    }
  });
}

/**
 * Run simulation for N steps
 */
function runSimulation(config) {
  const { numSteps = 1000, reportInterval = 100 } = config;

  if (!simulator || !audioBuffer) {
    self.postMessage({ type: 'error', message: 'Simulator not initialized' });
    return;
  }

  const sampleRate = audioBuffer.sampleRate;
  const startStep = totalStepsRun;

  try {
    for (let step = startStep; step < startStep + numSteps; step++) {
      const time = step / sampleRate;

      // Run simulation step
      simulator.step(time);

      // Capture audio
      const signal = simulator.getMicrophoneSignal();
      audioBuffer.addSample(signal);

      totalStepsRun++;

      // Report progress at intervals
      if ((step - startStep + 1) % reportInterval === 0) {
        self.postMessage({
          type: 'progress',
          currentStep: step + 1,
          totalSteps: startStep + numSteps,
          maxPressure: simulator.maxPressure,
          energy: simulator.energyContent
        });
      }
    }

    // Final completion message
    self.postMessage({
      type: 'complete',
      totalSteps: totalStepsRun,
      maxPressure: simulator.maxPressure,
      energy: simulator.energyContent,
      audioDuration: totalStepsRun / sampleRate
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
  }
}
