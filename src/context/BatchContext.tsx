'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Batch,
  PresentationStatus,
  SessionLog,
  AppSettings,
  DashboardStats,
  EvaluationScore,
  calculateGrade,
} from '@/types/batch';
import {
  dbGetAllBatches,
  dbSaveBatch,
  dbSaveBatchesBulk,
  dbDeleteBatch,
  dbClearAllBatches,
  dbGetAllSessionLogs,
  dbSaveSessionLog,
  dbClearAllSessionLogs,
  dbGetSettings,
  dbSaveSettings,
  dbGetLatestSchedule,
  dbSaveSchedule,
} from '@/services/indexedDB';
import { ALL_INITIAL_BATCHES, SAMPLE_BATCHES_AIML_A, SAMPLE_BATCHES_AIML_E } from '@/services/sampleData';
import { AudioEffects } from '@/services/audioService';

export type NavigationTab =
  | 'dashboard'
  | 'batches'
  | 'picker'
  | 'spinner'
  | 'presentation'
  | 'schedule'
  | 'analytics'
  | 'history'
  | 'settings';

export type ClassroomSection = 'AIML-E' | 'AIML-A';

interface BatchContextType {
  selectedSection: ClassroomSection;
  setSelectedSection: (section: ClassroomSection) => void;
  batches: Batch[];
  allBatches: Batch[];
  filteredBatches: Batch[];
  isLoading: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedBatch: Batch | null;
  setSelectedBatch: (batch: Batch | null) => void;
  filterStatus: PresentationStatus | 'All';
  setFilterStatus: (status: PresentationStatus | 'All') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'batchNumber' | 'status' | 'score' | 'recent';
  setSortBy: (sort: 'batchNumber' | 'status' | 'score' | 'recent') => void;
  stats: DashboardStats;
  sessionLogs: SessionLog[];
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  // Modals
  isBatchModalOpen: boolean;
  setIsBatchModalOpen: (open: boolean) => void;
  editingBatch: Batch | null;
  setEditingBatch: (batch: Batch | null) => void;
  isExcelModalOpen: boolean;
  setIsExcelModalOpen: (open: boolean) => void;

  // Actions
  addBatch: (batch: Omit<Batch, 'id' | 'createdDate' | 'updatedDate'>) => Promise<string>;
  updateBatch: (batch: Batch) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  bulkImportBatches: (newBatches: Batch[], replaceExisting: boolean) => Promise<void>;
  setBatchStatus: (id: string, status: PresentationStatus, notes?: string) => Promise<void>;
  saveBatchEvaluation: (
    id: string,
    evaluation: Omit<EvaluationScore, 'totalScore' | 'percentage' | 'grade'>,
    trainerNotes: string,
    memberAttendance: { id: string; rollNo: string; present: boolean; remarks?: string }[]
  ) => Promise<void>;
  resetAllStatuses: () => Promise<void>;
  pickRandomPendingBatch: (options?: { includeRePresent?: boolean }) => Batch | null;
  startPresentationWithBatch: (batch: Batch) => void;
  loadSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Schedule
  todayQueue: Batch[];
  todayQueueIndex: number;
  generateTodayQueue: (countOrRange: { type: 'count' | 'range'; count?: number; start?: number; end?: number }) => Promise<void>;
  advanceScheduleQueue: (direction: 'next' | 'prev') => void;
  reorderScheduleQueue: (newQueue: Batch[]) => Promise<void>;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [allBatches, setAllBatches] = useState<Batch[]>(ALL_INITIAL_BATCHES);
  const [allSessionLogs, setAllSessionLogs] = useState<SessionLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    facultyName: 'Faculty Member',
    subjectName: 'AI & Machine Learning Lab',
    academicYear: '2026-2027',
    soundEffects: true,
    confettiEnabled: true,
    rubricMaxScore: 10,
    customSnippets: [],
  });

  const [selectedSection, setSelectedSection] = useState<ClassroomSection>('AIML-E');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<NavigationTab>('dashboard');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [filterStatus, setFilterStatus] = useState<PresentationStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'batchNumber' | 'status' | 'score' | 'recent'>('batchNumber');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  // Synchronized activeTab setter that updates URL hash
  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'dashboard') {
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        window.location.hash = tab;
      }
    }
  }, []);

  // Listen to browser hash changes & initialize activeTab from URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashSync = () => {
        const hash = window.location.hash.replace('#', '') as NavigationTab;
        const validTabs: NavigationTab[] = [
          'dashboard',
          'batches',
          'picker',
          'spinner',
          'presentation',
          'schedule',
          'analytics',
          'history',
        ];
        if (hash && validTabs.includes(hash)) {
          setActiveTabState(hash);
        } else if (!hash) {
          setActiveTabState('dashboard');
        }
      };

      handleHashSync();
      window.addEventListener('hashchange', handleHashSync);
      return () => window.removeEventListener('hashchange', handleHashSync);
    }
  }, []);

  // Filter batches by currently selected section
  const batches = useMemo(() => {
    return allBatches.filter((b) => (b.section || 'AIML-E') === selectedSection);
  }, [allBatches, selectedSection]);

  // Filter session logs by currently selected section
  const sessionLogs = useMemo(() => {
    return allSessionLogs.filter((log) => !log.section || log.section === selectedSection);
  }, [allSessionLogs, selectedSection]);

  // Ensure selected batch matches active section
  useEffect(() => {
    if (selectedBatch && (selectedBatch.section || 'AIML-E') !== selectedSection) {
      setSelectedBatch(null);
    }
  }, [selectedSection, selectedBatch]);

  // Today's schedule queue
  const [todayQueueIds, setTodayQueueIds] = useState<string[]>([]);
  const [todayQueueIndex, setTodayQueueIndex] = useState<number>(0);

  // Initial Data Fetch from IndexedDB
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      let loadedBatches: Batch[] = [];
      try {
        loadedBatches = await dbGetAllBatches();
      } catch (e) {
        console.warn('Could not read IndexedDB batches:', e);
      }

      // If IndexedDB has no batches, or contains legacy mock titles, seed with real 58 batches (29 E + 29 A)
      if (
        !loadedBatches ||
        loadedBatches.length === 0 ||
        loadedBatches.some((b) => b.topic.includes('Brain Tumor') || b.topic.includes('Autonomous Drone'))
      ) {
        try {
          await dbClearAllBatches();
          await dbSaveBatchesBulk(ALL_INITIAL_BATCHES);
          loadedBatches = await dbGetAllBatches();
        } catch {
          loadedBatches = ALL_INITIAL_BATCHES;
        }
      } else {
        // If Section A batches are missing, append them
        const hasSectionA = loadedBatches.some((b) => b.section === 'AIML-A');
        if (!hasSectionA) {
          try {
            const combined = [...loadedBatches, ...SAMPLE_BATCHES_AIML_A];
            await dbSaveBatchesBulk(combined);
            loadedBatches = await dbGetAllBatches();
          } catch {
            loadedBatches = [...loadedBatches, ...SAMPLE_BATCHES_AIML_A];
          }
        }
      }

      const loadedLogs = await dbGetAllSessionLogs().catch(() => []);
      const loadedSettings = await dbGetSettings().catch(() => ({
        facultyName: 'Faculty Member',
        subjectName: 'AI & Machine Learning Lab',
        academicYear: '2026-2027',
        soundEffects: true,
        confettiEnabled: true,
        rubricMaxScore: 10,
        customSnippets: [],
      }));
      const latestSchedule = await dbGetLatestSchedule().catch(() => undefined);

      setAllBatches(loadedBatches && loadedBatches.length > 0 ? loadedBatches : ALL_INITIAL_BATCHES);
      setAllSessionLogs(loadedLogs);
      setSettings(loadedSettings);

      if (latestSchedule) {
        setTodayQueueIds(latestSchedule.batchIds);
        setTodayQueueIndex(latestSchedule.currentIndex);
      }
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
      setAllBatches(ALL_INITIAL_BATCHES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filtered and Sorted Batches for Active Section
  const filteredBatches = useMemo(() => {
    let result = [...batches];

    // Status filter
    if (filterStatus !== 'All') {
      result = result.filter((b) => b.status === filterStatus);
    }

    // Search query filter (matches batchNumber, topic, student roll numbers, student names, trainer notes, status)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const batchNumStr = String(b.batchNumber).toLowerCase();
        const matchBatch =
          batchNumStr === q ||
          batchNumStr.includes(q) ||
          `batch ${batchNumStr}`.includes(q) ||
          `b${batchNumStr}`.includes(q);
        const matchTopic = b.topic.toLowerCase().includes(q);
        const matchStatus = b.status.toLowerCase().includes(q);
        const matchNotes = (b.trainerNotes || '').toLowerCase().includes(q);
        const matchMembers = b.members.some(
          (m) =>
            m.rollNo.toLowerCase().includes(q) ||
            (m.name && m.name.toLowerCase().includes(q))
        );
        return matchBatch || matchTopic || matchStatus || matchNotes || matchMembers;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'batchNumber') {
        const numA = Number(a.batchNumber);
        const numB = Number(b.batchNumber);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.batchNumber).localeCompare(String(b.batchNumber), undefined, { numeric: true });
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      if (sortBy === 'score') {
        const scoreA = a.evaluation?.totalScore ?? -1;
        const scoreB = b.evaluation?.totalScore ?? -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'recent') {
        return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
      }
      return 0;
    });

    return result;
  }, [batches, filterStatus, searchQuery, sortBy]);

  // Compute Dashboard Statistics for Active Section
  const stats = useMemo<DashboardStats>(() => {
    const total = batches.length;
    let completed = 0;
    let pending = 0;
    let absent = 0;
    let rejected = 0;
    let rePresent = 0;
    let totalScoreSum = 0;
    let evaluatedCount = 0;
    let totalStudents = 0;
    let presentStudents = 0;

    let bestTeam: { batchNumber: string | number; topic: string; score: number } | undefined;
    let lowestTeam: { batchNumber: string | number; topic: string; score: number } | undefined;

    batches.forEach((b) => {
      totalStudents += b.members.length;
      presentStudents += b.members.filter((m) => m.present).length;

      if (b.status === 'Presented') completed++;
      else if (b.status === 'Pending') pending++;
      else if (b.status === 'Absent') absent++;
      else if (b.status === 'Rejected') rejected++;
      else if (b.status === 'Re-Present') rePresent++;

      if (b.evaluation && typeof b.evaluation.totalScore === 'number') {
        totalScoreSum += b.evaluation.totalScore;
        evaluatedCount++;

        if (!bestTeam || b.evaluation.totalScore > bestTeam.score) {
          bestTeam = { batchNumber: b.batchNumber, topic: b.topic, score: b.evaluation.totalScore };
        }
        if (!lowestTeam || b.evaluation.totalScore < lowestTeam.score) {
          lowestTeam = { batchNumber: b.batchNumber, topic: b.topic, score: b.evaluation.totalScore };
        }
      }
    });

    const averageScore = evaluatedCount > 0 ? Number((totalScoreSum / evaluatedCount).toFixed(1)) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalBatches: total,
      completedBatches: completed,
      pendingBatches: pending,
      absentBatches: absent,
      rejectedBatches: rejected,
      rePresentBatches: rePresent,
      averageScore,
      completionRate,
      totalStudents,
      presentStudents,
      bestTeam,
      lowestTeam,
    };
  }, [batches]);

  // Today's Queue Batches for Active Section
  const todayQueue = useMemo(() => {
    return todayQueueIds
      .map((id) => allBatches.find((b) => b.id === id))
      .filter((b): b is Batch => Boolean(b && (b.section || 'AIML-E') === selectedSection));
  }, [todayQueueIds, allBatches, selectedSection]);

  // Batch CRUD Operations
  const addBatch = async (batchData: Omit<Batch, 'id' | 'createdDate' | 'updatedDate'>): Promise<string> => {
    const id = `batch-${selectedSection.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newBatch: Batch = {
      ...batchData,
      section: batchData.section || selectedSection,
      id,
      createdDate: now,
      updatedDate: now,
    };

    await dbSaveBatch(newBatch);
    setAllBatches((prev) => [...prev, newBatch]);
    if (settings.soundEffects) AudioEffects.playSuccessChime();
    return id;
  };

  const updateBatch = async (updated: Batch) => {
    const batchWithTime: Batch = {
      ...updated,
      section: updated.section || selectedSection,
      updatedDate: new Date().toISOString(),
    };

    await dbSaveBatch(batchWithTime);
    setAllBatches((prev) => prev.map((b) => (b.id === batchWithTime.id ? batchWithTime : b)));
    if (selectedBatch?.id === batchWithTime.id) {
      setSelectedBatch(batchWithTime);
    }
  };

  const deleteBatch = async (id: string) => {
    await dbDeleteBatch(id);
    setAllBatches((prev) => prev.filter((b) => b.id !== id));
    setTodayQueueIds((prev) => prev.filter((queueId) => queueId !== id));
    if (selectedBatch?.id === id) {
      setSelectedBatch(null);
    }
  };

  const bulkImportBatches = async (newBatches: Batch[], replaceExisting: boolean) => {
    const taggedBatches = newBatches.map((b) => ({
      ...b,
      section: b.section || selectedSection,
    }));

    if (replaceExisting) {
      const otherBatches = allBatches.filter((b) => (b.section || 'AIML-E') !== selectedSection);
      const combined = [...otherBatches, ...taggedBatches];
      await dbClearAllBatches();
      await dbSaveBatchesBulk(combined);
      setAllBatches(combined);
    } else {
      const existingMap = new Map(allBatches.map((b) => [b.id, b]));
      taggedBatches.forEach((b) => {
        existingMap.set(b.id, b);
      });
      const combined = Array.from(existingMap.values());
      await dbSaveBatchesBulk(combined);
      setAllBatches(combined);
    }
    if (settings.soundEffects) AudioEffects.playSuccessChime();
  };

  const setBatchStatus = async (id: string, status: PresentationStatus, notes?: string) => {
    const target = allBatches.find((b) => b.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedHistory = [...(target.history || []), { status, timestamp: now, notes: notes || target.trainerNotes }];

    const updatedBatch: Batch = {
      ...target,
      status,
      trainerNotes: notes !== undefined ? notes : target.trainerNotes,
      history: updatedHistory,
      updatedDate: now,
    };

    await dbSaveBatch(updatedBatch);
    setAllBatches((prev) => prev.map((b) => (b.id === id ? updatedBatch : b)));
    if (selectedBatch?.id === id) setSelectedBatch(updatedBatch);

    // Save session log
    const presentCount = updatedBatch.members.filter((m) => m.present).length;
    const sessionLog: SessionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchId: target.id,
      batchNumber: target.batchNumber,
      section: target.section || selectedSection,
      topic: target.topic,
      status,
      score: updatedBatch.evaluation?.totalScore,
      grade: updatedBatch.evaluation?.grade,
      presentCount,
      totalMembers: updatedBatch.members.length,
      timestamp: now,
      trainerNotes: updatedBatch.trainerNotes,
    };
    await dbSaveSessionLog(sessionLog);
    setAllSessionLogs((prev) => [sessionLog, ...prev]);

    if (settings.soundEffects) {
      if (status === 'Presented') AudioEffects.playWinnerFanfare();
      else AudioEffects.playSuccessChime();
    }
  };

  const saveBatchEvaluation = async (
    id: string,
    evaluation: Omit<EvaluationScore, 'totalScore' | 'percentage' | 'grade'>,
    trainerNotes: string,
    memberAttendance: { id: string; rollNo: string; present: boolean; remarks?: string }[]
  ) => {
    const target = allBatches.find((b) => b.id === id);
    if (!target) return;

    const totalScore =
      evaluation.communication +
      evaluation.confidence +
      evaluation.contentQuality +
      evaluation.technicalUnderstanding +
      evaluation.teamCoordination;
    const percentage = (totalScore / 50) * 100;
    const grade = calculateGrade(percentage);

    const fullEvaluation: EvaluationScore = {
      ...evaluation,
      totalScore,
      percentage,
      grade,
      evaluatedAt: new Date().toISOString(),
    };

    const updatedMembers = target.members.map((m) => {
      const match = memberAttendance.find((att) => att.id === m.id || att.rollNo === m.rollNo);
      return match ? { ...m, present: match.present, individualRemarks: match.remarks } : m;
    });

    const now = new Date().toISOString();
    const updatedBatch: Batch = {
      ...target,
      status: 'Presented',
      evaluation: fullEvaluation,
      trainerNotes,
      members: updatedMembers,
      history: [...(target.history || []), { status: 'Presented', timestamp: now, notes: trainerNotes }],
      updatedDate: now,
    };

    await dbSaveBatch(updatedBatch);
    setAllBatches((prev) => prev.map((b) => (b.id === id ? updatedBatch : b)));
    setSelectedBatch(updatedBatch);

    const presentCount = updatedMembers.filter((m) => m.present).length;
    const log: SessionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchId: target.id,
      batchNumber: target.batchNumber,
      section: target.section || selectedSection,
      topic: target.topic,
      status: 'Presented',
      score: totalScore,
      grade,
      presentCount,
      totalMembers: updatedMembers.length,
      timestamp: now,
      trainerNotes,
    };

    await dbSaveSessionLog(log);
    setAllSessionLogs((prev) => [log, ...prev]);

    if (settings.soundEffects) AudioEffects.playWinnerFanfare();
  };

  const resetAllStatuses = async () => {
    const now = new Date().toISOString();
    const updatedAll = allBatches.map((b) => {
      if ((b.section || 'AIML-E') === selectedSection) {
        return {
          ...b,
          status: 'Pending' as PresentationStatus,
          evaluation: undefined,
          trainerNotes: '',
          history: [],
          updatedDate: now,
          members: b.members.map((m) => ({ ...m, present: true })),
        };
      }
      return b;
    });

    await dbSaveBatchesBulk(updatedAll);
    setAllBatches(updatedAll);
    if (selectedBatch && (selectedBatch.section || 'AIML-E') === selectedSection) {
      const updated = updatedAll.find((b) => b.id === selectedBatch.id);
      setSelectedBatch(updated || null);
    }
  };

  const pickRandomPendingBatch = (options?: { includeRePresent?: boolean }): Batch | null => {
    const candidates = batches.filter((b) => {
      if (b.status === 'Pending') return true;
      if (options?.includeRePresent && b.status === 'Re-Present') return true;
      return false;
    });

    if (candidates.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  };

  const startPresentationWithBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setActiveTab('presentation');
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    await dbSaveSettings(merged);
    setSettings(merged);
  };

  const loadSampleData = async () => {
    await dbClearAllBatches();
    await dbSaveBatchesBulk(ALL_INITIAL_BATCHES);
    setAllBatches(ALL_INITIAL_BATCHES);
    setSelectedBatch(null);
    if (settings.soundEffects) AudioEffects.playSuccessChime();
  };

  const clearAllData = async () => {
    await dbClearAllBatches();
    await dbClearAllSessionLogs();
    setAllBatches([]);
    setAllSessionLogs([]);
    setSelectedBatch(null);
    setTodayQueueIds([]);
    setTodayQueueIndex(0);
  };

  const generateTodayQueue = async (config: {
    type: 'count' | 'range';
    count?: number;
    start?: number;
    end?: number;
  }) => {
    const pendingBatches = batches.filter((b) => b.status === 'Pending' || b.status === 'Re-Present');
    let selectedQueue: Batch[] = [];

    if (config.type === 'count' && config.count) {
      selectedQueue = pendingBatches.slice(0, config.count);
    } else if (config.type === 'range' && config.start !== undefined && config.end !== undefined) {
      selectedQueue = batches.filter((b) => {
        const num = Number(b.batchNumber);
        return !isNaN(num) && num >= config.start! && num <= config.end!;
      });
    }

    const ids = selectedQueue.map((b) => b.id);
    const scheduleData = {
      id: `sched-${Date.now()}`,
      generatedDate: new Date().toISOString(),
      batchIds: ids,
      currentIndex: 0,
    };

    await dbSaveSchedule(scheduleData);
    setTodayQueueIds(ids);
    setTodayQueueIndex(0);
  };

  const advanceScheduleQueue = (direction: 'next' | 'prev') => {
    if (direction === 'next' && todayQueueIndex < todayQueueIds.length - 1) {
      setTodayQueueIndex((prev) => prev + 1);
    } else if (direction === 'prev' && todayQueueIndex > 0) {
      setTodayQueueIndex((prev) => prev - 1);
    }
  };

  const reorderScheduleQueue = async (newQueue: Batch[]) => {
    const ids = newQueue.map((b) => b.id);
    setTodayQueueIds(ids);
    const scheduleData = {
      id: `sched-${Date.now()}`,
      generatedDate: new Date().toISOString(),
      batchIds: ids,
      currentIndex: todayQueueIndex,
    };
    await dbSaveSchedule(scheduleData);
  };

  return (
    <BatchContext.Provider
      value={{
        selectedSection,
        setSelectedSection,
        batches,
        allBatches,
        filteredBatches,
        isLoading,
        activeTab,
        setActiveTab,
        selectedBatch,
        setSelectedBatch,
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        stats,
        sessionLogs,
        settings,
        updateSettings,
        isBatchModalOpen,
        setIsBatchModalOpen,
        editingBatch,
        setEditingBatch,
        isExcelModalOpen,
        setIsExcelModalOpen,
        addBatch,
        updateBatch,
        deleteBatch,
        bulkImportBatches,
        setBatchStatus,
        saveBatchEvaluation,
        resetAllStatuses,
        pickRandomPendingBatch,
        startPresentationWithBatch,
        loadSampleData,
        clearAllData,
        todayQueue,
        todayQueueIndex,
        generateTodayQueue,
        advanceScheduleQueue,
        reorderScheduleQueue,
      }}
    >
      {children}
    </BatchContext.Provider>
  );
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}
