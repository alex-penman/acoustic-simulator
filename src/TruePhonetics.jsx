/**
 * TruePhonetics Learning Journey
 * Three stages: Particle Vibration → Frequency Spectrum → Sound Comparison
 *
 * This component shows the complete physics of how specific phonemes are produced
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './TruePhonetics.module.css';
import { AcousticSimulator } from './acousticCore';
import { FrequencyAnalyzer } from './FrequencyAnalyzer';
import { PHONEMES, PHONEME_GROUPS, getPhoneme } from './phonemeDatabase';

export function TruePhonetics() {
  // Selected phoneme
  const [selectedPhoneme, setSelectedPhoneme] = useState('f');
  const [phonemeGroup, setPhonemeGroup] = useState('fricatives');

  // Simulation state
  const [simulator, setSimulator] = useState(null);
  const [pressureData, setPressureData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Current stage
  const [stage, setStage] = useState(1);

  // Phoneme parameters
  const phonemeData = getPhoneme(selectedPhoneme);

  // Initialize simulator
  useEffect(() => {
    if (!simulator) {
      const newSimulator = new AcousticSimulator(128);
      newSimulator.setDampingFactor(0.9995);
      setSimulator(newSimulator);
    }
  }, []);

  // Run simulation loop
  useEffect(() => {
    if (!simulator || !isSimulating) return;

    let animationId;
    let frameCount = 0;
    const data = [];

    const runSimulation = () => {
      if (simulator && isSimulating) {
        // Add source based on phoneme characteristics
        const amplitude = phonemeData?.characteristics.friction ? 8000 : 5000;
        const frequency = (phonemeData?.targetFrequencies.peak || 440) / 100; // Scaled for simulation

        simulator.addSource(0.5, 0.5, frequency, amplitude);

        // Step simulation
        for (let i = 0; i < 5; i++) {
          simulator.step();
        }

        // Collect pressure samples
        const center = Math.floor(simulator.gridSize / 2);
        data.push(simulator.pressure[center * simulator.gridSize + center] || 0);

        // Keep last 1000 samples
        if (data.length > 1000) {
          data.shift();
        }

        setPressureData([...data]);
        frameCount++;

        // Continue simulation
        animationId = requestAnimationFrame(runSimulation);
      }
    };

    animationId = requestAnimationFrame(runSimulation);

    return () => cancelAnimationFrame(animationId);
  }, [simulator, isSimulating, selectedPhoneme, phonemeData]);

  // Handle phoneme selection
  const handlePhonemeSelect = (phonemeSymbol) => {
    setSelectedPhoneme(phonemeSymbol);
  };

  // Handle group selection
  const handleGroupSelect = (group) => {
    setPhonemeGroup(group);
  };

  // Handle audio recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access to record audio');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClearRecording = () => {
    setRecordedAudio(null);
  };

  // Get phoneme group
  const currentGroup = PHONEME_GROUPS[phonemeGroup];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>TruePhonetics - Sound Physics Learning</h1>
        <p>Understand how phonemes are produced: Vibration → Frequency → Sound</p>
      </div>

      {/* Stage Indicator */}
      <div className={styles.stageIndicator}>
        <div className={`${styles.stage} ${stage === 1 ? styles.active : ''}`}>
          <div className={styles.stageNumber}>1</div>
          <div className={styles.stageName}>Particle Vibration</div>
        </div>
        <div className={styles.stageLine}></div>
        <div className={`${styles.stage} ${stage === 2 ? styles.active : ''}`}>
          <div className={styles.stageNumber}>2</div>
          <div className={styles.stageName}>Frequency Spectrum</div>
        </div>
        <div className={styles.stageLine}></div>
        <div className={`${styles.stage} ${stage === 3 ? styles.active : ''}`}>
          <div className={styles.stageNumber}>3</div>
          <div className={styles.stageName}>Your Sound</div>
        </div>
      </div>

      {/* Phoneme Selector */}
      <div className={styles.phonemeSelector}>
        <h2>Choose a Phoneme to Learn</h2>

        {/* Group tabs */}
        <div className={styles.groupTabs}>
          {Object.entries(PHONEME_GROUPS).map(([groupKey, group]) => (
            <button
              key={groupKey}
              className={`${styles.groupTab} ${phonemeGroup === groupKey ? styles.active : ''}`}
              onClick={() => handleGroupSelect(groupKey)}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Phoneme buttons */}
        <div className={styles.phonemeButtons}>
          {currentGroup.phonemes.map((symbol) => {
            const phoneme = PHONEMES[symbol];
            return (
              <button
                key={symbol}
                className={`${styles.phonemeButton} ${selectedPhoneme === symbol ? styles.selected : ''}`}
                onClick={() => handlePhonemeSelect(symbol)}
                style={{
                  borderColor: phoneme.color,
                  backgroundColor: selectedPhoneme === symbol ? phoneme.color + '33' : 'transparent'
                }}
              >
                <div className={styles.phonemeSymbol}>{symbol}</div>
                <div className={styles.phonemeName}>{phoneme.name.split('(')[0].trim()}</div>
                <div className={styles.phonemeExamples}>{phoneme.examples.join(', ')}</div>
              </button>
            );
          })}
        </div>

        {/* Phoneme description */}
        {phonemeData && (
          <div className={styles.phonemeInfo}>
            <h3>{phonemeData.name}</h3>
            <p>{phonemeData.description}</p>
            <div className={styles.characteristics}>
              <div className={styles.char}>
                <span>Voiced:</span>
                <span>{phonemeData.voiced ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className={styles.char}>
                <span>Friction:</span>
                <span>{phonemeData.characteristics.friction ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className={styles.char}>
                <span>Aspiration:</span>
                <span>{phonemeData.characteristics.aspiration ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className={styles.char}>
                <span>Nasality:</span>
                <span>{phonemeData.characteristics.nasality ? '✓ Yes' : '✗ No'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 1: Particle Vibration */}
      <div className={styles.stageSection}>
        <div className={styles.stageTitle}>
          <span className={styles.stageNum}>Stage 1</span>
          <span>Particle Vibration</span>
          <span className={styles.stageDesc}>See how air particles move when producing {selectedPhoneme}</span>
        </div>

        <div className={styles.simulationControls}>
          <button
            className={`${styles.playButton} ${isSimulating ? styles.playing : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? '⏸ Pause' : '▶ Play'} Simulation
          </button>
          <button
            className={styles.nextButton}
            onClick={() => setStage(2)}
          >
            See Frequency Spectrum →
          </button>
        </div>

        <div className={styles.simulationViewer}>
          {simulator && (
            <PressureFieldVisualization
              simulator={simulator}
              phonemeColor={phonemeData?.color}
              phonemeSymbol={selectedPhoneme}
            />
          )}
        </div>

        <div className={styles.explanation}>
          <h4>What you're seeing:</h4>
          <p>
            {phonemeData?.characteristics.friction
              ? `The ${selectedPhoneme} sound is created by air flowing turbulently. You see high-frequency vibrations (rapid color changes) where air is being forced through a narrow opening.`
              : `The ${selectedPhoneme} sound involves vocal fold vibration. The pressure waves expand outward from a central point, creating a clear resonance pattern.`}
          </p>
        </div>
      </div>

      {/* Stage 2: Frequency Spectrum */}
      <div className={styles.stageSection}>
        <div className={styles.stageTitle}>
          <span className={styles.stageNum}>Stage 2</span>
          <span>Frequency Spectrum (EQ View)</span>
          <span className={styles.stageDesc}>Which frequencies matter for {selectedPhoneme}?</span>
        </div>

        {pressureData.length > 0 && (
          <>
            <FrequencyAnalyzer
              pressureData={pressureData}
              phoneme={selectedPhoneme}
            />

            <div className={styles.explanation}>
              <h4>Understanding the spectrum:</h4>
              <p>
                {phonemeData?.targetFrequencies.peak
                  ? `The peak frequency for ${selectedPhoneme} is around ${phonemeData.targetFrequencies.peak} Hz. The colored region shows the target frequency range where this sound's characteristic energy is concentrated.`
                  : `For vowel ${selectedPhoneme}, the formants (peaks) are what make it unique. Formant 1 (F1) controls openness, Formant 2 (F2) controls frontness/backness.`}
              </p>
            </div>

            <button
              className={styles.nextButton}
              onClick={() => setStage(3)}
            >
              Record Your Own Sound →
            </button>
          </>
        )}
      </div>

      {/* Stage 3: Audio Recording */}
      <div className={styles.stageSection}>
        <div className={styles.stageTitle}>
          <span className={styles.stageNum}>Stage 3</span>
          <span>Record Your Own Sound</span>
          <span className={styles.stageDesc}>Try saying {selectedPhoneme} and compare with the target</span>
        </div>

        <div className={styles.recordingControls}>
          {!isRecording && !recordedAudio && (
            <button className={styles.recordButton} onClick={handleStartRecording}>
              🎤 Start Recording
            </button>
          )}

          {isRecording && (
            <>
              <button className={styles.recordButton + ' ' + styles.recording} onClick={handleStopRecording}>
                ⏹ Stop Recording
              </button>
              <span className={styles.recordingIndicator}>● Recording...</span>
            </>
          )}

          {recordedAudio && (
            <>
              <div className={styles.audioPlayer}>
                <audio controls src={recordedAudio} style={{ width: '100%' }} />
              </div>
              <div className={styles.recordingActions}>
                <button className={styles.playButton} onClick={handleClearRecording}>
                  🔄 Record Again
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.explanation}>
          <h4>What to do:</h4>
          <ol>
            <li>Click "Start Recording"</li>
            <li>Say the sound "{selectedPhoneme}" clearly (or a word containing it like "{phonemeData?.examples[0]}")</li>
            <li>Click "Stop Recording"</li>
            <li>Listen to your recording and compare with the target spectrum</li>
          </ol>
        </div>
      </div>

      {/* Learning Notes */}
      <div className={styles.notes}>
        <h2>Learning Notes</h2>
        <div className={styles.noteCards}>
          <div className={styles.noteCard}>
            <h4>Fricatives vs Stops</h4>
            <p>Fricatives (/f/, /v/) have high-frequency noise. Stops (/k/, /g/) have a brief burst. Notice the difference in spectra!</p>
          </div>
          <div className={styles.noteCard}>
            <h4>Vowels Have Formants</h4>
            <p>Vowels show clear peaks (formants) in the spectrum. F1 and F2 determine which vowel you hear.</p>
          </div>
          <div className={styles.noteCard}>
            <h4>Voiced vs Unvoiced</h4>
            <p>Voiced sounds have a fundamental frequency (from vocal folds). Unvoiced sounds are just noise.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pressure field visualization component
 */
function PressureFieldVisualization({ simulator, phonemeColor, phonemeSymbol }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !simulator) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = simulator.gridSize;
    const cellSize = canvas.width / size;

    const render = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Render pressure field
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const pressure = simulator.pressure[i * size + j];
          const index = (j * canvas.width + i) * 4;

          // Normalize pressure
          const normalized = Math.min(Math.max(pressure / 30000, -1), 1);

          if (normalized > 0) {
            // Red for positive pressure
            data[index] = Math.floor(255 * normalized);
            data[index + 1] = 0;
            data[index + 2] = 0;
          } else {
            // Blue for negative pressure
            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = Math.floor(255 * Math.abs(normalized));
          }
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [simulator]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        style={{
          border: `2px solid ${phonemeColor}`,
          borderRadius: '8px',
          width: '100%',
          maxWidth: '512px',
          display: 'block',
          margin: '0 auto'
        }}
      />
      <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '10px' }}>
        Red = high pressure | Blue = low pressure | {phonemeSymbol}
      </p>
    </div>
  );
}
