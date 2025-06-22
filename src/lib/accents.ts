// src/lib/accents.ts
// Shared list of available accents/voices for Google Cloud TTS
// Extend or update as needed for your supported voices

export interface AccentOption {
  label: string; // e.g. "US English (Female)"
  voiceId: string; // Google TTS voice name, e.g. "en-US-Wavenet-F"
  languageCode: string; // e.g. "en-US"
  gender: 'MALE' | 'FEMALE';
}

export const ACCENTS: AccentOption[] = [
  {
    label: 'US English (Female)',
    voiceId: 'en-US-Wavenet-F',
    languageCode: 'en-US',
    gender: 'FEMALE',
  },
  {
    label: 'US English (Male)',
    voiceId: 'en-US-Wavenet-D',
    languageCode: 'en-US',
    gender: 'MALE',
  },
  {
    label: 'UK English (Female)',
    voiceId: 'en-GB-Wavenet-A',
    languageCode: 'en-GB',
    gender: 'FEMALE',
  },
  {
    label: 'UK English (Male)',
    voiceId: 'en-GB-Wavenet-B',
    languageCode: 'en-GB',
    gender: 'MALE',
  },
  // Add more voices as needed
];
