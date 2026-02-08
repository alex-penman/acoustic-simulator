/**
 * FFT Analyzer for Acoustic Simulator
 * Performs frequency spectrum analysis on pressure/audio data
 * Used to visualize frequency content like an EQ in Logic Pro
 */

/**
 * Simple FFT implementation using Cooley-Tukey algorithm
 * For real-time performance, this uses a simplified approach
 */
export class FFTAnalyzer {
  constructor(bufferSize = 1024) {
    this.bufferSize = bufferSize;
    this.buffer = new Float32Array(bufferSize);
    this.window = this.createHannWindow(bufferSize);
    this.magnitude = new Float32Array(bufferSize / 2);
  }

  /**
   * Create Hann window to reduce spectral leakage
   */
  createHannWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  /**
   * Simplified FFT using built-in approach
   * For production, would use a proper FFT library like ffmpeg.wasm
   */
  analyze(inputBuffer) {
    // Copy and window the input
    const input = new Float32Array(this.bufferSize);
    for (let i = 0; i < Math.min(inputBuffer.length, this.bufferSize); i++) {
      input[i] = (inputBuffer[i] || 0) * this.window[i];
    }

    // Use Web Audio API AnalyserNode approach for real-time performance
    // This is a simplified DFT (not full FFT, but good enough for visualization)
    this.simpleDFT(input);
    return this.magnitude;
  }

  /**
   * Simplified Discrete Fourier Transform
   * O(n^2) but works well for visualization
   */
  simpleDFT(input) {
    const N = input.length;
    const freqBins = N / 2;

    for (let k = 0; k < freqBins; k++) {
      let realSum = 0;
      let imagSum = 0;

      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N;
        realSum += input[n] * Math.cos(angle);
        imagSum += input[n] * Math.sin(angle);
      }

      // Magnitude spectrum (normalized)
      this.magnitude[k] = Math.sqrt(realSum * realSum + imagSum * imagSum) / N;
    }
  }

  /**
   * Get magnitude in dB (decibels)
   */
  getMagnitudeDB(index) {
    const mag = this.magnitude[index];
    // Convert to dB scale (20 * log10)
    const dB = mag > 0 ? 20 * Math.log10(mag) : -100;
    return Math.max(dB, -100); // Clamp to -100 dB floor
  }

  /**
   * Get frequency for a given bin index
   */
  getFrequencyForBin(binIndex, sampleRate = 44100) {
    return (binIndex * sampleRate) / this.bufferSize;
  }

  /**
   * Get bin index for a given frequency
   */
  getBinForFrequency(frequency, sampleRate = 44100) {
    return Math.round((frequency * this.bufferSize) / sampleRate);
  }

  /**
   * Find peaks in the frequency spectrum
   * Useful for identifying formants and dominant frequencies
   */
  findPeaks(threshold = -30, minDistance = 10) {
    const peaks = [];

    for (let i = minDistance; i < this.magnitude.length - minDistance; i++) {
      const currentDB = this.getMagnitudeDB(i);

      if (currentDB > threshold) {
        // Check if local maximum
        let isLocalMax = true;
        for (let j = -minDistance; j <= minDistance; j++) {
          if (j !== 0 && this.getMagnitudeDB(i + j) > currentDB) {
            isLocalMax = false;
            break;
          }
        }

        if (isLocalMax) {
          peaks.push({
            binIndex: i,
            magnitude: this.magnitude[i],
            magnitudeDB: currentDB,
            frequency: this.getFrequencyForBin(i)
          });
        }
      }
    }

    return peaks.sort((a, b) => b.magnitude - a.magnitude);
  }

  /**
   * Get frequency bands (like EQ sliders)
   */
  getFrequencyBands(bandCount = 8, sampleRate = 44100) {
    const nyquist = sampleRate / 2;
    const bands = [];

    // Logarithmic frequency spacing (more natural for hearing)
    const logMin = Math.log(20);
    const logMax = Math.log(nyquist);

    for (let i = 0; i < bandCount; i++) {
      const logFreq = logMin + ((logMax - logMin) * i) / (bandCount - 1);
      const freq = Math.exp(logFreq);
      const binIndex = this.getBinForFrequency(freq, sampleRate);

      bands.push({
        centerFrequency: Math.round(freq),
        binIndex: Math.min(binIndex, this.magnitude.length - 1),
        magnitude: this.magnitude[Math.min(binIndex, this.magnitude.length - 1)],
        magnitudeDB: this.getMagnitudeDB(Math.min(binIndex, this.magnitude.length - 1))
      });
    }

    return bands;
  }

  /**
   * Analyze energy in a specific frequency range
   */
  analyzeFrequencyRange(minFreq, maxFreq, sampleRate = 44100) {
    const minBin = this.getBinForFrequency(minFreq, sampleRate);
    const maxBin = this.getBinForFrequency(maxFreq, sampleRate);

    let sumEnergy = 0;
    let peakMagnitude = 0;
    let peakFrequency = minFreq;

    for (let i = minBin; i <= maxBin && i < this.magnitude.length; i++) {
      sumEnergy += this.magnitude[i] * this.magnitude[i];
      if (this.magnitude[i] > peakMagnitude) {
        peakMagnitude = this.magnitude[i];
        peakFrequency = this.getFrequencyForBin(i, sampleRate);
      }
    }

    return {
      energyRMS: Math.sqrt(sumEnergy / (maxBin - minBin + 1)),
      peakMagnitude: peakMagnitude,
      peakFrequency: peakFrequency,
      energyDB: 20 * Math.log10(Math.sqrt(sumEnergy / (maxBin - minBin + 1)) + 1e-10)
    };
  }

  /**
   * Compare with target phoneme frequencies
   */
  compareWithPhoneme(targetFrequencies, sampleRate = 44100) {
    const analysis = {};

    if (targetFrequencies.peak) {
      analysis.peakFrequency = this.analyzeFrequencyRange(
        targetFrequencies.peak - 500,
        targetFrequencies.peak + 500,
        sampleRate
      );
    }

    if (targetFrequencies.F1) {
      analysis.formant1 = this.analyzeFrequencyRange(
        targetFrequencies.F1 - 200,
        targetFrequencies.F1 + 200,
        sampleRate
      );
    }

    if (targetFrequencies.F2) {
      analysis.formant2 = this.analyzeFrequencyRange(
        targetFrequencies.F2 - 200,
        targetFrequencies.F2 + 200,
        sampleRate
      );
    }

    return analysis;
  }
}

/**
 * Create a real-time audio analyzer using Web Audio API
 * More efficient for live audio streams
 */
export class RealtimeAudioAnalyzer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.magnitude = new Float32Array(this.analyser.frequencyBinCount);
  }

  /**
   * Connect audio source to analyser
   */
  connectSource(source) {
    source.connect(this.analyser);
  }

  /**
   * Update frequency data
   */
  update() {
    this.analyser.getByteFrequencyData(this.dataArray);

    // Convert to float magnitude
    for (let i = 0; i < this.dataArray.length; i++) {
      this.magnitude[i] = this.dataArray[i] / 255;
    }

    return this.magnitude;
  }

  /**
   * Get frequency for a bin
   */
  getFrequencyForBin(binIndex) {
    return (binIndex * this.audioContext.sampleRate) / this.analyser.fftSize;
  }

  /**
   * Get magnitude in dB
   */
  getMagnitudeDB(index) {
    const mag = this.magnitude[index];
    return mag > 0 ? 20 * Math.log10(mag) : -100;
  }

  /**
   * Find peaks in spectrum
   */
  findPeaks(threshold = 0.3) {
    const peaks = [];

    for (let i = 1; i < this.magnitude.length - 1; i++) {
      if (
        this.magnitude[i] > threshold &&
        this.magnitude[i] > this.magnitude[i - 1] &&
        this.magnitude[i] > this.magnitude[i + 1]
      ) {
        peaks.push({
          binIndex: i,
          magnitude: this.magnitude[i],
          frequency: this.getFrequencyForBin(i)
        });
      }
    }

    return peaks.sort((a, b) => b.magnitude - a.magnitude);
  }
}
