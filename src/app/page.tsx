'use client';

import React, { useState, useEffect } from 'react';
import { BatchProvider, useBatch } from '@/context/BatchContext';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { BatchList } from '@/components/batches/BatchList';
import { QuickPicker } from '@/components/picker/QuickPicker';
import { WheelSpinner } from '@/components/picker/WheelSpinner';
import { LivePresentationRoom } from '@/components/presentation/LivePresentationRoom';
import { TodayScheduleView } from '@/components/schedule/TodayScheduleView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { SessionHistoryView } from '@/components/history/SessionHistoryView';
import { BatchModal } from '@/components/batches/BatchModal';
import { ExcelImportExportModal } from '@/components/batches/ExcelImportExportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Download, Wifi, WifiOff, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

function MainAppContent() {
  const { activeTab, isLoading } = useBatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Service Worker Registration & Online Status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Register SW
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('SW registered successfully:', reg.scope))
          .catch((err) => console.log('SW registration error:', err));
      }

      // PWA Install Prompt Handler
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Offline Status or Install Prompt Banner */}
        <div className="space-y-3 mb-4">
          {!isOnline && (
            <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <span className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" /> You are currently offline. Full features &amp; IndexedDB saving are fully operational.
              </span>
              <span className="text-[10px] bg-amber-600 px-2 py-0.5 rounded-md">Local Storage Active</span>
            </div>
          )}

          {showInstallBanner && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Install Classroom Presentation Manager on your device for one-click offline access.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallPWA}
                  className="px-3 py-1 bg-white text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-50 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" /> Install PWA
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-white/80 hover:text-white px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Spinner or Active Tab */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Loading Classroom Database from IndexedDB...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-150">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'batches' && <BatchList />}
            {activeTab === 'picker' && <QuickPicker />}
            {activeTab === 'spinner' && <WheelSpinner />}
            {activeTab === 'presentation' && <LivePresentationRoom />}
            {activeTab === 'schedule' && <TodayScheduleView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'history' && <SessionHistoryView />}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <BatchModal />
      <ExcelImportExportModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function Page() {
  return (
    <BatchProvider>
      <MainAppContent />
    </BatchProvider>
  );
}
