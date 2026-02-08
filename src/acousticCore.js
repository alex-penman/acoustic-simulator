/**
 * Acoustic Wave Equation Solver
 *
 * Simulates 2D acoustic wave propagation using Finite Difference Method (FDM)
 * Models sound sources (strings, vocal cords, membranes) and particle motion
 *
 * Core equation: ∂²p/∂t² = c² ∇²p
 * where p = pressure, c = speed of sound (~343 m/s)
 */

export class AcousticSimulator {
  constructor(options = {}) {
    // Grid dimensions
    this.width = options.width || 128;
    this.height = options.height || 128;
    this.cellSize = options.cellSize || 0.01; // meters per cell

    // Physics parameters
    this.speedOfSound = options.speedOfSound || 343; // m/s at 20°C
    this.airDensity = options.airDensity || 1.2; // kg/m³
    this.timeStep = options.timeStep || 0.00001; // seconds

    // Stability check (CFL condition): c * dt / dx <= 1
    const cflNumber = (this.speedOfSound * this.timeStep) / this.cellSize;
    if (cflNumber > 1) {
      console.warn(`CFL number ${cflNumber} > 1, simulation may be unstable. Reducing timestep.`);
      this.timeStep = (0.9 * this.cellSize) / this.speedOfSound;
    }

    // Calculate coefficient for wave equation
    this.coeff = Math.pow((this.speedOfSound * this.timeStep) / this.cellSize, 2);

    // Pressure field (current, previous, and next)
    this.pressure = this._createGrid(0);
    this.pressurePrev = this._createGrid(0);
    this.pressureNext = this._createGrid(0);

    // Particle velocity fields
    this.velocityX = this._createGrid(0);
    this.velocityY = this._createGrid(0);

    // Source map
    this.sources = [];
    this.sourceValues = this._createGrid(0);

    // Damping for energy dissipation
    this.dampingFactor = options.dampingFactor || 0.9995;

    // Microphone position
    this.microphoneX = Math.floor(this.width / 2);
    this.microphoneY = Math.floor(this.height / 2);

    // Statistics
    this.maxPressure = 0;
    this.energyContent = 0;
  }

  /**
   * Create a 2D grid filled with initial value
   */
  _createGrid(value) {
    return Array(this.height).fill(null).map(() => Array(this.width).fill(value));
  }

  /**
   * Add a sound source (guitar string, vocal cord, etc.)
   */
  addSource(x, y, frequency, amplitude, type = 'sine', duration = Infinity) {
    this.sources.push({
      x: Math.floor(x),
      y: Math.floor(y),
      frequency,
      amplitude,
      type,
      duration,
      startTime: this.time || 0,
      phase: 0
    });
  }

  /**
   * Add a circular membrane source (drumhead, speaker)
   */
  addMembraneSource(centerX, centerY, radius, frequency, amplitude, mode = 0) {
    const startTime = this.time || 0;

    this.sources.push({
      type: 'membrane',
      centerX: Math.floor(centerX),
      centerY: Math.floor(centerY),
      radius,
      frequency,
      amplitude,
      mode,
      startTime,
      phase: 0
    });
  }

  /**
   * Add a vibrating string (guitar string, vocal cord)
   */
  addStringSource(startX, startY, endX, endY, frequency, amplitude) {
    this.sources.push({
      type: 'string',
      startX: Math.floor(startX),
      startY: Math.floor(startY),
      endX: Math.floor(endX),
      endY: Math.floor(endY),
      frequency,
      amplitude,
      startTime: this.time || 0,
      phase: 0
    });
  }

  /**
   * Update source values based on current time and source properties
   */
  _updateSources(time) {
    this.sourceValues = this._createGrid(0);

    for (const source of this.sources) {
      // Check if source is still active
      const elapsed = time - source.startTime;
      if (elapsed < 0 || elapsed > source.duration) continue;

      let value = 0;

      if (source.type === 'sine' || source.type === 'point') {
        // Simple sinusoidal source
        value = source.amplitude * Math.sin(2 * Math.PI * source.frequency * time + source.phase);

        if (this._inBounds(source.x, source.y)) {
          this.sourceValues[source.y][source.x] += value;
        }
      }
      else if (source.type === 'string') {
        // Vibrating string (line source)
        value = source.amplitude * Math.sin(2 * Math.PI * source.frequency * time);

        const points = this._bresenhamLine(source.startX, source.startY, source.endX, source.endY);
        for (const [x, y] of points) {
          if (this._inBounds(x, y)) {
            this.sourceValues[y][x] += value;
          }
        }
      }
      else if (source.type === 'membrane') {
        // Circular membrane (drumhead, speaker)
        value = source.amplitude * Math.sin(2 * Math.PI * source.frequency * time);

        for (let dy = -source.radius; dy <= source.radius; dy++) {
          for (let dx = -source.radius; dx <= source.radius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= source.radius) {
              const x = source.centerX + dx;
              const y = source.centerY + dy;

              if (this._inBounds(x, y)) {
                // Weighted by distance from center
                const weight = Math.cos((Math.PI * dist) / (2 * source.radius));
                this.sourceValues[y][x] += value * weight;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Bresenham line algorithm for string sources
   */
  _bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0, y = y0;
    while (true) {
      points.push([x, y]);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    return points;
  }

  /**
   * Boundary check
   */
  _inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Calculate Laplacian (discrete second derivative)
   */
  _laplacian(grid, x, y) {
    const up = y > 0 ? grid[y - 1][x] : 0;
    const down = y < this.height - 1 ? grid[y + 1][x] : 0;
    const left = x > 0 ? grid[y][x - 1] : 0;
    const right = x < this.width - 1 ? grid[y][x + 1] : 0;
    const center = grid[y][x];

    return up + down + left + right - 4 * center;
  }

  /**
   * Calculate particle velocity from pressure gradient
   */
  _calculateVelocity() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Pressure gradient (finite difference)
        const dpDx = x < this.width - 1 ?
          this.pressure[y][x + 1] - this.pressure[y][x] : 0;
        const dpDy = y < this.height - 1 ?
          this.pressure[y + 1][x] - this.pressure[y][x] : 0;

        // Particle velocity: v = -(1/ρ) * ∇p
        this.velocityX[y][x] = -dpDx / (this.airDensity * this.cellSize);
        this.velocityY[y][x] = -dpDy / (this.airDensity * this.cellSize);
      }
    }
  }

  /**
   * Run one timestep of the simulation
   */
  step(time) {
    this.time = time;

    // Update source values
    this._updateSources(time);

    // Apply wave equation: p_new = 2*p - p_old + coeff*∇²p + source
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const laplacian = this._laplacian(this.pressure, x, y);

        this.pressureNext[y][x] =
          2 * this.pressure[y][x]
          - this.pressurePrev[y][x]
          + this.coeff * laplacian
          + this.sourceValues[y][x];

        // Apply damping
        this.pressureNext[y][x] *= this.dampingFactor;
      }
    }

    // Roll buffers
    [this.pressurePrev, this.pressure, this.pressureNext] =
    [this.pressure, this.pressureNext, this.pressurePrev];

    // Calculate particle velocities
    this._calculateVelocity();

    // Update statistics
    this._updateStats();
  }

  /**
   * Update simulation statistics
   */
  _updateStats() {
    this.maxPressure = 0;
    this.energyContent = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const p = Math.abs(this.pressure[y][x]);
        this.maxPressure = Math.max(this.maxPressure, p);

        const vx = this.velocityX[y][x];
        const vy = this.velocityY[y][x];
        this.energyContent += (p * p + 0.5 * this.airDensity * (vx * vx + vy * vy));
      }
    }
  }

  /**
   * Get pressure at microphone position (for audio synthesis)
   */
  getMicrophoneSignal() {
    if (this._inBounds(this.microphoneX, this.microphoneY)) {
      return this.pressure[this.microphoneY][this.microphoneX];
    }
    return 0;
  }

  /**
   * Get pressure field snapshot
   */
  getPressureField() {
    return this.pressure;
  }

  /**
   * Get particle velocity magnitude field (for visualization)
   */
  getVelocityMagnitude() {
    const magnitude = this._createGrid(0);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const vx = this.velocityX[y][x];
        const vy = this.velocityY[y][x];
        magnitude[y][x] = Math.sqrt(vx * vx + vy * vy);
      }
    }

    return magnitude;
  }

  /**
   * Get particle velocity vector field
   */
  getVelocityVectors(scale = 4) {
    const vectors = [];

    for (let y = 0; y < this.height; y += scale) {
      for (let x = 0; x < this.width; x += scale) {
        vectors.push({
          x: x * this.cellSize,
          y: y * this.cellSize,
          vx: this.velocityX[y][x],
          vy: this.velocityY[y][x],
          magnitude: Math.sqrt(
            this.velocityX[y][x] ** 2 +
            this.velocityY[y][x] ** 2
          )
        });
      }
    }

    return vectors;
  }

  /**
   * Reset simulation
   */
  reset() {
    this.pressure = this._createGrid(0);
    this.pressurePrev = this._createGrid(0);
    this.pressureNext = this._createGrid(0);
    this.velocityX = this._createGrid(0);
    this.velocityY = this._createGrid(0);
    this.sources = [];
    this.sourceValues = this._createGrid(0);
    this.time = 0;
    this.maxPressure = 0;
    this.energyContent = 0;
  }
}

/**
 * Audio Synthesis Buffer
 * Converts pressure samples into PCM audio
 */
export class AudioBuffer {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.samples = [];
    this.maxValue = 0;
  }

  addSample(pressure) {
    this.samples.push(pressure);
    this.maxValue = Math.max(this.maxValue, Math.abs(pressure));
  }

  /**
   * Normalize to [-1, 1] range for audio
   */
  normalize() {
    if (this.maxValue === 0) return this.samples;

    return this.samples.map(s => s / (this.maxValue * 1.1)); // slight headroom
  }

  /**
   * Convert to Web Audio API Float32Array
   */
  toAudioBuffer() {
    const normalized = this.normalize();
    return new Float32Array(normalized);
  }

  /**
   * Clear buffer
   */
  clear() {
    this.samples = [];
    this.maxValue = 0;
  }
}

/**
 * Run simulation for specified duration and capture audio
 */
export function runSimulation(config = {}) {
  const {
    duration = 1.0, // seconds
    gridWidth = 128,
    gridHeight = 128,
    sampleRate = 44100,
    frequency = 440, // A4 note
    sourceX = 0.5, // normalized 0-1
    sourceY = 0.5,
    amplitude = 1000,
    sourceType = 'sine'
  } = config;

  const simulator = new AcousticSimulator({
    width: gridWidth,
    height: gridHeight,
    timeStep: 1 / sampleRate
  });

  const audioBuffer = new AudioBuffer(sampleRate);
  const simDuration = duration;
  const numSteps = Math.floor(simDuration * sampleRate);

  // Add source
  const x = Math.floor(sourceX * gridWidth);
  const y = Math.floor(sourceY * gridHeight);

  simulator.addSource(x, y, frequency, amplitude, sourceType, simDuration);

  // Run simulation
  for (let step = 0; step < numSteps; step++) {
    const time = step / sampleRate;
    simulator.step(time);

    const signal = simulator.getMicrophoneSignal();
    audioBuffer.addSample(signal);
  }

  return {
    simulator,
    audioBuffer,
    samples: audioBuffer.toAudioBuffer(),
    sampleRate
  };
}
