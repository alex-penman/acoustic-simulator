/**
 * Acoustic Analysis Panel
 * Displays detailed acoustic analysis results
 */

import React, { useState } from 'react';
import styles from './AcousticAnalysisPanel.module.css';

export function AcousticAnalysisPanel({ features, isLoading = false }) {
  const [expandedSection, setExpandedSection] = useState('summary');

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <span>🔍 Analyzing audio...</span>
        </div>
      </div>
    );
  }

  if (!features) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <span>Record audio to see acoustic analysis</span>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={styles.container}>
      {/* Summary Section */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('summary')}
        >
          <span className={styles.icon}>📊</span>
          <h4>Analysis Summary</h4>
          <span className={styles.toggle}>
            {expandedSection === 'summary' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'summary' && (
          <div className={styles.sectionContent}>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Sound Type:</span>
                <span className={styles.value}>{features.summary.soundType}</span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.label}>Quality:</span>
                <div className={styles.qualityBar}>
                  <div
                    className={styles.qualityFill}
                    style={{ width: `${features.summary.quality.score}%` }}
                  ></div>
                  <span className={styles.qualityScore}>
                    {features.summary.quality.score}%
                  </span>
                </div>
                {features.summary.quality.issues.length > 0 && (
                  <div className={styles.issues}>
                    {features.summary.quality.issues.map((issue, idx) => (
                      <span key={idx} className={styles.issue}>
                        ⚠️ {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.characteristics}>
                <h5>Characteristics</h5>
                <div className={styles.charGrid}>
                  <div className={styles.char}>
                    <span className={styles.charLabel}>Voicing:</span>
                    <span className={styles.charValue}>
                      {features.summary.characteristics.voicing}
                    </span>
                  </div>
                  <div className={styles.char}>
                    <span className={styles.charLabel}>Brightness:</span>
                    <span className={styles.charValue}>
                      {features.summary.characteristics.brightness}
                    </span>
                  </div>
                  <div className={styles.char}>
                    <span className={styles.charLabel}>Friction:</span>
                    <span className={styles.charValue}>
                      {features.summary.characteristics.isFricative ? 'yes' : 'no'}
                    </span>
                  </div>
                  <div className={styles.char}>
                    <span className={styles.charLabel}>Energy:</span>
                    <span className={styles.charValue}>
                      {features.summary.characteristics.energy}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.hints}>
                <h5>Phoneme Hints</h5>
                {features.summary.phonemeHints.map((hint, idx) => (
                  <div key={idx} className={styles.hint}>
                    💡 {hint}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voicing Section */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('voicing')}
        >
          <span className={styles.icon}>🎙️</span>
          <h4>Voicing Analysis</h4>
          <span className={styles.toggle}>
            {expandedSection === 'voicing' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'voicing' && (
          <div className={styles.sectionContent}>
            <div className={styles.metric}>
              <span>Voicing Ratio:</span>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${features.voicing.voicingRatio * 100}%` }}
                ></div>
              </div>
              <span className={styles.metricValue}>
                {(features.voicing.voicingRatio * 100).toFixed(1)}%
              </span>
            </div>

            {features.voicing.voicedSegments.length > 0 && (
              <div className={styles.segments}>
                <h5>Voiced Segments:</h5>
                {features.voicing.voicedSegments.map((seg, idx) => (
                  <div key={idx} className={styles.segment}>
                    <span className={styles.segmentTime}>
                      {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                    </span>
                    <span className={styles.segmentDuration}>
                      ({(seg.duration * 1000).toFixed(0)}ms)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pitch Section */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('pitch')}
        >
          <span className={styles.icon}>📈</span>
          <h4>Pitch Analysis</h4>
          <span className={styles.toggle}>
            {expandedSection === 'pitch' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'pitch' && (
          <div className={styles.sectionContent}>
            {features.pitch.mean > 0 ? (
              <>
                <div className={styles.metric}>
                  <span>Mean Pitch:</span>
                  <span className={styles.metricValue}>
                    {features.pitch.mean.toFixed(1)} Hz
                  </span>
                </div>
                <div className={styles.metric}>
                  <span>Range:</span>
                  <span className={styles.metricValue}>
                    {features.pitch.min.toFixed(1)} - {features.pitch.max.toFixed(1)} Hz
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.noData}>No pitch detected (unvoiced sound)</div>
            )}
          </div>
        )}
      </div>

      {/* Formants Section */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('formants')}
        >
          <span className={styles.icon}>🎯</span>
          <h4>Formant Analysis</h4>
          <span className={styles.toggle}>
            {expandedSection === 'formants' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'formants' && (
          <div className={styles.sectionContent}>
            <div className={styles.formants}>
              {['f1', 'f2', 'f3'].map((formant, idx) => (
                <div key={formant} className={styles.formantBox}>
                  <div className={styles.formantLabel}>F{idx + 1}</div>
                  <div className={styles.formantFreq}>
                    {features.formants[formant].frequency > 0
                      ? `${Math.round(features.formants[formant].frequency)} Hz`
                      : 'N/A'}
                  </div>
                  <div className={styles.formantBand}>
                    Bandwidth:{' '}
                    {features.formants[formant].bandwidth > 0
                      ? `${Math.round(features.formants[formant].bandwidth)} Hz`
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Energy Section */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('energy')}
        >
          <span className={styles.icon}>⚡</span>
          <h4>Energy Analysis</h4>
          <span className={styles.toggle}>
            {expandedSection === 'energy' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'energy' && (
          <div className={styles.sectionContent}>
            <div className={styles.metric}>
              <span>Mean Energy:</span>
              <span className={styles.metricValue}>
                {features.energy.mean.toFixed(3)}
              </span>
            </div>
            <div className={styles.metric}>
              <span>Peak Energy:</span>
              <span className={styles.metricValue}>{features.energy.dB.toFixed(1)} dB</span>
            </div>
            <div className={styles.metric}>
              <span>Duration:</span>
              <span className={styles.metricValue}>{features.duration.toFixed(2)}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Spectral Characteristics */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection('spectral')}
        >
          <span className={styles.icon}>🌊</span>
          <h4>Spectral Characteristics</h4>
          <span className={styles.toggle}>
            {expandedSection === 'spectral' ? '▼' : '▶'}
          </span>
        </div>

        {expandedSection === 'spectral' && (
          <div className={styles.sectionContent}>
            <div className={styles.metric}>
              <span>Spectral Centroid:</span>
              <span className={styles.metricValue}>
                {features.spectralCentroid.centroid.toFixed(0)} Hz
              </span>
            </div>
            <div className={styles.metric}>
              <span>Zero Crossing Rate:</span>
              <span className={styles.metricValue}>
                {(features.zeroCrossingRate.mean * 100).toFixed(1)}%
              </span>
            </div>
            <div className={styles.metric}>
              <span>Type Indicator:</span>
              <span className={styles.metricValue}>
                {features.zeroCrossingRate.isFricative ? 'Fricative' : 'Not Fricative'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
