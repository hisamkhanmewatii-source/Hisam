import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  AlertTriangle,
  Heart,
  Pill,
  User,
  ShieldAlert,
  Volume2,
  X,
  Edit2,
  Save,
  CheckCircle2,
  MapPin,
  Ambulance,
} from 'lucide-react';
import { SupportedLanguage } from '../../utils/translations';
import { speakText } from '../../utils/voiceService';
import { playButtonClickSound, ButtonSosPosition } from '../../utils/buttonSettings';

interface SosModalProps {
  currentLanguage: SupportedLanguage;
  easyMode: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  showFloatingButton?: boolean;
  sosPosition?: ButtonSosPosition;
  offsetX?: number;
  offsetY?: number;
  soundFeedback?: boolean;
}

interface CaregiverContact {
  name: string;
  relationship: string;
  phone: string;
  doctorName: string;
  doctorPhone: string;
}

const DEFAULT_CONTACT: CaregiverContact = {
  name: 'Hisam Family Caregiver',
  relationship: 'Son / Primary Guardian',
  phone: '+919876543210',
  doctorName: 'Dr. A. Sharma (Diabetologist)',
  doctorPhone: '+919811223344',
};

export const SosModal: React.FC<SosModalProps> = ({
  currentLanguage,
  easyMode,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  showFloatingButton = false,
  sosPosition = 'bottom-right',
  offsetX = 24,
  offsetY = 24,
  soundFeedback = true,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [contact, setContact] = useState<CaregiverContact>(() => {
    try {
      const saved = localStorage.getItem('freshguard_caregiver_contact');
      return saved ? JSON.parse(saved) : DEFAULT_CONTACT;
    } catch {
      return DEFAULT_CONTACT;
    }
  });

  const [formData, setFormData] = useState<CaregiverContact>(contact);

  useEffect(() => {
    try {
      localStorage.setItem('freshguard_caregiver_contact', JSON.stringify(contact));
    } catch {}
  }, [contact]);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContact(formData);
    setIsEditing(false);
  };

  const handleSoundAlarm = () => {
    const alarmMessage =
      currentLanguage === 'hi'
        ? 'आपातकाल! मरीज मोहम्मद हिसाम को तुरंत सहायता की आवश्यकता है! कृपया तुरंत डॉक्टर या परिजनों को बुलाएं!'
        : 'Emergency alert! Patient Mohammed Hisam requires immediate assistance! Please check vital signs and contact doctor immediately!';
    speakText(alarmMessage, currentLanguage);
  };

  const getWhatsAppMessage = () => {
    const msg =
      currentLanguage === 'hi'
        ? `🚨 आपातकालीन स्वास्थ्य अलर्ट: मरीज मोहम्मद हिसाम को तुरंत सहायता की आवश्यकता है। कृपया तुरंत संपर्क करें या घर आएं। फोन: ${contact.phone}`
        : `🚨 EMERGENCY MEDICAL ALERT: Patient Mohammed Hisam requires immediate attention. Please contact or reach location immediately. Contact: ${contact.phone}`;
    return encodeURIComponent(msg);
  };

  const getPositionStyle = (): React.CSSProperties => {
    switch (sosPosition) {
      case 'bottom-left':
        return { bottom: `${offsetY}px`, left: `${offsetX}px` };
      case 'bottom-center':
        return { bottom: `${offsetY}px`, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { top: `${offsetY + 70}px`, right: `${offsetX}px` };
      case 'top-left':
        return { top: `${offsetY + 70}px`, left: `${offsetX}px` };
      case 'mid-right':
        return { top: '50%', right: `${offsetX}px`, transform: 'translateY(-50%)' };
      case 'mid-left':
        return { top: '50%', left: `${offsetX}px`, transform: 'translateY(-50%)' };
      case 'bottom-right':
      default:
        return { bottom: `${offsetY}px`, right: `${offsetX}px` };
    }
  };

  return (
    <>
      {/* FLOATING PERSISTENT SOS BUTTON (Only rendered if explicitly enabled) */}
      {showFloatingButton && (
        <div className="fixed z-50 transition-all duration-300" style={getPositionStyle()}>
          <button
            onClick={() => {
              if (soundFeedback) playButtonClickSound(800);
              setInternalIsOpen(true);
              speakText(
                currentLanguage === 'hi' ? 'आपातकालीन सहायता मेनू खुला है।' : 'Emergency SOS opened.',
                currentLanguage
              );
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3.5 sm:px-5 sm:py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 text-white rounded-full shadow-2xl shadow-rose-600/50 border-2 border-rose-300 ring-4 ring-rose-500/20 transition-all duration-300"
            title="Emergency Medical SOS & Quick Caregiver Call"
          >
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
            </span>

            <ShieldAlert className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />

            <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
              {currentLanguage === 'hi' ? '🆘 आपातकाल (SOS)' : '🆘 SOS Emergency'}
            </span>
          </button>
        </div>
      )}

      {/* SOS EMERGENCY ACTION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border-2 border-rose-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                  <ShieldAlert className="w-7 h-7 animate-pulse text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-rose-950">
                      {currentLanguage === 'hi' ? 'आपातकालीन सहायता (Emergency SOS)' : 'Emergency Health & Caregiver SOS'}
                    </h2>
                  </div>
                  <p className="text-xs text-rose-700 font-semibold">
                    {currentLanguage === 'hi'
                      ? 'मरीज विवरण एवं त्वरित डॉक्टर/अभिभावक संपर्क'
                      : 'Critical health badge & 1-tap guardian/emergency triggers'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CRITICAL MEDICAL PASSPORT CARD */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'hi' ? 'मरीज मेडिकल प्रोफाइल' : 'Patient Medical Profile'}</span>
                </span>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-black rounded-full">
                  Blood: B+ Positive
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Patient Name</span>
                  <span className="font-black text-slate-900 text-sm">Mohammed Hisam</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Key Conditions</span>
                  <span className="font-bold text-slate-900 text-xs">Type-2 Diabetes • BP</span>
                </div>
                <div className="col-span-2 bg-white/90 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Daily Medications</span>
                  <span className="font-bold text-slate-800 text-xs">
                    Metformin 500mg • Glimepiride 1mg • Amlodipine 5mg
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                <span>⚠️ Hypoglycemia Warning: If glucose &lt; 70 mg/dL, provide 15g sugar immediately!</span>
              </div>
            </div>

            {/* 1-TAP EMERGENCY ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Call Caregiver */}
              <a
                href={`tel:${contact.phone}`}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition text-center"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                <span>
                  {currentLanguage === 'hi' ? '📞 परिजन को कॉल करें' : '📞 Call Caregiver'}
                </span>
              </a>

              {/* WhatsApp Alert */}
              <a
                href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {currentLanguage === 'hi' ? '💬 WhatsApp अलर्ट भेजें' : '💬 WhatsApp Alert'}
                </span>
              </a>

              {/* Call Doctor */}
              <a
                href={`tel:${contact.doctorPhone}`}
                className="p-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition text-center"
              >
                <Heart className="w-4 h-4" />
                <span>
                  {currentLanguage === 'hi' ? '👨‍⚕️ डॉक्टर को कॉल करें' : '👨‍⚕️ Call Doctor'}
                </span>
              </a>

              {/* Call Ambulance / 112 */}
              <a
                href="tel:112"
                className="p-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition text-center"
              >
                <Ambulance className="w-4 h-4" />
                <span>
                  {currentLanguage === 'hi' ? '🚑 एम्बुलेंस (112/108)' : '🚑 Ambulance (112)'}
                </span>
              </a>
            </div>

            {/* Sound Loud Voice Alarm */}
            <button
              type="button"
              onClick={handleSoundAlarm}
              className="w-full py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-black text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>
                {currentLanguage === 'hi' ? '📢 तेज़ आवाज़ में आपातकालीन सायरन बजाएं' : '📢 Sound Loud Voice Alarm'}
              </span>
            </button>

            {/* CAREGIVER CONTACT SETTINGS */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  {currentLanguage === 'hi' ? 'अभिभावक व डॉक्टर फोन नंबर' : 'Configured Emergency Contacts'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(contact);
                    setIsEditing(!isEditing);
                  }}
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveContact} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                      Caregiver Name & Relation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                      Caregiver Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                      Doctor Name & Phone
                    </label>
                    <input
                      type="text"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold mb-1.5"
                    />
                    <input
                      type="tel"
                      value={formData.doctorPhone}
                      onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Contact Changes</span>
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Caregiver:</span>
                    <span className="font-bold text-slate-900">{contact.name} ({contact.phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Doctor:</span>
                    <span className="font-bold text-slate-900">{contact.doctorName} ({contact.doctorPhone})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
