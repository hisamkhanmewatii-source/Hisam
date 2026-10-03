import { MedicationSymptomProfile, FoodSymptomProfile, SymptomLogEntry } from '../types';

export const BUILTIN_MEDICATION_SYMPTOMS: Record<string, MedicationSymptomProfile> = {
  metformin: {
    medicationName: 'Metformin HCl',
    purpose: 'Blood sugar regulation & insulin sensitivity for Diabetes',
    commonMildSymptoms: [
      'Mild nausea or feeling full quickly (first 1–3 weeks)',
      'Soft stools, gas, or mild abdominal rumbling',
      'Slight metallic or bitter taste in mouth',
      'Mild loss of appetite',
    ],
    howToPreventOrRelieve:
      'CRITICAL: Always take in the middle of a meal (after a few bites of food). Never take on an empty stomach with coffee or tea. Eating a fist-sized complex carb buffers stomach lining.',
    alertWarningSymptoms: [
      'Signs of Lactic Acidosis: Severe muscle pain, unusual drowsiness, fast/shallow breathing',
      'Severe dizziness, cold sweats, or shaking (if blood sugar drops below 70 mg/dL)',
      'Persistent vomiting where you cannot retain fluids',
    ],
    positiveSymptoms: [
      'Steadier daytime energy without mid-afternoon drowsiness',
      'Reduced excessive thirst and less frequent nighttime urination',
      'Fewer intense sugar or carbohydrate cravings',
    ],
    foodInteractionSymptoms:
      'Alcohol drastically multiplies lactic acidosis and hypoglycemia risk. Avoid heavy alcohol. Do not skip meals after taking a dose.',
  },
  lisinopril: {
    medicationName: 'Lisinopril',
    purpose: 'Blood pressure regulation & heart protection',
    commonMildSymptoms: [
      'Dry, tickly, persistent throat cough (especially when lying down)',
      'Mild lightheadedness or dizziness when standing up quickly',
      'Mild fatigue or headache in the first week',
    ],
    howToPreventOrRelieve:
      'Stand up slowly from beds and chairs (sit on edge for 30 seconds first). Sip warm water with honey for dry cough. Stay consistently hydrated.',
    alertWarningSymptoms: [
      'Swelling of face, lips, tongue, or throat (Angioedema - seek emergency care immediately)',
      'Severe lightheadedness or fainting spells',
      'Yellowing of skin or eyes (jaundice)',
    ],
    positiveSymptoms: [
      'Relief from morning tension headaches',
      'More relaxed heart rate and consistent blood pressure readings (around 120/80 mmHg)',
      'Improved cardiovascular stamina during light walking',
    ],
    foodInteractionSymptoms:
      'Avoid high-potassium salt substitutes and excessive bananas/potatoes as Lisinopril naturally retains potassium in the kidneys.',
  },
  atorvastatin: {
    medicationName: 'Atorvastatin (Lipitor)',
    purpose: 'Cholesterol management & plaque reduction',
    commonMildSymptoms: [
      'Mild joint ache or mild muscle stiffness after light exercise',
      'Occasional mild constipation, nausea, or bloating',
      'Mild headache',
    ],
    howToPreventOrRelieve:
      'Best taken at bedtime because the liver synthesizes most cholesterol during sleep. Drink 1 full glass of water. CoQ10 supplements or magnesium may support muscle comfort (consult doctor).',
    alertWarningSymptoms: [
      'Unexplained severe muscle soreness, weakness, or tenderness (especially with fever)',
      'Dark, tea-colored urine (rare sign of rhabdomyolysis)',
      'Severe upper abdominal pain radiating to the back',
    ],
    positiveSymptoms: [
      'Steadily declining LDL cholesterol and triglyceride levels',
      'Reduced arterial inflammation markers',
    ],
    foodInteractionSymptoms:
      'DO NOT consume Grapefruit or grapefruit juice! Grapefruit blocks the CYP3A4 enzyme, leading to dangerously high blood levels of the drug.',
  },
  omeprazole: {
    medicationName: 'Omeprazole (Prilosec)',
    purpose: 'Acid reflux, GERD & stomach ulcer prevention',
    commonMildSymptoms: [
      'Mild morning headache or slight dizziness',
      'Occasional mild stomach ache, gas, or mild constipation',
      'Dry mouth',
    ],
    howToPreventOrRelieve:
      'Take 30 to 60 minutes BEFORE breakfast on an empty stomach with a full glass of water so it can coat and inhibit stomach acid pumps before food arrives.',
    alertWarningSymptoms: [
      'Severe watery diarrhea that does not stop (C. difficile concern)',
      'Sudden muscle cramps, spasms, or irregular heartbeat (low magnesium sign)',
      'Signs of allergic rash, hives, or swelling',
    ],
    positiveSymptoms: [
      'Complete relief from burning chest pain (heartburn)',
      'No sour or acidic taste in the mouth upon waking',
      'Comfortable swallowing without throat irritation',
    ],
    foodInteractionSymptoms:
      'Avoid high-caffeine beverages, spicy sauces, and mint close to meal times as they weaken the esophageal sphincter.',
  },
  amoxicillin: {
    medicationName: 'Amoxicillin / Antibiotics',
    purpose: 'Bacterial infection treatment',
    commonMildSymptoms: [
      'Mild loose stools or digestive rumbling (kills natural gut flora)',
      'Mild nausea or feeling queasy',
      'Slight oral yeast or white coating on tongue',
    ],
    howToPreventOrRelieve:
      'Always take with food or a glass of milk to prevent nausea. Consume prebiotic foods (oats, bananas) or probiotic yogurt 2 hours apart from the antibiotic dose.',
    alertWarningSymptoms: [
      'Hives, itching, or red skin rash (Penicillin allergy - stop and call doctor)',
      'Difficulty breathing or throat tightness',
      'Severe, watery or bloody diarrhea',
    ],
    positiveSymptoms: [
      'Reduction in body temperature and fever within 48 hours',
      'Decreased localized swelling, pain, and redness',
      'Gradual return of natural energy levels',
    ],
    foodInteractionSymptoms:
      'Finish the ENTIRE prescribed course even if symptoms vanish. Space evenly through the day.',
  },
  aspirin: {
    medicationName: 'Aspirin (Low Dose)',
    purpose: 'Blood clot prevention & stroke / heart attack risk reduction',
    commonMildSymptoms: [
      'Mild stomach irritation or indigestion',
      'Slightly easier bruising if bumping into furniture',
      'Slight bleeding that takes longer to stop when shaving or nicked',
    ],
    howToPreventOrRelieve:
      'Take with a full meal or a tall glass of milk to prevent stomach acid erosion. Use enteric-coated tablets if sensitive.',
    alertWarningSymptoms: [
      'Black, tarry, or bloody stools (gastrointestinal bleeding)',
      'Vomiting blood or material looking like coffee grounds',
      'Ringing in ears (tinnitus - sign of overdose)',
    ],
    positiveSymptoms: [
      'Optimal platelet inhibition protecting against arterial thrombosis',
    ],
    foodInteractionSymptoms:
      'Avoid mixing with alcohol or NSAIDs like Ibuprofen without medical advice, as this triples stomach ulcer risk.',
  },
  vitamind3: {
    medicationName: 'Vitamin D3 (Cholecalciferol)',
    purpose: 'Bone strength, immune defense & calcium absorption',
    commonMildSymptoms: [
      'Extremely safe and well-tolerated at normal doses',
      'Very rare mild dry mouth or slight metallic taste',
    ],
    howToPreventOrRelieve:
      'Take with your largest meal containing healthy dietary fat (e.g. olive oil, eggs, yogurt) for maximum fat-soluble absorption.',
    alertWarningSymptoms: [
      'Excessive thirst, frequent urination, nausea (only occurs with massive chronic overdose causing hypercalcemia)',
    ],
    positiveSymptoms: [
      'Stronger bones and reduced seasonal fatigue',
      'Enhanced immune resilience against respiratory bugs',
    ],
    foodInteractionSymptoms:
      'Pairs synergistically with calcium-rich foods (milk, yogurt, leafy greens).',
  },
};

export const BUILTIN_FOOD_SYMPTOMS: FoodSymptomProfile[] = [
  {
    id: 'food-spoilage-poisoning',
    condition: 'Food Poisoning / Spoiled Bacteria Reaction',
    category: 'spoilage_poisoning',
    icon: '🤢',
    commonSymptoms: [
      'Sudden abdominal cramping and sharp stomach spasms',
      'Watery or frequent diarrhea',
      'Nausea and acute vomiting (body purging contaminated food)',
      'Low to moderate fever and chills',
      'Generalized body weakness and muscle aches',
    ],
    culpritFoods: [
      'Expired raw or undercooked poultry / chicken (Salmonella, Campylobacter)',
      'Sour expired milk, unpasteurized cheese, or warm dairy',
      'Slimy wilted greens / spinach kept in moist plastic bags (E. coli)',
      'Leftover rice or pasta left at room temperature (Bacillus cereus)',
    ],
    timeframe: 'Onset typically 1 to 8 hours after consuming spoiled food (can take up to 24h).',
    immediateAction:
      '1. Sip water with electrolytes (Oral Rehydration Salts). Do NOT gulp.\n2. Do not take anti-diarrhea meds right away; body is attempting to flush toxins.\n3. Rest stomach for 4–6 hours, then follow BRAT diet (Bananas, Rice, Applesauce, Toast).',
    preventionAdvice:
      'Respect the expiration countdown in your pantry tab. Throw away milk with sour odor or poultry with sticky slime.',
    redFlagDoctorSigns: [
      'Fever higher than 101.5°F (38.6°C)',
      'Inability to keep liquids down for more than 12 hours (risk of dehydration)',
      'Blood in vomit or bowel movements',
      'Severe dizziness, dark urine, or fainting when standing up',
    ],
  },
  {
    id: 'food-lactose-intolerance',
    condition: 'Lactose Intolerance / Dairy Sensitivity',
    category: 'intolerance',
    icon: '🥛',
    commonSymptoms: [
      'Abdominal bloating and feeling like an inflated balloon',
      'Gurgling, audible rumbling sounds in the lower stomach',
      'Loose stools or sudden explosive diarrhea',
      'Excessive gas and flatulence',
      'Mild stomach cramps without fever or vomiting',
    ],
    culpritFoods: [
      'Fresh whole milk or skim cow milk',
      'Soft unaged cheeses (ricotta, mozzarella, cottage cheese)',
      'Ice cream and heavy cream sauces',
    ],
    timeframe: 'Occurs 30 minutes to 2 hours after consuming dairy.',
    immediateAction:
      'Drink peppermint or ginger tea to reduce gas tension. Sip warm water. Symptoms resolve naturally once the dairy clears the digestive tract.',
    preventionAdvice:
      'Switch to lactose-free milk, fortified soy milk, or almond milk. Hard aged cheeses (cheddar, parmesan) naturally have near-zero lactose.',
    redFlagDoctorSigns: [
      'Unexplained weight loss or persistent diarrhea lasting over 5 days',
      'Severe fever or blood present (indicates infection, not simple intolerance)',
    ],
  },
  {
    id: 'food-acid-reflux',
    condition: 'Acid Reflux / Heartburn / GERD',
    category: 'acid_gerd',
    icon: '🔥',
    commonSymptoms: [
      'Burning sensation rising in the chest behind the breastbone',
      'Sour or bitter acid regurgitation in the back of the throat',
      'Difficulty or uncomfortable swallowing',
      'Persistent dry morning throat clearing or hoarseness',
      'Belching or hiccups shortly after eating',
    ],
    culpritFoods: [
      'Citrus fruits (oranges, lemons, grapefruit) and juices',
      'Tomato sauces, ketchup, and raw onions/garlic',
      'Fried, greasy, or high-fat foods',
      'Dark chocolate, peppermint, and strong coffee',
    ],
    timeframe: 'Develops within 20 to 60 minutes after eating, especially if lying down or bending.',
    immediateAction:
      'Remain upright for at least 2–3 hours after eating. Sip a small glass of water or chamomile tea. Loosen tight waistbands. Take an antacid if approved by doctor.',
    preventionAdvice:
      'Eat smaller, frequent meals. Finish dinner at least 3 hours before going to bed. Elevate head of bed by 6 inches.',
    redFlagDoctorSigns: [
      'Crushing chest pain radiating to left arm or jaw (Seek 911 / Emergency immediately - rule out heart attack)',
      'Food feeling stuck in throat or painful swallowing',
      'Unexplained weight loss or chronic vomiting',
    ],
  },
  {
    id: 'food-sugar-spike',
    condition: 'High Blood Sugar Spike & Post-Meal Crash',
    category: 'sugar_spike',
    icon: '🩸',
    commonSymptoms: [
      'Sudden heavy drowsiness or brain fog 45–90 minutes after eating',
      'Intense unquenchable thirst and dry mouth',
      'Frequent urge to urinate',
      'Slight blurry vision or headache',
      'Sudden shakiness and fatigue when glucose plunges 2 hours later (reactive crash)',
    ],
    culpritFoods: [
      'White bread, refined flour pastries, and white rice without fiber',
      'Sugary sodas, sweet juices, and desserts',
      'Eating carbohydrates alone without protein or fiber buffer',
    ],
    timeframe: 'Spikes peak between 45 and 90 minutes; crash occurs at 120–180 minutes.',
    immediateAction:
      'Drink 2 full glasses of plain water to help kidneys flush excess glucose. Take a brisk 10–15 minute walk (muscle contraction absorbs glucose without extra insulin).',
    preventionAdvice:
      'Always follow the "Food Sequencing" rule: Eat fiber/vegetables first, protein second, and carbohydrates last! Pair all carbs with protein.',
    redFlagDoctorSigns: [
      'Blood glucose reading over 250 mg/dL that stays high',
      'Fruity-smelling breath, nausea, and deep rapid breathing (signs of Diabetic Ketoacidosis)',
      'Confusion or extreme weakness',
    ],
  },
  {
    id: 'food-allergy-reaction',
    condition: 'Food Allergy & Histamine Reaction',
    category: 'allergy',
    icon: '⚠️',
    commonSymptoms: [
      'Tingling or itchy sensation on lips, tongue, or roof of mouth',
      'Raised red hives (welts) or itchy skin rash',
      'Runny nose, sneezing, or watery itchy eyes',
      'Nausea or sudden stomach cramps',
    ],
    culpritFoods: [
      'Shellfish, fish, tree nuts, peanuts, eggs, soy, wheat, or aged fermented foods',
    ],
    timeframe: 'Usually immediate (minutes to 2 hours after ingestion).',
    immediateAction:
      'Stop eating immediately. If mild (just localized itch), take an antihistamine if prescribed. If throat tightens, use Epinephrine auto-injector immediately!',
    preventionAdvice:
      'Read all food ingredient labels vigilantly and avoid cross-contamination in kitchen pans.',
    redFlagDoctorSigns: [
      'ANY swelling of lips, tongue, face, or throat',
      'Wheezing, whistling breath, or difficulty breathing (Anaphylaxis - call emergency services immediately)',
      'Sudden drop in blood pressure, dizziness, or fainting',
    ],
  },
];

export async function fetchMedicationSymptomProfile(
  medName: string,
  dosage?: string
): Promise<MedicationSymptomProfile> {
  const cleanName = medName.toLowerCase().trim();

  // Check built-in dictionary first
  for (const [key, profile] of Object.entries(BUILTIN_MEDICATION_SYMPTOMS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return {
        ...profile,
        dosage: dosage || profile.dosage,
      };
    }
  }

  // If not built-in, call Gemini API
  try {
    const res = await fetch('/api/gemini/medicine-symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationName: medName, dosage }),
    });

    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Could not fetch online symptom profile:', err);
  }

  // Fallback clinical profile
  return {
    medicationName: medName,
    dosage: dosage || 'Prescribed dose',
    purpose: 'Doctor prescribed therapeutic medication',
    commonMildSymptoms: [
      'Mild stomach adjustment in the first week',
      'Mild dry mouth or slight dizziness upon standing',
      'Changes in digestion or appetite',
    ],
    howToPreventOrRelieve:
      'Take with a full 250ml glass of water. Unless instructed to take on an empty stomach, take alongside a balanced meal with protein and complex carbs.',
    alertWarningSymptoms: [
      'Skin rash, hives, or swelling around lips or face',
      'Severe dizziness, chest tightness, or shortness of breath',
      'Extreme nausea where medicine cannot be kept down',
    ],
    positiveSymptoms: [
      'Target clinical condition stabilization and improved daily wellbeing',
    ],
    foodInteractionSymptoms:
      'Avoid drinking alcohol with this medication. Take at consistent daily hours.',
  };
}

export async function correlateSymptomWithTriggers(params: {
  symptomName: string;
  severity: 'mild' | 'moderate' | 'severe';
  timing: string;
  recentFoods: string[];
  recentMeds: Array<{ name: string; dosage: string; foodRule: string }>;
  notes?: string;
}): Promise<SymptomLogEntry> {
  const { symptomName, severity, timing, recentFoods, recentMeds, notes } = params;

  // Try server Gemini route first
  try {
    const res = await fetch('/api/gemini/correlate-symptom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const json = await res.json();
    if (json.success && json.data) {
      return {
        id: `symptom-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        symptomName,
        severity,
        timing,
        notes,
        identifiedPrimaryTrigger: json.data.identifiedPrimaryTrigger,
        triggerType: json.data.triggerType,
        confidenceScore: json.data.confidenceScore,
        correlatedMedications: json.data.correlatedMedications || [],
        correlatedFoods: json.data.correlatedFoods || [],
        actionPlan: json.data.actionPlan,
        warningSigns: json.data.warningSigns || [
          'High fever (>101.5°F)',
          'Difficulty breathing or facial swelling',
          'Inability to keep liquids down for 12 hours',
        ],
      };
    }
  } catch (err) {
    console.warn('API correlation failed, falling back to local clinical rules:', err);
  }

  // Clinical Rule-Based Correlation Engine (Local Fallback)
  const symLower = symptomName.toLowerCase();
  const medMatches: SymptomLogEntry['correlatedMedications'] = [];
  const foodMatches: SymptomLogEntry['correlatedFoods'] = [];

  // Check medications
  for (const med of recentMeds) {
    const nameLower = med.name.toLowerCase();
    if (
      (symLower.includes('nausea') || symLower.includes('stomach') || symLower.includes('diarrhea')) &&
      nameLower.includes('metformin')
    ) {
      medMatches.push({
        name: med.name,
        dosage: med.dosage,
        likelihood: 'high',
        reason: 'Metformin frequently irritates gastric mucosa if not buffered with complex carbohydrate meals.',
      });
    } else if (
      (symLower.includes('cough') || symLower.includes('dizzy') || symLower.includes('lightheaded')) &&
      nameLower.includes('lisinopril')
    ) {
      medMatches.push({
        name: med.name,
        dosage: med.dosage,
        likelihood: 'high',
        reason: 'Lisinopril causes bradykinin cough and post-dose vasodilation (mild blood pressure dip).',
      });
    } else if (
      (symLower.includes('muscle') || symLower.includes('ache') || symLower.includes('cramp')) &&
      nameLower.includes('statin')
    ) {
      medMatches.push({
        name: med.name,
        dosage: med.dosage,
        likelihood: 'medium',
        reason: 'Statin medications can occasionally induce mild myalgia in muscle tissue.',
      });
    } else if (
      (symLower.includes('heartburn') || symLower.includes('stomach')) &&
      (nameLower.includes('aspirin') || nameLower.includes('ibuprofen'))
    ) {
      medMatches.push({
        name: med.name,
        dosage: med.dosage,
        likelihood: 'high',
        reason: 'NSAIDs/Aspirin inhibit prostaglandins that protect the stomach lining.',
      });
    } else {
      medMatches.push({
        name: med.name,
        dosage: med.dosage,
        likelihood: 'low',
        reason: 'Routine dose taken recently; secondary possibility.',
      });
    }
  }

  // Check foods
  for (const food of recentFoods) {
    const fLower = food.toLowerCase();
    if (
      (symLower.includes('bloat') || symLower.includes('gas') || symLower.includes('diarrhea') || symLower.includes('cramp')) &&
      (fLower.includes('milk') || fLower.includes('cheese') || fLower.includes('yogurt') || fLower.includes('dairy'))
    ) {
      foodMatches.push({
        name: food,
        likelihood: 'high',
        reason: 'Dairy sugars (lactose) require lactase enzymes. Incomplete breakdown causes rapid gas and fluid retention.',
      });
    } else if (
      (symLower.includes('burn') || symLower.includes('heartburn') || symLower.includes('acid') || symLower.includes('reflux')) &&
      (fLower.includes('tomato') || fLower.includes('citrus') || fLower.includes('spicy') || fLower.includes('fried') || fLower.includes('coffee'))
    ) {
      foodMatches.push({
        name: food,
        likelihood: 'high',
        reason: 'Acidic or high-fat foods relax the lower esophageal sphincter and stimulate excessive gastric acid.',
      });
    } else if (
      (symLower.includes('tired') || symLower.includes('drowsy') || symLower.includes('fog') || symLower.includes('thirst')) &&
      (fLower.includes('rice') || fLower.includes('bread') || fLower.includes('sugar') || fLower.includes('sweet') || fLower.includes('pasta'))
    ) {
      foodMatches.push({
        name: food,
        likelihood: 'medium',
        reason: 'High glycemic index carbohydrates cause a sharp glucose spike followed by a reactive slump.',
      });
    } else {
      foodMatches.push({
        name: food,
        likelihood: 'low',
        reason: 'Recent food intake could contribute to digestive workload.',
      });
    }
  }

  // Formulate conclusion
  let identifiedPrimaryTrigger = 'General physiological response to recent intake.';
  let triggerType: SymptomLogEntry['triggerType'] = 'unknown';

  const highMed = medMatches.find((m) => m.likelihood === 'high');
  const highFood = foodMatches.find((f) => f.likelihood === 'high');

  if (highMed && highFood) {
    triggerType = 'food_med_combination';
    identifiedPrimaryTrigger = `Combined effect: Interaction between ${highMed.name} and ${highFood.name}.`;
  } else if (highMed) {
    triggerType = 'medicine';
    identifiedPrimaryTrigger = `Medication Side Effect: Highly correlated with your dose of ${highMed.name}.`;
  } else if (highFood) {
    triggerType = 'food';
    identifiedPrimaryTrigger = `Dietary Reaction: Highly correlated with recently consumed ${highFood.name}.`;
  } else if (recentMeds.length > 0) {
    triggerType = 'medicine';
    identifiedPrimaryTrigger = `Likely mild adjustment to ${recentMeds[0].name}.`;
  } else if (recentFoods.length > 0) {
    triggerType = 'food';
    identifiedPrimaryTrigger = `Likely digestive response to ${recentFoods[0]}.`;
  }

  return {
    id: `symptom-log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    symptomName,
    severity,
    timing,
    notes,
    identifiedPrimaryTrigger,
    triggerType,
    confidenceScore: highMed || highFood ? 'high' : 'medium',
    correlatedMedications: medMatches,
    correlatedFoods: foodMatches,
    actionPlan: highMed
      ? '1. Drink a 250ml glass of plain water.\n2. If taken without food, eat 1 piece of whole grain toast or crackers.\n3. Rest in an upright seated position for 30 minutes.'
      : '1. Sip warm water or ginger tea.\n2. Avoid further dairy or spicy foods for 12 hours.\n3. Take slow, deep breaths to relax stomach spasms.',
    warningSigns: [
      'Chest tightness, severe shortness of breath, or facial/lip swelling',
      'Inability to retain liquids for more than 12 hours',
      'Sudden severe dizziness or fainting',
    ],
  };
}
