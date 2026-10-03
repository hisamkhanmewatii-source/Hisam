export type SupportedLanguage = 'en' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    appName: 'Health+Online',
    appSubtitle: 'Food rot controller • Phone alerts • Right medication on time',
    safeFoodMeds: 'Safe Food & Meds',
    navFood: 'Food & Expiration',
    navMeds: 'Meds & Supplements',
    navPortions: 'What To Eat & Portions',
    navRecipes: 'Healthy Recipes',
    navMealsAndRecipes: 'What To Eat & Recipes',
    navSymptoms: 'Symptoms Guide',
    navDiabetes: 'Diabetes & Sugar Care',
    navAlerts: 'Phone Alerts',
    navTranslator: 'Voice & Translator',
    navVoiceAndAlerts: 'Voice & Phone Alerts',
    easyModeOn: 'Elderly Easy Mode ON',
    easyModeOff: 'Easy Mode',
    scanCamera: 'Scan Box / Pill',
    listenGreeting: 'Listen Overview',
    addFood: 'Add Food Item',
    addMedication: 'Add Medication',
    scanMedicineBottle: 'Scan Tablet / Box',
    readSchedule: 'Read Meds',
    slotMorning: 'Morning',
    slotNoon: 'Mid-Day',
    slotEvening: 'Evening',
    slotBedtime: 'Bedtime',
    symptomsTitle: 'Food & Medicine Symptoms Center',
    symptomsSubtitle: 'Log symptoms to correlate triggers • Side effects for your added medicines • Food spoilage reactions',
    logSymptomTab: 'Log Symptom & Correlate Trigger',
    medSymptomsTab: 'Medicine Symptoms Guide',
    foodSymptomsTab: 'Food Symptoms Directory',
    translateHeading: 'Microphone & Language Translator (English ⇄ Hindi)',
    translateSubtitle: 'Speak in Hindi or English using your microphone to translate and hear speech out loud',
    speakMicrophone: 'Speak in Microphone',
    listeningNow: 'Listening... Please speak now',
    translateButton: 'Translate Now',
    sourceTextPlaceholder: 'Type or speak anything here to translate (e.g. When should I take Metformin? / Mujhe kab dawai leni chahiye?)...',
    translatedResult: 'Translated Result:',
    pronunciationGuide: 'Pronunciation Guide (Romanized Hindi):',
    speakOutLoud: 'Listen in Voice',
    copyText: 'Copy Text',
    copied: 'Copied!',
    clear: 'Clear',
    micPause: 'Pause Mic (⏸️)',
    micResume: 'Resume Mic (▶️)',
    micPost: 'Post & Translate (🚀)',
    changeLanguagePrompt: 'Choose Language:',
    emergencyNotice: 'Emergency Notice: In case of acute chest pain, shortness of breath, or sudden facial swelling, contact emergency medical services immediately.',
    diabetesTitle: 'Diabetes & Sugar Control Care Center',
    diabetesSubtitle: 'Daily meal routine • Medication timing rules • Calorie burning & exercises to prevent sugar spikes',
  },
  hi: {
    appName: 'हेल्थ+ऑनलाइन',
    appSubtitle: 'भोजन सड़ने से रोकथाम • फ़ोन अलर्ट • सही समय पर सही दवा',
    safeFoodMeds: 'सुरक्षित भोजन और दवा',
    navFood: 'भोजन और समाप्ति',
    navMeds: 'दवा व सप्लीमेंट्स',
    navPortions: 'क्या खाएं और मात्रा',
    navRecipes: 'स्वस्थ व्यंजन',
    navMealsAndRecipes: 'क्या खाएं व व्यंजन',
    navSymptoms: 'लक्षण गाइड',
    navDiabetes: 'शुगर और डायबिटीज केयर',
    navAlerts: 'फ़ोन अलर्ट्स',
    navTranslator: 'आवाज़ और अनुवादक',
    navVoiceAndAlerts: 'आवाज़ व फ़ोन अलर्ट',
    easyModeOn: 'बुजुर्ग सरल मोड चालू',
    easyModeOff: 'सरल मोड',
    scanCamera: 'दवा / बॉक्स स्कैन करें',
    listenGreeting: 'आवाज़ में सुनें',
    addFood: 'भोजन जोड़ें',
    addMedication: 'दवा जोड़ें',
    scanMedicineBottle: 'दवा पत्ता / डिब्बा स्कैन करें',
    readSchedule: 'दवाइयां सुनें',
    slotMorning: 'सुबह',
    slotNoon: 'दोपहर',
    slotEvening: 'शाम',
    slotBedtime: 'रात को सोने से पहले',
    symptomsTitle: 'भोजन और दवा लक्षण केंद्र',
    symptomsSubtitle: 'लक्षण दर्ज करें और कारण जानें • अपनी जोड़ी हुई दवाओं के दुष्प्रभाव • बासी भोजन की प्रतिक्रियाएं',
    logSymptomTab: 'लक्षण दर्ज करें और कारण पता करें',
    medSymptomsTab: 'दवा लक्षण गाइड',
    foodSymptomsTab: 'भोजन लक्षण निर्देशिका',
    translateHeading: 'माइक्रोफ़ोन और भाषा अनुवादक (English ⇄ हिन्दी)',
    translateSubtitle: 'माइक्रोफ़ोन में हिन्दी या अंग्रेज़ी बोलें, अनुवाद करें और आवाज़ में सुनें',
    speakMicrophone: 'माइक्रोफ़ोन में बोलें',
    listeningNow: 'सुन रहा है... कृपया अब बोलिए',
    translateButton: 'अनुवाद करें',
    sourceTextPlaceholder: 'यहाँ कुछ भी लिखें या माइक्रोफ़ोन में बोलें (जैसे: मेटफ़ॉर्मिन कब खानी चाहिए? / When should I take my medicine?)...',
    translatedResult: 'अनुवादित परिणाम:',
    pronunciationGuide: 'उच्चारण गाइड (हिंग्लिश / Romanized Hindi):',
    speakOutLoud: 'आवाज़ में सुनें',
    copyText: 'कॉपी करें',
    copied: 'कॉपी हो गया!',
    clear: 'साफ़ करें',
    micPause: 'माइक रोकें (⏸️)',
    micResume: 'फिर शुरू करें (▶️)',
    micPost: 'पोस्ट व अनुवाद करें (🚀)',
    changeLanguagePrompt: 'भाषा चुनें:',
    emergencyNotice: 'आपातकालीन सूचना: यदि सीने में तेज दर्द, सांस लेने में तकलीफ या चेहरे पर सूजन हो, तो तुरंत डॉक्टर या आपातकालीन सेवा से संपर्क करें।',
    diabetesTitle: 'मधुमेह एवं शुगर नियंत्रण केंद्र',
    diabetesSubtitle: 'दैनिक भोजन दिनचर्या • दवाइयों का सही समय • शुगर रोकने के लिए व्यायाम व कैलोरी बर्न',
  },
};

export function getTranslation(key: string, lang: SupportedLanguage): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function formatGreetingSpeech(
  lang: SupportedLanguage,
  slotLabel: string,
  dueMedsCount: number,
  expiringFoodCount: number
): string {
  if (lang === 'hi') {
    return `मोहम्मद हिसाम हेल्थ में आपका स्वागत है। अभी ${slotLabel} का समय है। आपके पास अभी लेने के लिए ${dueMedsCount} दवा है, और रसोई में ${expiringFoodCount} खाद्य सामग्री जल्द खराब होने वाली है।`;
  }
  return `Welcome to Mohammed Hisam Health. Current time slot is ${slotLabel}. You have ${dueMedsCount} medicine due right now, and ${expiringFoodCount} food items expiring soon.`;
}
