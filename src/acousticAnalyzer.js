/**
 * Acoustic Analyzer
 * Extracts phonetic features from audio data
 * Features: voicing, formants, pitch, duration, intensity, spectral characteristics
 */

export class AcousticAnalyzer {
  constructor(audioContext = null) {
    this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
  }

  /**
   * Analyze complete audio buffer
   * Returns comprehensive phonetic features
   */
  analyzeAudio(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;

    // Extract all features
    const features = {
      duration: duration,
      energy: this.analyzeEnergy(channelData),
      voicing: this.analyzeVoicing(channelData),
      pitch: this.analyzePitch(channelData),
      formants: this.analyzeFormants(channelData),
      spectralCentroid: this.analyzeSpectralCentroid(channelData),
      zeroCrossingRate: this.analyzeZeroCrossingRate(channelData),
      mfcc: this.analyzeMFCC(channelData),
      timeSeriesData: this.extractTimeSeriesData(channelData),
      summary: null
    };

    // Generate summary for quick assessment
    features.summary = this.generateSummary(features);

    return features;
  }

  /**
   * Analyze energy/intensity over time
   */
  analyzeEnergy(audioData) {
    const frameSize = Math.floor(this.sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(this.sampleRate * 0.010); // 10ms hop
    const energy = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      let sum = 0;
      for (let j = 0; j < frameSize; j++) {
        sum += audioData[i + j] * audioData[i + j];
      }
      energy.push(sum / frameSize);
    }

    // Normalize to 0-1
    const maxEnergy = Math.max(...energy);
    const normalizedEnergy = energy.map(e => e / maxEnergy);

    return {
      values: normalizedEnergy,
      mean: normalizedEnergy.reduce((a, b) => a + b) / normalizedEnergy.length,
      max: Math.max(...normalizedEnergy),
      min: Math.min(...normalizedEnergy),
      dB: 20 * Math.log10(Math.max(...normalizedEnergy) + 1e-10)
    };
  }

  /**
   * Detect voicing (vocal fold vibration)
   */
  analyzeVoicing(audioData) {
    const frameSize = Math.floor(this.sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(this.sampleRate * 0.010); // 10ms hop
    const voicingFrames = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const isVoiced = this.isFrameVoiced(frame);
      voicingFrames.push(isVoiced ? 1 : 0);
    }

    const voicingRatio = voicingFrames.reduce((a, b) => a + b) / voicingFrames.length;

    return {
      frames: voicingFrames,
      voicingRatio: voicingRatio, // 0-1: 0=unvoiced, 1=voiced
      isVoiced: voicingRatio > 0.5,
      voicedSegments: this.getVoicedSegments(voicingFrames)
    };
  }

  /**
   * Determine if a frame is voiced using energy and periodicity
   */
  isFrameVoiced(frame) {
    // Method 1: Energy threshold
    const energy = frame.reduce((sum, s) => sum + s * s, 0) / frame.length;
    if (energy < 0.001) return false; // Silent

    // Method 2: Zero crossing rate (voiced has low ZCR)
    const zcr = this.calculateZeroCrossingRate(frame);
    if (zcr > 0.2) return false; // High ZCR = unvoiced

    // Method 3: Autocorrelation (periodicity indicates voicing)
    const autocorr = this.calculateAutocorrelation(frame);
    return autocorr > 0.5;
  }

  /**
   * Calculate zero crossing rate (fricatives have high ZCR)
   */
  calculateZeroCrossingRate(frame) {
    let crossings = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0 && frame[i - 1] < 0) || (frame[i] < 0 && frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / frame.length;
  }

  /**
   * Calculate autocorrelation (detects periodicity/voicing)
   */
  calculateAutocorrelation(frame, lag = 80) {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < frame.length - lag; i++) {
      numerator += frame[i] * frame[i + lag];
      denominator += frame[i] * frame[i] + frame[i + lag] * frame[i + lag];
    }

    return Math.abs(numerator) / (denominator + 1e-10);
  }

  /**
   * Analyze fundamental frequency (pitch)
   */
  analyzePitch(audioData) {
    const frameSize = Math.floor(this.sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(this.sampleRate * 0.010); // 10ms hop
    const pitchValues = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitch = this.estimatePitch(frame);
      if (pitch > 50) { // Only valid pitches (> 50 Hz)
        pitchValues.push(pitch);
      }
    }

    const validPitches = pitchValues.filter(p => p > 50 && p < 400); // Typical range

    return {
      values: pitchValues,
      mean: validPitches.length > 0 ? validPitches.reduce((a, b) => a + b) / validPitches.length : 0,
      min: validPitches.length > 0 ? Math.min(...validPitches) : 0,
      max: validPitches.length > 0 ? Math.max(...validPitches) : 0,
      contour: validPitches // Pitch over time
    };
  }

  /**
   * Estimate pitch using autocorrelation method
   */
  estimatePitch(frame) {
    let maxCorr = 0;
    let bestLag = 0;
    const minLag = Math.floor(this.sampleRate / 400); // Min 400 Hz
    const maxLag = Math.floor(this.sampleRate / 50); // Max 50 Hz

    for (let lag = minLag; lag < maxLag; lag++) {
      const corr = this.calculateAutocorrelation(frame, lag);
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }

    return this.sampleRate / bestLag;
  }

  /**
   * Analyze formants (resonance peaks in spectrum)
   * F1, F2, F3 characterize vowel identity
   */
  analyzeFormants(audioData) {
    const fft = this.performFFT(audioData);
    const magnitude = this.getFFTMagnitude(fft);
    const frequency = this.getFrequencyBins(magnitude.length);

    // Find peaks in spectrum (formants)
    const peaks = this.findPeaks(magnitude, frequency);
    const formants = peaks
      .slice(0, 3) // Top 3 formants
      .map(peak => ({
        frequency: peak.frequency,
        magnitude: peak.magnitude,
        bandwidth: this.estimateBandwidth(magnitude, frequency, peak.frequency)
      }));

    return {
      f1: formants[0] || { frequency: 0, magnitude: 0 },
      f2: formants[1] || { frequency: 0, magnitude: 0 },
      f3: formants[2] || { frequency: 0, magnitude: 0 },
      allFormants: formants
    };
  }

  /**
   * Find peaks in frequency spectrum
   */
  findPeaks(magnitude, frequency, threshold = 0.1) {
    const peaks = [];
    const maxMagnitude = Math.max(...magnitude);

    for (let i = 1; i < magnitude.length - 1; i++) {
      if (
        magnitude[i] > threshold * maxMagnitude &&
        magnitude[i] > magnitude[i - 1] &&
        magnitude[i] > magnitude[i + 1]
      ) {
        peaks.push({
          frequency: frequency[i],
          magnitude: magnitude[i],
          index: i
        });
      }
    }

    return peaks.sort((a, b) => b.magnitude - a.magnitude);
  }

  /**
   * Estimate bandwidth of a resonance peak
   */
  estimateBandwidth(magnitude, frequency, peakFreq) {
    const peakIndex = frequency.findIndex(f => f >= peakFreq);
    if (peakIndex === -1) return 0;

    const peakMag = magnitude[peakIndex];
    const halfPower = peakMag / Math.sqrt(2);

    let lowIndex = peakIndex;
    let highIndex = peakIndex;

    // Find half-power points
    for (let i = peakIndex; i > 0; i--) {
      if (magnitude[i] < halfPower) {
        lowIndex = i;
        break;
      }
    }

    for (let i = peakIndex; i < magnitude.length; i++) {
      if (magnitude[i] < halfPower) {
        highIndex = i;
        break;
      }
    }

    return frequency[highIndex] - frequency[lowIndex];
  }

  /**
   * Analyze spectral centroid (brightness of sound)
   */
  analyzeSpectralCentroid(audioData) {
    const fft = this.performFFT(audioData);
    const magnitude = this.getFFTMagnitude(fft);
    const frequency = this.getFrequencyBins(magnitude.length);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < magnitude.length; i++) {
      numerator += frequency[i] * magnitude[i];
      denominator += magnitude[i];
    }

    const centroid = numerator / (denominator + 1e-10);

    return {
      centroid: centroid, // Hz
      brightness: centroid / (this.sampleRate / 2) // Normalized 0-1
    };
  }

  /**
   * Analyze zero crossing rate (fricative indicator)
   */
  analyzeZeroCrossingRate(audioData) {
    const frameSize = Math.floor(this.sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(this.sampleRate * 0.010); // 10ms hop
    const zcrValues = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const zcr = this.calculateZeroCrossingRate(frame);
      zcrValues.push(zcr);
    }

    return {
      values: zcrValues,
      mean: zcrValues.reduce((a, b) => a + b) / zcrValues.length,
      isFricative: this.isFricative(zcrValues) // High ZCR = fricative
    };
  }

  /**
   * Estimate if sound is fricative (high ZCR)
   */
  isFricative(zcrValues) {
    const meanZCR = zcrValues.reduce((a, b) => a + b) / zcrValues.length;
    return meanZCR > 0.15; // Threshold for fricatives
  }

  /**
   * Calculate MFCCs (Mel-Frequency Cepstral Coefficients)
   * Used for phoneme classification
   */
  analyzeMFCC(audioData, numCoeffs = 13) {
    const fft = this.performFFT(audioData);
    const magnitude = this.getFFTMagnitude(fft);

    // Apply mel scale
    const melSpectrum = this.applyMelScale(magnitude);

    // Log compression
    const logMel = melSpectrum.map(m => Math.log(m + 1e-10));

    // DCT (Discrete Cosine Transform)
    const mfcc = this.discreteCosineTransform(logMel, numCoeffs);

    return {
      coefficients: mfcc,
      spectrum: melSpectrum
    };
  }

  /**
   * Convert frequency scale to Mel scale
   */
  applyMelScale(magnitude) {
    const numMels = 40;
    const fmin = 50;
    const fmax = this.sampleRate / 2;

    const melMin = this.freqToMel(fmin);
    const melMax = this.freqToMel(fmax);

    const melSpectrum = [];
    for (let i = 0; i < numMels; i++) {
      const mel = melMin + (i / (numMels - 1)) * (melMax - melMin);
      const freq = this.melToFreq(mel);
      const binIndex = Math.floor(freq / (this.sampleRate / magnitude.length));
      melSpectrum.push(magnitude[Math.min(binIndex, magnitude.length - 1)]);
    }

    return melSpectrum;
  }

  /**
   * Convert frequency to Mel scale
   */
  freqToMel(freq) {
    return 2595 * Math.log10(1 + freq / 700);
  }

  /**
   * Convert Mel scale to frequency
   */
  melToFreq(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * Discrete Cosine Transform
   */
  discreteCosineTransform(input, numCoeffs) {
    const output = [];
    const N = input.length;

    for (let k = 0; k < numCoeffs; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
      }
      output.push(sum);
    }

    return output;
  }

  /**
   * Perform FFT using simple DFT (for production, use FFTJS)
   */
  performFFT(audioData) {
    const N = Math.pow(2, Math.ceil(Math.log2(audioData.length)));
    const fft = [];

    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < audioData.length; n++) {
        const angle = (-2 * Math.PI * k * n) / N;
        real += audioData[n] * Math.cos(angle);
        imag += audioData[n] * Math.sin(angle);
      }

      fft.push({ real, imag });
    }

    return fft;
  }

  /**
   * Get magnitude spectrum from FFT
   */
  getFFTMagnitude(fft) {
    return fft.map(({ real, imag }) => Math.sqrt(real * real + imag * imag) / fft.length);
  }

  /**
   * Get frequency bins for FFT
   */
  getFrequencyBins(length) {
    const frequency = [];
    for (let i = 0; i < length; i++) {
      frequency.push((i * this.sampleRate) / (length * 2));
    }
    return frequency;
  }

  /**
   * Extract time series data for visualization
   */
  extractTimeSeriesData(audioData) {
    const frameSize = 512;
    const timeSeries = [];

    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const energy = frame.reduce((sum, s) => sum + s * s, 0) / frame.length;
      timeSeries.push({
        time: i / this.sampleRate,
        energy: Math.sqrt(energy),
        sample: frame[0]
      });
    }

    return timeSeries;
  }

  /**
   * Get voiced segments (timestamps of voiced regions)
   */
  getVoicedSegments(voicingFrames) {
    const frameTime = 0.010; // 10ms per frame
    const segments = [];
    let inVoiced = false;
    let startTime = 0;

    for (let i = 0; i < voicingFrames.length; i++) {
      const isVoiced = voicingFrames[i] > 0;

      if (isVoiced && !inVoiced) {
        startTime = i * frameTime;
        inVoiced = true;
      } else if (!isVoiced && inVoiced) {
        segments.push({
          start: startTime,
          end: i * frameTime,
          duration: i * frameTime - startTime
        });
        inVoiced = false;
      }
    }

    if (inVoiced) {
      segments.push({
        start: startTime,
        end: voicingFrames.length * frameTime,
        duration: voicingFrames.length * frameTime - startTime
      });
    }

    return segments;
  }

  /**
   * Generate summary assessment
   */
  generateSummary(features) {
    return {
      soundType: this.classifySoundType(features),
      quality: this.assessQuality(features),
      phonemeHints: this.getPhonemeHints(features),
      characteristics: {
        voicing: features.voicing.isVoiced ? 'voiced' : 'unvoiced',
        isFricative: features.zeroCrossingRate.isFricative,
        brightness: features.spectralCentroid.brightness > 0.5 ? 'bright' : 'dark',
        pitch: features.pitch.mean > 0 ? `~${Math.round(features.pitch.mean)}Hz` : 'no pitch',
        energy: `${(features.energy.dB).toFixed(1)}dB`
      }
    };
  }

  /**
   * Classify what type of sound was recorded
   */
  classifySoundType(features) {
    if (!features.voicing.isVoiced && features.zeroCrossingRate.isFricative) {
      return 'unvoiced fricative (f, s, sh, etc.)';
    } else if (features.voicing.isVoiced && features.zeroCrossingRate.isFricative) {
      return 'voiced fricative (v, z, zh, etc.)';
    } else if (!features.voicing.isVoiced && !features.zeroCrossingRate.isFricative) {
      return 'unvoiced stop (p, t, k, etc.)';
    } else if (features.voicing.isVoiced && features.pitch.mean > 80) {
      return 'voiced sound (vowel, nasal, or voiced stop)';
    } else {
      return 'unknown';
    }
  }

  /**
   * Assess recording quality
   */
  assessQuality(features) {
    const issues = [];

    if (features.energy.max < 0.3) {
      issues.push('too quiet');
    }
    if (features.energy.max > 0.95) {
      issues.push('clipping/distortion');
    }

    return {
      score: 100 - issues.length * 20,
      issues: issues,
      isGood: issues.length === 0
    };
  }

  /**
   * Get hints about which phoneme was likely recorded
   */
  getPhonemeHints(features) {
    const hints = [];

    // Voicing
    if (features.voicing.isVoiced) {
      hints.push('This is VOICED (vocal cords vibrating)');
    } else {
      hints.push('This is UNVOICED (no vocal cord vibration)');
    }

    // Fricative
    if (features.zeroCrossingRate.isFricative) {
      hints.push('High friction noise - could be fricative or affricate');
    }

    // Formants
    if (features.formants.f1.frequency > 200) {
      hints.push(`F1 at ~${Math.round(features.formants.f1.frequency)}Hz suggests vowel-like sound`);
    }

    // Pitch
    if (features.pitch.mean > 80 && features.pitch.mean < 250) {
      hints.push(`Pitch around ${Math.round(features.pitch.mean)}Hz detected`);
    }

    return hints;
  }
}
