/**
 * Transcription Panel
 * Shows system's guess and allows user correction
 */

import React from 'react';
import styles from './TranscriptionPanel.module.css';

export function TranscriptionPanel({
  systemGuess,
  targetPhoneme,
  userCorrection,
  onCorrectionChange,
  onConfirm,
  correctionConfirmed
}) {
  const isCorrect = systemGuess.phoneme === targetPhoneme;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        {/* System Guess */}
        <div className={styles.section}>
          <h4>System's Guess</h4>
          <div className={`${styles.guessBox} ${isCorrect ? styles.correct : styles.incorrect}`}>
            <div className={styles.phoneme}>{systemGuess.phoneme}</div>
            <div className={styles.confidence}>
              Confidence: {(systemGuess.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Target Phoneme */}
        <div className={styles.section}>
          <h4>Target Phoneme</h4>
          <div className={styles.targetBox}>
            <div className={styles.phoneme}>{targetPhoneme}</div>
          </div>
        </div>

        {/* User Correction */}
        <div className={styles.section}>
          <h4>What You Actually Heard</h4>
          <div className={styles.correctionInput}>
            <input
              type="text"
              placeholder={`Type the phoneme you heard (e.g., ${targetPhoneme})`}
              value={userCorrection || ''}
              onChange={(e) => onCorrectionChange(e.target.value)}
              maxLength="5"
              className={styles.input}
              disabled={correctionConfirmed}
            />
            {userCorrection && (
              <div className={styles.inputHint}>
                You entered: <strong>{userCorrection}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Guesses */}
        {systemGuess.alternativeGuesses && systemGuess.alternativeGuesses.length > 0 && (
          <div className={styles.section}>
            <h4>Other Possibilities</h4>
            <div className={styles.alternatives}>
              {systemGuess.alternativeGuesses.map((alt, idx) => (
                <button
                  key={idx}
                  className={styles.altButton}
                  onClick={() => onCorrectionChange(alt.phoneme)}
                  disabled={correctionConfirmed}
                >
                  <span className={styles.altPhoneme}>{alt.phoneme}</span>
                  <span className={styles.altConfidence}>
                    {(alt.confidence * 100).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <div className={styles.actions}>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={correctionConfirmed}
          >
            {correctionConfirmed ? '✓ Confirmed' : 'Confirm Correction'}
          </button>
        </div>

        {/* Feedback */}
        {correctionConfirmed && (
          <div className={styles.feedback}>
            <p>✓ Correction saved! Record another sample or move to next phoneme.</p>
          </div>
        )}
      </div>
    </div>
  );
}
