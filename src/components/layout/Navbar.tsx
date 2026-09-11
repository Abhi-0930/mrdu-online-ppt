'use client';

import React from 'react';
import { useBatch, NavigationTab } from '@/context/BatchContext';
import {
  LayoutDashboard,
  Users,
  Dices,
  Disc,
  Presentation,
  CalendarCheck,
  BarChart3,
  History,
  Settings,
  Plus,
  FileSpreadsheet,
  WifiOff,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const {
    selectedSection,
    setSelectedSection,
    activeTab,
    setActiveTab,
    batches,
    setIsBatchModalOpen,
    setEditingBatch,
    setIsExcelModalOpen,
    settings,
  } = useBatch();

  const [isSectionMenuOpen, setIsSectionMenuOpen] = React.useState<boolean>(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'batches',
      label: 'All Batches',
      icon: <Users className="w-4 h-4" />,
      badge: batches.length,
    },
    { id: 'picker', label: 'Random Picker', icon: <Dices className="w-4 h-4" /> },
    { id: 'spinner', label: 'Wheel Spinner', icon: <Disc className="w-4 h-4" /> },
    { id: 'presentation', label: 'Live Presentation', icon: <Presentation className="w-4 h-4" /> },
    { id: 'schedule', label: "Today's Schedule", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'history', label: 'History & Logs', icon: <History className="w-4 h-4" /> },
  ];

  const handleAddNewBatch = () => {
    setEditingBatch(null);
    setIsBatchModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Section Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div
              className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-lg font-bold text-slate-900 tracking-tight leading-tight cursor-pointer"
                  onClick={() => setActiveTab('dashboard')}
                >
                  Classroom Presentation Manager
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Offline PWA
                </span>
              </div>
            </div>
          </div>

          {/* Section Selector Dropdown & Quick Actions */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Section Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSectionMenuOpen(!isSectionMenuOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal transition-all border shadow-2xs cursor-pointer ${
                  selectedSection === 'AIML-E'
                    ? 'bg-blue-50 hover:bg-blue-100/80 text-blue-900 border-blue-200'
                    : 'bg-purple-50 hover:bg-purple-100/80 text-purple-900 border-purple-200'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${selectedSection === 'AIML-E' ? 'text-blue-600' : 'text-purple-600'}`} />
                <span className="font-normal text-slate-700">
                  Section: <span className="font-normal text-slate-900">{selectedSection}</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isSectionMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSectionMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSectionMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                      Select Classroom Section
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection('AIML-E');
                        setIsSectionMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedSection === 'AIML-E'
                          ? 'bg-blue-50/80 text-blue-900 border border-blue-200/60'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-normal text-slate-800">AIML - Section E</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-normal bg-blue-100 text-blue-800">
                            29 Batches
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal">Presentation Hub • 87 Students</p>
                      </div>
                      {selectedSection === 'AIML-E' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection('AIML-A');
                        setIsSectionMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors mt-1 cursor-pointer ${
                        selectedSection === 'AIML-A'
                          ? 'bg-purple-50/80 text-purple-900 border border-purple-200/60'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-normal text-slate-800">AIML - Section A</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-normal bg-purple-100 text-purple-800">
                            29 Batches
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal">Presentation Hub • 87 Students</p>
                      </div>
                      {selectedSection === 'AIML-A' && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="Excel Import & Export"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel Hub</span>
            </button>

            <button
              onClick={handleAddNewBatch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Batch</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              title="Application Settings & Backup"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
