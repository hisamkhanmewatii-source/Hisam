// Text-to-Speech & Speech Recognition helper with Hindi, Arabic & English support
import { SupportedLanguage } from './translations';

let currentLanguage: SupportedLanguage = 'en';

export function setVoiceLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
}

export function getVoiceLanguage(): SupportedLanguage {
  return currentLanguage;
}

// Text-to-Speech: Speaks cleanly in English, Hindi, or Arabic
export function speakText(text: string, lang?: SupportedLanguage, force = true) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser');
    return;
  }

  // If not explicitly forced, suppress voice during quiet hours sleep window
  if (!force) {
    try {
      const raw = localStorage.getItem('freshguard_quiet_hours_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.enabled && s.suppressVoice) {
          const now = new Date();
          const cur = now.getHours() * 60 + now.getMinutes();
          const [sh, sm] = (s.startTime || '22:00').split(':').map((v: string) => parseInt(v, 10) || 0);
          const [eh, em] = (s.endTime || '07:00').split(':').map((v: string) => parseInt(v, 10) || 0);
          const st = sh * 60 + sm;
          const et = eh * 60 + em;
          const inQuiet = st > et ? cur >= st || cur < et : cur >= st && cur < et;
          if (inQuiet) {
            console.log('🔇 Spoken announcement silenced during Quiet Hours to protect sleep');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Quiet hours speech check error:', e);
    }
  }

  const targetLang = lang || currentLanguage;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[🚨⚠️🟢🟡🔴✨🍽️💊🌅☀️🌆🌙🖐️✊🥣🥄📸🔍🔊💡🎯●○✓+•]/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = targetLang === 'hi' ? 0.85 : 0.9; // Slightly gentle pace for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Set BCP-47 language tag
  if (targetLang === 'hi') {
    utterance.lang = 'hi-IN';
  } else {
    utterance.lang = 'en-US';
  }

  // Attempt to select native matching voice
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    if (targetLang === 'hi') {
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी') ||
          v.name.includes('Hemant') ||
          v.name.includes('Kalpana')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    } else {
      const englishVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Microphone Speech Recognition Helper
export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

export function startSpeechRecognition(options: {
  lang: SupportedLanguage;
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}): SpeechRecognitionController | null {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    console.warn('SpeechRecognition API is not supported in this browser.');
    if (options.onError) {
      options.onError(new Error('Speech recognition not supported in this browser'));
    }
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Set correct language code so the microphone transcribes in Hindi or English
    if (options.lang === 'hi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-US';
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript) {
        options.onResult(finalTranscript, true);
      } else if (interimTranscript) {
        options.onResult(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (options.onError) {
        options.onError(event.error);
      }
    };

    recognition.onend = () => {
      if (options.onEnd) {
        options.onEnd();
      }
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
      abort: () => {
        try {
          recognition.abort();
        } catch {}
      },
    };
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    if (options.onError) {
      options.onError(err);
    }
    return null;
  }
}
