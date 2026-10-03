import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initGoogleDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getGoogleDriveAccessToken,
} from '../../utils/googleDriveAuth';
import {
  DriveFile,
  listDriveFiles,
  getOrCreateAppFolder,
  backupAppDataToDrive,
  saveMedicationScheduleToDrive,
  downloadDriveFileContent,
  deleteDriveFile,
  uploadTextFileToDrive,
} from '../../utils/googleDriveService';
import { FoodItem, Medication, RecipeItem } from '../../types';
import { speakText } from '../../utils/voiceService';
import { playButtonClickSound } from '../../utils/buttonSettings';
import { SupportedLanguage } from '../../utils/translations';
import confetti from 'canvas-confetti';
import {
  HardDrive,
  UploadCloud,
  DownloadCloud,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Shield,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  X,
  FileSpreadsheet,
  FileJson,
  LogOut,
  Folder,
} from 'lucide-react';

interface GoogleDriveHubProps {
  foodItems: FoodItem[];
  medications: Medication[];
  onRestoreData?: (data: { foodItems?: FoodItem[]; medications?: Medication[] }) => void;
  currentLanguage?: SupportedLanguage;
  easyMode?: boolean;
}

export const GoogleDriveHub: React.FC<GoogleDriveHubProps> = ({
  foodItems,
  medications,
  onRestoreData,
  currentLanguage = 'en',
  easyMode = false,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Files & Drive State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<'app_folder' | 'all'>('app_folder');
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  // Modals & Confirmation Dialogs
  const [deleteCandidate, setDeleteCandidate] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExportingMeds, setIsExportingMeds] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ name: string; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New file upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when user is authenticated
  const fetchDriveFiles = async (token: string, filterMode: 'app_folder' | 'all', query = '') => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      let targetFolderId: string | undefined = undefined;
      if (filterMode === 'app_folder') {
        const fId = appFolderId || (await getOrCreateAppFolder(token));
        setAppFolderId(fId);
        targetFolderId = fId;
      }

      const res = await listDriveFiles(token, {
        folderId: targetFolderId,
        query: query.trim() || undefined,
        pageSize: 35,
      });

      setFiles(res.files);
    } catch (err: any) {
      console.error('Error listing drive files:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to list Google Drive files',
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles(accessToken, folderFilter, searchQuery);
    }
  }, [accessToken, folderFilter]);

  const handleSignIn = async () => {
    playButtonClickSound();
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleDrive();
      setUser(res.user);
      setAccessToken(res.accessToken);
      speakText('Successfully connected to Google Drive!', currentLanguage);
      fetchDriveFiles(res.accessToken, folderFilter);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not sign in with Google.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    playButtonClickSound();
    await signOutGoogleDrive();
    setUser(null);
    setAccessToken(null);
    setFiles([]);
    speakText('Signed out of Google Drive.', currentLanguage);
  };

  // 1-Click Backup App Data
  const handleBackupAppData = async () => {
    if (!accessToken) return;
    playButtonClickSound();
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const customRecipes = JSON.parse(localStorage.getItem('freshguard_custom_recipes') || '[]');
      const uploaded = await backupAppDataToDrive(accessToken, {
        foodItems,
        medications,
        customRecipes,
      });

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
      });

      setStatusMessage({
        type: 'success',
        text: `Backup successfully uploaded to Google Drive as "${uploaded.name}"!`,
      });
      speakText('Pantry and medication backup saved to Google Drive!');
      fetchDriveFiles(accessToken, folderFilter, searchQuery);
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to backup data to Google Drive.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 1-Click Save Medication Schedule
  const handleSaveMedsToDrive = async () => {
    if (!accessToken) return;
    playButtonClickSound();
    setIsExportingMeds(true);
    setStatusMessage(null);
    try {
      const uploaded = await saveMedicationScheduleToDrive(accessToken, medications);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6'],
      });
      setStatusMessage({
        type: 'success',
        text: `Medication schedule document created in Google Drive as "${uploaded.name}"!`,
      });
      speakText('Medication schedule saved to Google Drive.');
      fetchDriveFiles(accessToken, folderFilter, searchQuery);
    } catch (err: any) {
      console.error('Save meds error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save medication schedule to Google Drive.',
      });
    } finally {
      setIsExportingMeds(false);
    }
  };

  // Restore backup from Google Drive
  const handleRestoreFile = async (file: DriveFile) => {
    if (!accessToken) return;
    playButtonClickSound();
    try {
      const content = await downloadDriveFileContent(accessToken, file.id);
      const parsed = JSON.parse(content);
      if (parsed.foodItems || parsed.medications) {
        if (onRestoreData) {
          onRestoreData({
            foodItems: parsed.foodItems,
            medications: parsed.medications,
          });
        }
        if (parsed.customRecipes && Array.isArray(parsed.customRecipes)) {
          localStorage.setItem('freshguard_custom_recipes', JSON.stringify(parsed.customRecipes));
        }

        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#10b981', '#3b82f6'],
        });

        setStatusMessage({
          type: 'success',
          text: `Successfully restored ${parsed.foodItems?.length || 0} food items and ${parsed.medications?.length || 0} medications from Google Drive!`,
        });
        speakText('Data restored from Google Drive successfully.');
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Selected file does not appear to be a valid Health+Online backup JSON file.',
        });
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${err.message}`,
      });
    }
  };

  // Preview file content
  const handlePreviewFile = async (file: DriveFile) => {
    if (!accessToken) return;
    playButtonClickSound();
    try {
      const text = await downloadDriveFileContent(accessToken, file.id);
      setPreviewContent({ name: file.name, text });
    } catch (err: any) {
      console.error('Preview error:', err);
      setStatusMessage({
        type: 'error',
        text: `Cannot preview this file: ${err.message}`,
      });
    }
  };

  // Confirm and Execute Destructive File Deletion (MANDATORY REQUIREMENT)
  const handleConfirmDelete = async () => {
    if (!accessToken || !deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, deleteCandidate.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteCandidate.id));
      setStatusMessage({
        type: 'success',
        text: `Permanently deleted "${deleteCandidate.name}" from Google Drive.`,
      });
      speakText('File deleted from Google Drive.');
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMessage({
        type: 'error',
        text: `Deletion failed: ${err.message}`,
      });
    } finally {
      setIsDeleting(false);
      setDeleteCandidate(null);
    }
  };

  // Create & upload custom note/file
  const handleCreateCustomFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadTitle.trim() || !uploadContent.trim()) return;
    setIsUploading(true);
    try {
      const folderId = appFolderId || (await getOrCreateAppFolder(accessToken));
      const fileName = uploadTitle.endsWith('.md') || uploadTitle.endsWith('.txt')
        ? uploadTitle
        : `${uploadTitle}.txt`;

      await uploadTextFileToDrive(accessToken, {
        name: fileName,
        content: uploadContent,
        mimeType: 'text/plain',
        folderId,
      });

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadContent('');
      setStatusMessage({
        type: 'success',
        text: `File "${fileName}" uploaded to Google Drive folder!`,
      });
      fetchDriveFiles(accessToken, folderFilter, searchQuery);
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-300" />
                Google Drive Integration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Cloud Sync & Backups
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Google Drive Cloud Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Seamlessly backup your food inventory, medication schedules, and favorite healthy recipes
              directly to your Google Drive account, or restore and browse existing cloud files.
            </p>
          </div>

          {/* User Sign-In / Account Status Pill */}
          <div className="self-start md:self-auto shrink-0">
            {user ? (
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{user.displayName || 'Google Account'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-blue-200 truncate max-w-[180px]">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-white/20 rounded-xl text-blue-200 hover:text-white transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official GSI Style Sign In Button */
              <button
                disabled={isSigningIn}
                onClick={handleSignIn}
                className="gsi-material-button bg-white text-slate-800 font-bold px-4 py-2.5 rounded-2xl shadow-xl hover:bg-slate-50 transition active:scale-95 flex items-center gap-3 border border-slate-200"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quick App Folder Info */}
        {user && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-blue-200 gap-2">
            <div className="flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-amber-300" />
              <span>Dedicated App Storage Folder:</span>
              <strong className="text-white">FreshKeep Health &amp; Pantry</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-300 font-bold">● Authorized &amp; Connected</span>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK STATUS TOAST */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* IF NOT AUTHENTICATED: CALL TO ACTION */}
      {!user ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-3xl mx-auto flex items-center justify-center">
            <HardDrive className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Connect Your Google Drive
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Link your Google Drive account with your permission to securely store, back up, and access your
            pantry lists, healthy recipes, and doctor-prescribed medication rules from any device.
          </p>

          <div className="pt-2">
            <button
              disabled={isSigningIn}
              onClick={handleSignIn}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition inline-flex items-center gap-2.5"
            >
              <HardDrive className="w-4 h-4" />
              <span>{isSigningIn ? 'Connecting...' : 'Connect Google Drive Account'}</span>
            </button>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block font-black text-slate-800 mb-1">☁️ Automated Backups</strong>
              <span>One-click cloud backups so you never lose your grocery inventory or medical rules.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block font-black text-slate-800 mb-1">📄 Export Recipes</strong>
              <span>Save custom zero-waste recipes directly into Google Docs format.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block font-black text-slate-800 mb-1">🔒 Private &amp; Secure</strong>
              <span>Files stay exclusively in your private Google Drive under your control.</span>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED WORKSPACE */
        <div className="space-y-6">
          {/* QUICK CLOUD ACTIONS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Action 1: Backup App Data */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Backup Pantry &amp; Health Data
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Export all {foodItems.length} active food items, {medications.length} medications, and
                  custom recipes to a timestamped backup in your Drive.
                </p>
              </div>

              <button
                disabled={isBackingUp}
                onClick={handleBackupAppData}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {isBackingUp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>{isBackingUp ? 'Uploading Backup...' : 'Create Cloud Backup'}</span>
              </button>
            </div>

            {/* Action 2: Save Medication Schedule */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Save Medication Schedule
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Export doctor instructions, dose timings, and food rules as a clean printable document
                  for family or care team.
                </p>
              </div>

              <button
                disabled={isExportingMeds}
                onClick={handleSaveMedsToDrive}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                {isExportingMeds ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>{isExportingMeds ? 'Generating Doc...' : 'Export Med Schedule'}</span>
              </button>
            </div>

            {/* Action 3: Upload Custom Note / Receipt */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Upload Notes or Receipts
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Write or paste grocery receipts, doctor recommendations, or custom nutrition notes to
                  your Drive folder.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Upload Custom Document</span>
              </button>
            </div>
          </div>

          {/* GOOGLE DRIVE FILE BROWSER */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-5">
            {/* Browser Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Google Drive Files ({files.length})</span>
                </h2>

                <button
                  onClick={() => {
                    if (accessToken) fetchDriveFiles(accessToken, folderFilter, searchQuery);
                  }}
                  disabled={isLoadingFiles}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Refresh Files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Search & Folder Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Folder filter */}
                <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
                  <button
                    onClick={() => setFolderFilter('app_folder')}
                    className={`px-3 py-1 rounded-lg transition ${
                      folderFilter === 'app_folder'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📁 FreshKeep Folder
                  </button>
                  <button
                    onClick={() => setFolderFilter('all')}
                    className={`px-3 py-1 rounded-lg transition ${
                      folderFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌐 All Drive Files
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && accessToken) {
                        fetchDriveFiles(accessToken, folderFilter, searchQuery);
                      }
                    }}
                    placeholder="Search file name..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* File List */}
            {isLoadingFiles ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs">Loading files from Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No files found in this folder.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Create Cloud Backup&quot; above to upload your first backup to Google Drive!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {files.map((file) => {
                  const isBackupJson = file.name.endsWith('.json') && file.name.includes('Backup');
                  const isDocOrMarkdown = file.name.endsWith('.md') || file.name.endsWith('.txt');

                  return (
                    <div
                      key={file.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-2xl transition"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                          {isBackupJson ? (
                            <FileJson className="w-5 h-5 text-emerald-600" />
                          ) : isDocOrMarkdown ? (
                            <FileText className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {file.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-600">
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                            <span>• Modified: {formatDate(file.modifiedTime)}</span>
                            {isBackupJson && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                                Backup
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        {/* Open in Google Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Open Drive</span>
                          </a>
                        )}

                        {/* Preview / Read content */}
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                          title="Preview Text Content"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Restore if backup file */}
                        {isBackupJson && onRestoreData && (
                          <button
                            onClick={() => handleRestoreFile(file)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-emerald-200"
                            title="Restore Pantry and Medications from this Backup"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}

                        {/* Delete with explicit confirmation dialog (MANDATORY DESTRUCTIVE REQUIREMENT) */}
                        <button
                          onClick={() => setDeleteCandidate(file)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete File from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR FILE DELETION (DESTRUCTIVE MUTATION RULE) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-rose-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Google Drive File?</h3>
                <p className="text-xs text-slate-600">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block truncate">
                File: {deleteCandidate.name}
              </span>
              <span className="text-[11px] text-slate-600 block">
                Size: {formatFileSize(deleteCandidate.size)} • Modified: {formatDate(deleteCandidate.modifiedTime)}
              </span>
              <p className="text-rose-700 text-[11px] pt-1 border-t border-slate-200">
                Are you sure you want to permanently remove this file from your Google Drive?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="font-black text-slate-900 text-base truncate">{previewContent.name}</h3>
              </div>
              <button
                onClick={() => setPreviewContent(null)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap">
              {previewContent.text}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewContent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD CUSTOM FILE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomFile}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Upload Document to Drive</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title / File Name</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Grocery_Receipt_Oct3 or Diet_Notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content / Notes</label>
                <textarea
                  required
                  rows={5}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Write or paste recipe instructions, receipt items, or doctor recommendations here..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>{isUploading ? 'Uploading...' : 'Save to Google Drive'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
