/**
 * Phoneme Database for TruePhonetics
 * Contains acoustic characteristics and target frequencies for different phonemes
 */

export const PHONEMES = {
  // Fricatives
  'f': {
    name: 'f (voiceless labiodental fricative)',
    symbol: 'f',
    description: 'Unvoiced - lips against teeth, high frequency friction',
    examples: ['fun', 'coffee', 'life'],
    articulation: 'Labiodental fricative',
    voiced: false,
    targetFrequencies: {
      min: 1500,
      max: 8000,
      peak: 4500, // Main friction noise
      formants: [] // No clear formants, noise spectrum
    },
    characteristics: {
      friction: true,
      aspiration: false,
      nasality: false,
      duration: 'medium'
    },
    color: '#FF6B9D'
  },

  'v': {
    name: 'v (voiced labiodental fricative)',
    symbol: 'v',
    description: 'Voiced - similar to /f/ but with vocal fold vibration',
    examples: ['van', 'love', 'seven'],
    articulation: 'Labiodental fricative',
    voiced: true,
    targetFrequencies: {
      min: 1000,
      max: 7000,
      peak: 4000,
      fundamentalFrequency: 100 // Vocal fold vibration
    },
    characteristics: {
      friction: true,
      aspiration: false,
      nasality: false,
      duration: 'medium'
    },
    color: '#FF8FAB'
  },

  'k': {
    name: 'k (voiceless velar stop)',
    symbol: 'k',
    description: 'Unvoiced - tongue blocks at soft palate, then releases',
    examples: ['cat', 'clock', 'back'],
    articulation: 'Velar stop',
    voiced: false,
    targetFrequencies: {
      min: 0,
      max: 3000,
      peak: 1500, // Burst at release
      formantTransition: 'rapid' // Quick frequency change at release
    },
    characteristics: {
      friction: false,
      aspiration: true, // Burst of air
      nasality: false,
      duration: 'short'
    },
    color: '#4ECDC4'
  },

  'g': {
    name: 'g (voiced velar stop)',
    symbol: 'g',
    description: 'Voiced - like /k/ but with vocal fold vibration',
    examples: ['go', 'dog', 'big'],
    articulation: 'Velar stop',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 2500,
      peak: 1200,
      fundamentalFrequency: 100 // Vocal fold vibration
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: false,
      duration: 'short'
    },
    color: '#45B7D1'
  },

  // Vowels
  'ɑ': {
    name: 'ɑ (open back unrounded vowel)',
    symbol: 'ɑ',
    description: 'Like in "father" - open mouth, vowel formants clear',
    examples: ['father', 'lot', 'spa'],
    articulation: 'Vowel',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 3000,
      F1: 700, // First formant (lower = more open)
      F2: 1100, // Second formant (higher = more front)
      fundamentalFrequency: 100
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: false,
      duration: 'long'
    },
    color: '#F7DC6F'
  },

  'i': {
    name: 'i (close front unrounded vowel)',
    symbol: 'i',
    description: 'Like in "fleece" - tight lips, high frequency vowel',
    examples: ['fleece', 'tea', 'happy'],
    articulation: 'Vowel',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 4000,
      F1: 240, // Close vowel - low F1
      F2: 2400, // Front vowel - high F2
      fundamentalFrequency: 100
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: false,
      duration: 'long'
    },
    color: '#F39C12'
  },

  'u': {
    name: 'u (close back rounded vowel)',
    symbol: 'u',
    description: 'Like in "goose" - rounded lips, back vowel',
    examples: ['goose', 'blue', 'shoe'],
    articulation: 'Vowel',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 3500,
      F1: 300, // Close vowel
      F2: 870, // Back vowel - low F2
      fundamentalFrequency: 100
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: false,
      duration: 'long'
    },
    color: '#E74C3C'
  },

  'ə': {
    name: 'ə (schwa)',
    symbol: 'ə',
    description: 'Neutral vowel - like in "about" - mid-central position',
    examples: ['about', 'sofa', 'comma'],
    articulation: 'Vowel',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 3500,
      F1: 500, // Mid vowel
      F2: 1500, // Central vowel
      fundamentalFrequency: 100
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: false,
      duration: 'short'
    },
    color: '#95A5A6'
  },

  // Nasals
  'm': {
    name: 'm (bilabial nasal)',
    symbol: 'm',
    description: 'Nasal through nose - lips closed, velum open',
    examples: ['mom', 'home', 'lamp'],
    articulation: 'Nasal',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 2000,
      F1: 300,
      F2: 900,
      fundamentalFrequency: 100,
      nasalFormant: 300 // Nasal cavity resonance
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: true,
      duration: 'medium'
    },
    color: '#9B59B6'
  },

  'n': {
    name: 'n (alveolar nasal)',
    symbol: 'n',
    description: 'Nasal through nose - tongue at alveolar ridge',
    examples: ['no', 'pan', 'winter'],
    articulation: 'Nasal',
    voiced: true,
    targetFrequencies: {
      min: 50,
      max: 2500,
      F1: 350,
      F2: 1500,
      fundamentalFrequency: 100,
      nasalFormant: 350
    },
    characteristics: {
      friction: false,
      aspiration: false,
      nasality: true,
      duration: 'medium'
    },
    color: '#8E44AD'
  }
};

/**
 * Get phoneme data
 */
export function getPhoneme(symbol) {
  return PHONEMES[symbol];
}

/**
 * Get all available phoneme symbols
 */
export function getPhonemeSymbols() {
  return Object.keys(PHONEMES);
}

/**
 * Get frequency analysis description for a phoneme
 */
export function getPhonemeDescription(symbol) {
  const phoneme = PHONEMES[symbol];
  if (!phoneme) return null;

  return {
    name: phoneme.name,
    description: phoneme.description,
    articulation: phoneme.articulation,
    examples: phoneme.examples,
    voiced: phoneme.voiced,
    frequencies: phoneme.targetFrequencies,
    characteristics: phoneme.characteristics
  };
}

/**
 * Expected frequency bands for visualization
 */
export const FREQUENCY_BANDS = [
  { name: '0-500 Hz', min: 0, max: 500, label: 'Low' },
  { name: '500-1000 Hz', min: 500, max: 1000, label: 'Low-Mid' },
  { name: '1000-2000 Hz', min: 1000, max: 2000, label: 'Mid' },
  { name: '2000-4000 Hz', min: 2000, max: 4000, label: 'High-Mid' },
  { name: '4000+ Hz', min: 4000, max: 8000, label: 'High' }
];

/**
 * Phoneme groups for learning progression
 */
export const PHONEME_GROUPS = {
  fricatives: {
    name: 'Fricatives (friction sounds)',
    phonemes: ['f', 'v'],
    description: 'High-frequency noise from air friction'
  },
  stops: {
    name: 'Stops (plosives)',
    phonemes: ['k', 'g'],
    description: 'Quick release of air pressure'
  },
  vowels: {
    name: 'Vowels (resonant sounds)',
    phonemes: ['ɑ', 'i', 'u', 'ə'],
    description: 'Clear vocal formants from vocal fold vibration'
  },
  nasals: {
    name: 'Nasals (nasal air flow)',
    phonemes: ['m', 'n'],
    description: 'Air flowing through the nose'
  }
};
