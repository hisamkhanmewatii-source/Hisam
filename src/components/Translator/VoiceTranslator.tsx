import React, { useState, useEffect } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
} from '../../utils/translations';
import {
  speakText,
  stopSpeaking,
  startSpeechRecognition,
  SpeechRecognitionController,
} from '../../utils/voiceService';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Globe,
  Pause,
  Play,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceTranslatorProps {
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  easyMode: boolean;
}

export const VoiceTranslator: React.FC<VoiceTranslatorProps> = ({
  currentLanguage,
  onChangeLanguage,
  easyMode,
}) => {
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>('en');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('hi');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [romanizedHindi, setRomanizedHindi] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [micController, setMicController] = useState<SpeechRecognitionController | null>(null);
  const baseInputRef = React.useRef('');

  // Suggested Quick Healthcare Sentences
  const sampleSentences = [
    {
      en: 'When should I take my Metformin medicine?',
      hi: 'मुझे अपनी मेटफ़ॉर्मिन दवा कब लेनी चाहिए?',
      roman: 'Mujhe apni Metformin dawa kab leni chahiye?',
    },
    {
      en: 'Is this food safe to eat or has it rotted?',
      hi: 'क्या यह खाना खाने के लिए सुरक्षित है या सड़ चुका है?',
      roman: 'Kya yeh khana khane ke liye surakshit hai ya sad chuka hai?',
    },
    {
      en: 'Take this pill with water in the middle of a meal.',
      hi: 'यह गोली भोजन के बीच में पानी के साथ लें।',
      roman: 'Yeh goli bhojan ke beech mein paani ke sath lein.',
    },
    {
      en: 'I am experiencing stomach cramps and dizziness.',
      hi: 'मुझे पेट में मरोड़ और चक्कर आ रहे हैं।',
      roman: 'Mujhe pet mein marod aur chakkar aa rahe hain.',
    },
    {
      en: 'Drink 2 glasses of water to flush sugar spikes.',
      hi: 'शुगर स्पाइक को कम करने के लिए 2 गिलास पानी पिएं।',
      roman: 'Sugar spike ko kam karne ke liye 2 glass paani piyein.',
    },
  ];

  // Clean up microphone on unmount
  useEffect(() => {
    return () => {
      if (micController) {
        micController.stop();
      }
    };
  }, [micController]);

  // Handle Swap Languages
  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setRomanizedHindi('');
  };

  // Run Translation (via Gemini backend with offline fallback)
  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate ?? inputText).trim();
    if (!text) return;

    setIsTranslating(true);

    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setTranslatedText(json.data.translatedText || text);
        setRomanizedHindi(json.data.romanizedHindi || '');

        // Automatically speak in the target language (Hindi or English)
        speakText(json.data.translatedText, targetLang);
      } else {
        // Fallback translation
        const fallback =
          targetLang === 'hi'
            ? 'यह स्वास्थ्य और दवा से संबंधित निर्देश है।'
            : 'This is medical and health related guidance.';
        setTranslatedText(fallback);
        speakText(fallback, targetLang);
      }
    } catch (err) {
      console.warn('Translation call failed, using fallback:', err);
      const fallback =
        targetLang === 'hi'
          ? 'कृपया अपनी दवा समय पर और पानी के साथ लें।'
          : 'Please take your medication on time with water.';
      setTranslatedText(fallback);
      speakText(fallback, targetLang);
    } finally {
      setIsTranslating(false);
    }
  };

  // Toggle Microphone Speech Recognition
  const handleToggleMic = () => {
    if (isListening) {
      if (micController) {
        micController.stop();
        setMicController(null);
      }
      setIsListening(false);
      setIsPaused(false);
      return;
    }

    setIsPaused(false);
    baseInputRef.current = inputText;

    // Start listening in source language
    const ctrl = startSpeechRecognition({
      lang: sourceLang,
      onResult: (transcript, isFinal) => {
        const prefix = baseInputRef.current ? baseInputRef.current + ' ' : '';
        setInputText(prefix + transcript);
        if (isFinal) {
          setIsListening(false);
          setIsPaused(false);
          setMicController(null);
        }
      },
      onError: (err) => {
        console.warn('Mic speech recognition error:', err);
        setIsListening(false);
        setIsPaused(false);
        setMicController(null);
      },
      onEnd: () => {
        setIsListening(false);
        setMicController(null);
      },
    });

    if (ctrl) {
      setMicController(ctrl);
      setIsListening(true);
    } else {
      alert('Microphone speech recognition is not supported on this browser. You can type text directly.');
    }
  };

  // Pause Microphone
  const handlePauseMic = () => {
    if (micController) {
      micController.stop();
      setMicController(null);
    }
    setIsListening(false);
    setIsPaused(true);
  };

  // Resume Microphone
  const handleResumeMic = () => {
    setIsPaused(false);
    baseInputRef.current = inputText;

    const ctrl = startSpeechRecognition({
      lang: sourceLang,
      onResult: (transcript, isFinal) => {
        const prefix = baseInputRef.current ? baseInputRef.current + ' ' : '';
        setInputText(prefix + transcript);
        if (isFinal) {
          setIsListening(false);
          setIsPaused(false);
          setMicController(null);
        }
      },
      onError: (err) => {
        console.warn('Mic error on resume:', err);
        setIsListening(false);
        setIsPaused(false);
        setMicController(null);
      },
      onEnd: () => {
        setIsListening(false);
        setMicController(null);
      },
    });

    if (ctrl) {
      setMicController(ctrl);
      setIsListening(true);
    }
  };

  // Post & Translate immediately
  const handlePostAndTranslate = () => {
    if (micController) {
      micController.stop();
      setMicController(null);
    }
    setIsListening(false);
    setIsPaused(false);
    handleTranslate(inputText);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getTranslation('translateHeading', currentLanguage)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {getTranslation('translateSubtitle', currentLanguage)}
            </p>
          </div>
        </div>

        {/* Global App Language Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <Globe className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider hidden sm:inline">
            App Language:
          </span>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChangeLanguage(lang.code);
                speakText(
                  lang.code === 'hi'
                    ? 'मोहम्मद हिसाम हेल्थ अब हिन्दी में है।'
                    : 'App language is now set to English.',
                  lang.code
                );
                confetti({
                  particleCount: 25,
                  spread: 50,
                  origin: { y: 0.6 },
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentLanguage === lang.code
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TRANSLATOR WORKSPACE CARD */}
      <div className="bg-white rounded-3xl border-2 border-indigo-200 p-5 sm:p-7 shadow-lg space-y-6">
        {/* Language Selector Bar & Swap */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
              From:
            </span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as SupportedLanguage)}
              className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapLanguages}
            className="p-2.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-300 shadow-xs transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Swap source and target languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Swap</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
              To:
            </span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
              className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* INPUT & TRANSLATION PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Source Input Box with Microphone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>{sourceLang === 'hi' ? '🇮🇳 हिन्दी इनपुट (Source Text / Voice)' : '🇬🇧 English Input (Source Text / Voice)'}</span>
              </span>
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setTranslatedText('');
                    setRomanizedHindi('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{getTranslation('clear', currentLanguage)}</span>
                </button>
              )}
            </div>

            {/* Quick Feature Guide for Microphone Controls */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-900 font-black">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {currentLanguage === 'hi'
                    ? 'माइक्रोफ़ोन नियंत्रण (Post, Pause & Resume):'
                    : 'Voice Translator Microphone Controls:'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-700 font-medium">
                <div className="p-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-amber-700 block">
                    {currentLanguage === 'hi' ? '⏸️ माइक रोकें (Pause):' : '⏸️ Pause Mic:'}
                  </span>
                  <span>
                    {currentLanguage === 'hi'
                      ? 'माइक रोकें और जो बोला गया है उसे सुरक्षित रखें।'
                      : 'Pauses recording and preserves transcription.'}
                  </span>
                </div>

                <div className="p-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 block">
                    {currentLanguage === 'hi' ? '▶️ फिर शुरू करें (Resume):' : '▶️ Resume Mic:'}
                  </span>
                  <span>
                    {currentLanguage === 'hi'
                      ? 'माइक फिर से शुरू करें और आगे बोलना जारी रखें।'
                      : 'Resumes listening & appends speech.'}
                  </span>
                </div>

                <div className="p-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 block">
                    {currentLanguage === 'hi' ? '🚀 पोस्ट व अनुवाद करें (Post):' : '🚀 Post & Translate:'}
                  </span>
                  <span>
                    {currentLanguage === 'hi'
                      ? 'माइक बंद कर तुरंत अनुवाद करें और आवाज़ में सुनें।'
                      : 'Pauses mic, translates & plays speech aloud.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={getTranslation('sourceTextPlaceholder', currentLanguage)}
                rows={5}
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />

              {/* Listening Active Pulse Indicator */}
              {isListening && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-rose-600/95 backdrop-blur-sm text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                    <span>
                      {sourceLang === 'hi'
                        ? '🎙️ सुन रहा है... आप बोलते रहें (बोलने के बाद Pause या Post दबाएं)'
                        : '🎙️ Listening... Speak naturally. Tap Pause or Post when done.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-white rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              {/* Paused Indicator */}
              {isPaused && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-amber-600/95 backdrop-blur-sm text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg">
                  <div className="flex items-center gap-2">
                    <Pause className="w-4 h-4 fill-white" />
                    <span>
                      {sourceLang === 'hi'
                        ? '⏸️ माइक रुका हुआ है (Paused) — आगे बोलने के लिए "फिर शुरू करें" दबाएं या "पोस्ट" करें'
                        : '⏸️ Mic Paused — Transcription saved. Tap Resume to continue or Post to translate.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Microphone Controls & Post Button Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Primary Mic Record / Stop */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  isListening
                    ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20 active:scale-95'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>{currentLanguage === 'hi' ? 'माइक बंद करें' : 'Stop Listening'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>
                      {sourceLang === 'hi' ? '🎙️ माइक्रोफ़ोन में बोलें' : '🎙️ Speak with Microphone'}
                    </span>
                  </>
                )}
              </button>

              {/* Pause Mic Button (when listening) */}
              {isListening && (
                <button
                  type="button"
                  onClick={handlePauseMic}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                  title="Pause microphone recording without clearing text"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>{getTranslation('micPause', currentLanguage)}</span>
                </button>
              )}

              {/* Resume Mic Button (when paused) */}
              {isPaused && (
                <button
                  type="button"
                  onClick={handleResumeMic}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 animate-pulse"
                  title="Resume microphone and continue speaking"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{getTranslation('micResume', currentLanguage)}</span>
                </button>
              )}

              {/* Post & Translate Button */}
              <button
                type="button"
                onClick={handlePostAndTranslate}
                disabled={isTranslating || !inputText.trim()}
                className="py-3 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2"
                title="Immediately pause mic, submit transcription to translation, and play audio"
              >
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>{getTranslation('micPost', currentLanguage)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Translated Result Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>
                  {targetLang === 'hi'
                    ? '🇮🇳 हिन्दी अनुवाद (Hindi Output)'
                    : '🇬🇧 English Translation'}
                </span>
              </span>

              {translatedText && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-xs flex items-center gap-1"
                    title="Copy translated text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => speakText(translatedText, targetLang)}
                    className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-lg transition text-xs font-bold flex items-center gap-1"
                    title="Speak translated text out loud"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-700 animate-pulse" />
                    <span>🔊 Speak Aloud</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-indigo-50/50 border-2 border-indigo-300 rounded-2xl min-h-[140px] flex flex-col justify-between space-y-3">
              {translatedText ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {translatedText}
                  </p>

                  {/* Romanized Hindi Pronunciation Guide */}
                  {romanizedHindi && targetLang === 'hi' && (
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-xs space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider block">
                        🗣️ Pronunciation (Hinglish):
                      </span>
                      <p className="text-slate-700 font-medium italic">{romanizedHindi}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-indigo-800 font-semibold">
                      Spoken via Hindi / English Speech Engine
                    </span>

                    <button
                      onClick={() => speakText(translatedText, targetLang)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{targetLang === 'hi' ? '🔊 हिन्दी में सुनें' : '🔊 Listen in English'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-2">
                  <Languages className="w-8 h-8 text-indigo-300" />
                  <p className="text-xs font-medium">
                    Translation will appear here with voice speech playback
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAMPLE HEALTHCARE PHRASES (1-TAP TRANSLATION & SPEECH) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              🏥 Common Health & Medicine Questions (Tap to Translate & Speak):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleSentences.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (sourceLang === 'en') {
                    setInputText(sample.en);
                    handleTranslate(sample.en);
                  } else {
                    setInputText(sample.hi);
                    handleTranslate(sample.hi);
                  }
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition flex items-center justify-between gap-2 shadow-xs group"
              >
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                    {sourceLang === 'hi' ? sample.hi : sample.en}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium">
                    {sourceLang === 'hi' ? sample.en : sample.hi}
                  </span>
                </div>
                <div className="p-1.5 bg-white group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-slate-400 transition shrink-0">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
