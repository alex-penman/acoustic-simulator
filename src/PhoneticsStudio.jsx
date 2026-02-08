/**
 * Phonetics Studio
 * Recording environment for phonetic data collection
 * Human-in-the-loop learning for phoneme transcription
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './PhoneticsStudio.module.css';
import { WaveformVisualizer } from './WaveformVisualizer';
import { RecordingControls } from './RecordingControls';
import { TranscriptionPanel } from './TranscriptionPanel';
import { PhonemeProgress } from './PhonemeProgress';

// English consonant phonemes to train on
const PHONEME_INVENTORY = [
  // Stops/Plosives
  { symbol: 'p', name: 'voiceless bilabial stop', examples: 'pat, spot, cap', group: 'stops' },
  { symbol: 'b', name: 'voiced bilabial stop', examples: 'bat, crab, rub', group: 'stops' },
  { symbol: 't', name: 'voiceless alveolar stop', examples: 'tap, cat, but', group: 'stops' },
  { symbol: 'd', name: 'voiced alveolar stop', examples: 'dab, bad, bad', group: 'stops' },
  { symbol: 'k', name: 'voiceless velar stop', examples: 'cat, skill, back', group: 'stops' },
  { symbol: 'g', name: 'voiced velar stop', examples: 'gap, bag, dog', group: 'stops' },

  // Fricatives
  { symbol: 'f', name: 'voiceless labiodental fricative', examples: 'fun, life, safe', group: 'fricatives' },
  { symbol: 'v', name: 'voiced labiodental fricative', examples: 'van, love, have', group: 'fricatives' },
  { symbol: 'θ', name: 'voiceless dental fricative', examples: 'thin, math, bath', group: 'fricatives' },
  { symbol: 'ð', name: 'voiced dental fricative', examples: 'this, that, the', group: 'fricatives' },
  { symbol: 's', name: 'voiceless alveolar fricative', examples: 'sun, yes, bus', group: 'fricatives' },
  { symbol: 'z', name: 'voiced alveolar fricative', examples: 'zoo, rose, has', group: 'fricatives' },
  { symbol: 'ʃ', name: 'voiceless postalveolar fricative', examples: 'she, wish, push', group: 'fricatives' },
  { symbol: 'ʒ', name: 'voiced postalveolar fricative', examples: 'measure, vision, azure', group: 'fricatives' },
  { symbol: 'h', name: 'voiceless glottal fricative', examples: 'hat, who, behind', group: 'fricatives' },

  // Affricates
  { symbol: 'tʃ', name: 'voiceless postalveolar affricate', examples: 'chip, watch, much', group: 'affricates' },
  { symbol: 'dʒ', name: 'voiced postalveolar affricate', examples: 'jump, judge, rage', group: 'affricates' },

  // Nasals
  { symbol: 'm', name: 'bilabial nasal', examples: 'map, home, lamp', group: 'nasals' },
  { symbol: 'n', name: 'alveolar nasal', examples: 'nap, pan, noun', group: 'nasals' },
  { symbol: 'ŋ', name: 'velar nasal', examples: 'sing, bang, thing', group: 'nasals' },

  // Approximants
  { symbol: 'w', name: 'voiced labial-velar approximant', examples: 'way, wet, new', group: 'approximants' },
  { symbol: 'j', name: 'voiced palatal approximant', examples: 'yes, you, beyond', group: 'approximants' },
  { symbol: 'l', name: 'voiced alveolar lateral approximant', examples: 'lay, all, bell', group: 'approximants' },
  { symbol: 'r', name: 'voiced alveolar approximant', examples: 'ray, art, far', group: 'approximants' },
];

export function PhoneticsStudio({ user, onLogout }) {
  // Current phoneme being trained
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [phase, setPhase] = useState('single'); // 'single', 'minimal-pairs', 'all'

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]); // Current phoneme recordings
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [waveformData, setWaveformData] = useState(null);

  // Transcription state
  const [systemGuess, setSystemGuess] = useState(null);
  const [userCorrection, setUserCorrection] = useState(null);
  const [correctionConfirmed, setCorrectionConfirmed] = useState(false);

  // Media recording
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Training data
  const [trainingDataCount, setTrainingDataCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  const currentPhoneme = PHONEME_INVENTORY[currentPhonemeIndex];

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioData = await audioContextRef.current.decodeAudioData(arrayBuffer);

        setAudioBuffer(audioData);
        extractWaveformData(audioData);
        generateSystemGuess(audioData);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCorrectionConfirmed(false);
      setUserCorrection(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access');
    }
  };

  // Handle recording stop
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Extract waveform data for visualization
  const extractWaveformData = (audioData) => {
    const rawData = audioData.getChannelData(0);
    const samples = Math.floor(rawData.length / 512);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < 512; j++) {
        sum += Math.abs(rawData[i * 512 + j]);
      }
      waveform.push(sum / 512);
    }

    setWaveformData(waveform);
  };

  // Simulate system's phoneme guess (placeholder)
  const generateSystemGuess = (audioData) => {
    // TODO: Replace with actual ML inference
    // For now, just guess the current phoneme target
    const confidence = 0.6 + Math.random() * 0.3; // 60-90% confidence
    setSystemGuess({
      phoneme: currentPhoneme.symbol,
      confidence: confidence.toFixed(2),
      alternativeGuesses: [
        { phoneme: 'p', confidence: (0.1 + Math.random() * 0.2).toFixed(2) },
        { phoneme: 'b', confidence: (0.05 + Math.random() * 0.15).toFixed(2) },
      ]
    });
  };

  // Handle user confirmation/correction
  const handleConfirmCorrection = () => {
    const correction = userCorrection || currentPhoneme.symbol;
    const isCorrect = correction === currentPhoneme.symbol;

    // Save recording with correction
    const recording = {
      id: recordings.length + 1,
      phoneme: currentPhoneme.symbol,
      systemGuess: systemGuess.phoneme,
      userCorrection: correction,
      isCorrect: isCorrect,
      timestamp: new Date(),
      waveform: waveformData,
      audioBuffer: audioBuffer
    };

    setRecordings([...recordings, recording]);
    setTrainingDataCount(trainingDataCount + 1);

    if (isCorrect && systemGuess.phoneme === correction) {
      setAccuracy(((accuracy * trainingDataCount + 1) / (trainingDataCount + 1) * 100).toFixed(1));
    } else {
      setAccuracy(((accuracy * trainingDataCount + 0) / (trainingDataCount + 1) * 100).toFixed(1));
    }

    // Reset for next recording
    setCorrectionConfirmed(true);
    setAudioBuffer(null);
    setWaveformData(null);
    setSystemGuess(null);
    setUserCorrection(null);
  };

  const handleNextPhoneme = () => {
    if (currentPhonemeIndex < PHONEME_INVENTORY.length - 1) {
      setCurrentPhonemeIndex(currentPhonemeIndex + 1);
      setRecordings([]);
    }
  };

  const handlePreviousPhoneme = () => {
    if (currentPhonemeIndex > 0) {
      setCurrentPhonemeIndex(currentPhonemeIndex - 1);
      setRecordings([]);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🎤 Phonetics Studio</h1>
          <p>Recording phoneme data for truth-based phonetic transcription</p>
        </div>
        <div className={styles.userSection}>
          {user && <span className={styles.userName}>{user.name || user.firstName}</span>}
          <button onClick={onLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Phase and Progress */}
      <div className={styles.phaseBar}>
        <div className={styles.phaseIndicator}>
          <span className={styles.phaseLabel}>Phase: Single Phonemes</span>
          <span className={styles.phaseDesc}>Learn each sound individually</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Training Data:</span>
            <span className={styles.statValue}>{trainingDataCount}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Accuracy:</span>
            <span className={styles.statValue}>{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Main Studio Content */}
      <div className={styles.studioContent}>
        {/* Left: Phoneme Info & Recording */}
        <div className={styles.recordingSection}>
          <div className={styles.phonemeCard}>
            <div className={styles.phonemeTarget}>
              <span className={styles.phonemeSymbol}>{currentPhoneme.symbol}</span>
              <div className={styles.phonemeInfo}>
                <h3>{currentPhoneme.name}</h3>
                <p className={styles.examples}>
                  Say: <strong>{currentPhoneme.examples}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Waveform Display */}
          {waveformData && (
            <WaveformVisualizer
              data={waveformData}
              phonemeColor="#60a5fa"
            />
          )}

          {/* Recording Controls */}
          <RecordingControls
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordingCount={recordings.length}
          />

          {/* Phoneme Progress */}
          <PhonemeProgress
            currentIndex={currentPhonemeIndex}
            totalPhonemes={PHONEME_INVENTORY.length}
            onPrevious={handlePreviousPhoneme}
            onNext={handleNextPhoneme}
            recordingsCount={recordings.length}
          />
        </div>

        {/* Right: Transcription & Correction */}
        <div className={styles.transcriptionSection}>
          {systemGuess ? (
            <TranscriptionPanel
              systemGuess={systemGuess}
              targetPhoneme={currentPhoneme.symbol}
              userCorrection={userCorrection}
              onCorrectionChange={setUserCorrection}
              onConfirm={handleConfirmCorrection}
              correctionConfirmed={correctionConfirmed}
            />
          ) : (
            <div className={styles.placeholderPanel}>
              <div className={styles.placeholderContent}>
                <span className={styles.placeholderIcon}>🎙️</span>
                <p>Record a sample to see system's phoneme guess</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording History */}
      {recordings.length > 0 && (
        <div className={styles.historySection}>
          <h3>Session History ({recordings.length} recordings)</h3>
          <div className={styles.recordingsList}>
            {recordings.map((recording, idx) => (
              <div
                key={idx}
                className={`${styles.recordingItem} ${
                  recording.isCorrect ? styles.correct : styles.incorrect
                }`}
              >
                <span className={styles.recordingNumber}>#{recording.id}</span>
                <span className={styles.systemGuess}>
                  System: {recording.systemGuess}
                </span>
                <span className={styles.userGuess}>
                  You: {recording.userCorrection}
                </span>
                <span className={styles.result}>
                  {recording.isCorrect ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
