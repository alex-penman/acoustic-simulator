/**
 * Phoneme Progress
 * Navigation between phonemes and progress tracking
 */

import React from 'react';
import styles from './PhonemeProgress.module.css';

export function PhonemeProgress({
  currentIndex,
  totalPhonemes,
  onPrevious,
  onNext,
  recordingsCount
}) {
  const progressPercent = ((currentIndex + 1) / totalPhonemes) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className={styles.progressText}>
          Phoneme {currentIndex + 1} of {totalPhonemes}
          {recordingsCount > 0 && (
            <span className={styles.recordCount}> • {recordingsCount} recording{recordingsCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          className={styles.navBtn}
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        <button
          className={styles.navBtn}
          onClick={onNext}
          disabled={currentIndex === totalPhonemes - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
