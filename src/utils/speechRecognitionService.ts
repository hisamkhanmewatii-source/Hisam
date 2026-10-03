// Speech Recognition / Voice-to-Text utility for elderly & low-literacy users
export interface VoiceRecognitionResult {
  transcript: string;
  isMedicationAction: boolean;
  medicationNameHint?: string;
  foodNameHint?: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function parseVoiceInput(transcript: string): VoiceRecognitionResult {
  const clean = transcript.trim().toLowerCase();

  // Check if user is logging medication intake
  // Examples: "I took my morning medicine", "Took my pills", "I took metformin", "Logged vitamin", "Ate my medicine"
  const medKeywords = ['took', 'take', 'taken', 'pill', 'pills', 'medicine', 'medication', 'dose', 'tablets', 'metformin', 'vitamin', 'omeprazole', 'magnesium', 'insulin'];
  const hasMedIntent = medKeywords.some((w) => clean.includes(w));

  if (hasMedIntent) {
    let nameHint: string | undefined = undefined;
    if (clean.includes('metformin')) nameHint = 'metformin';
    else if (clean.includes('vitamin')) nameHint = 'vitamin';
    else if (clean.includes('omeprazole')) nameHint = 'omeprazole';
    else if (clean.includes('magnesium')) nameHint = 'magnesium';

    return {
      transcript,
      isMedicationAction: true,
      medicationNameHint: nameHint,
    };
  }

  // Otherwise it's a food item to add to inventory
  // Clean up common prefixes like "add", "please add", "i bought", "put", "new"
  let foodName = transcript
    .replace(/^(please\s+)?(add|put|i\s+bought|new|buy)\s+/i, '')
    .replace(/\s+(to\s+(the\s+)?(fridge|pantry|kitchen|freezer))$/i, '')
    .trim();

  // Capitalize first letter of each word for clean food name
  foodName = foodName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    transcript,
    isMedicationAction: false,
    foodNameHint: foodName,
  };
}
