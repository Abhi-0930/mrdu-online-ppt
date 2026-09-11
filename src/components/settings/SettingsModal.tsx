'use client';

import React, { useState, useRef } from 'react';
import { useBatch } from '@/context/BatchContext';
import { dbExportBackupJSON, dbImportBackupJSON } from '@/services/indexedDB';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Sparkles,
  Database,
  BookOpen,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, loadSampleData, clearAllData, batches } = useBatch();

  const [subjectName, setSubjectName] = useState(settings.subjectName);
  const [facultyName, setFacultyName] = useState(settings.facultyName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [soundEffects, setSoundEffects] = useState(settings.soundEffects);
  const [confettiEnabled, setConfettiEnabled] = useState(settings.confettiEnabled);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      subjectName,
      facultyName,
      academicYear,
      soundEffects,
      confettiEnabled,
    });
    setMessage({ type: 'success', text: 'Faculty preferences saved successfully.' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await dbExportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Classroom_Presentation_Manager_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Local IndexedDB backup downloaded.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to create backup.' });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const result = await dbImportBackupJSON(jsonContent);
        if (result.success) {
          setMessage({ type: 'success', text: `Restored ${result.count} batches from backup.` });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to restore backup.' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Corrupted backup file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = async () => {
    if (confirm('Reload the 29 student batches and 87 students from students_data.json?')) {
      await loadSampleData();
      setMessage({ type: 'success', text: 'All 29 batches loaded from students_data.json.' });
    }
  };

  const handleWipeData = async () => {
    if (confirm('⚠️ DANGER: Are you sure you want to completely erase ALL batches, history, and evaluations?')) {
      await clearAllData();
      setMessage({ type: 'success', text: 'All local database records wiped.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Application Settings &amp; Backup</h3>
              <p className="text-xs text-slate-500">Configure faculty details, sound effects, and local data persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1: Subject & Faculty Profile */}
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Course &amp; Faculty Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Course Title</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty / Trainer Name</label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Audio and Animation Toggles */}
            <div className="pt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span>Audio Sound Effects (Web Audio API)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={confettiEnabled}
                  onChange={(e) => setConfettiEnabled(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Winner Confetti</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              Save Preferences
            </button>
          </form>

          {/* Section 2: IndexedDB Local Storage & Backup */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" /> Offline Local Database (IndexedDB)
            </h4>
            <p className="text-slate-500 text-[11px]">
              All data is stored directly in your browser&apos;s IndexedDB engine ({batches.length} batches currently
              cached). Create JSON backups anytime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export JSON Backup</span>
              </button>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restore from Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Reset & Sample Data Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Database Maintenance
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Reload students_data.json (29 Batches)</span>
              </button>

              <button
                type="button"
                onClick={handleWipeData}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Wipe Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
