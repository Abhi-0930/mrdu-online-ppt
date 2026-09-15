'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Batch,
  BatchMember,
  PresentationStatus,
  SessionLog,
  AppSettings,
  DashboardStats,
  EvaluationScore,
  calculateGrade,
} from '@/types/batch';
import { ApiService } from '@/services/apiService';
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
import { ALL_INITIAL_BATCHES } from '@/services/sampleData';
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
  isRePresentModalOpen: boolean;
  setIsRePresentModalOpen: (open: boolean) => void;
  rePresentTargetBatch: Batch | null;
  setRePresentTargetBatch: (batch: Batch | null) => void;
  openRePresentModal: (batch: Batch) => void;
  confirmBatchRePresent: (
    batchId: string,
    data: { rePresentTopic: string; members: BatchMember[]; trainerNotes?: string }
  ) => Promise<void>;

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
  const [isRePresentModalOpen, setIsRePresentModalOpen] = useState<boolean>(false);
  const [rePresentTargetBatch, setRePresentTargetBatch] = useState<Batch | null>(null);

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

  // Initial Data Fetch from MongoDB Atlas (with local IndexedDB fallback)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      let loadedBatches: Batch[] = [];
      let loadedLogs: SessionLog[] = [];
      let loadedSettings: AppSettings = settings;
      let latestSchedule: any = null;

      try {
        // Fetch from MongoDB backend API
        loadedBatches = await ApiService.getAllBatches();
        loadedLogs = await ApiService.getAllSessionLogs();
        loadedSettings = await ApiService.getSettings();
        latestSchedule = await ApiService.getSchedule(selectedSection);

        // Cache loaded data into IndexedDB for offline support
        if (loadedBatches && loadedBatches.length > 0) {
          dbClearAllBatches().then(() => dbSaveBatchesBulk(loadedBatches)).catch(() => {});
        }
        if (loadedLogs) {
          dbClearAllSessionLogs().then(() => loadedLogs.forEach((l) => dbSaveSessionLog(l))).catch(() => {});
        }
        if (loadedSettings) {
          dbSaveSettings(loadedSettings).catch(() => {});
        }
      } catch (apiErr) {
        console.warn('MongoDB API unreachable, falling back to local IndexedDB:', apiErr);
        // Fallback to IndexedDB
        loadedBatches = await dbGetAllBatches().catch(() => []);
        loadedLogs = await dbGetAllSessionLogs().catch(() => []);
        loadedSettings = await dbGetSettings().catch(() => settings);
        latestSchedule = await dbGetLatestSchedule().catch(() => undefined);
      }

      setAllBatches(loadedBatches && loadedBatches.length > 0 ? loadedBatches : ALL_INITIAL_BATCHES);
      setAllSessionLogs(loadedLogs);
      setSettings(loadedSettings);

      if (latestSchedule) {
        setTodayQueueIds(latestSchedule.batchIds || []);
        setTodayQueueIndex(latestSchedule.currentIndex || 0);
      }
    } catch (err) {
      console.error('Error in refreshData:', err);
      setAllBatches(ALL_INITIAL_BATCHES);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSection]);

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

  // Batch CRUD Operations (MongoDB Atlas Sync + Local State)
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

    // Instant local state update
    setAllBatches((prev) => [...prev, newBatch]);
    dbSaveBatch(newBatch).catch(() => {});

    // Save in MongoDB
    try {
      await ApiService.createBatch(newBatch);
    } catch (err) {
      console.error('Failed to create batch in MongoDB:', err);
    }

    if (settings.soundEffects) AudioEffects.playSuccessChime();
    return id;
  };

  const updateBatch = async (updated: Batch) => {
    const batchWithTime: Batch = {
      ...updated,
      section: updated.section || selectedSection,
      updatedDate: new Date().toISOString(),
    };

    setAllBatches((prev) => prev.map((b) => (b.id === batchWithTime.id ? batchWithTime : b)));
    if (selectedBatch?.id === batchWithTime.id) {
      setSelectedBatch(batchWithTime);
    }
    dbSaveBatch(batchWithTime).catch(() => {});

    // Save in MongoDB
    try {
      await ApiService.updateBatch(batchWithTime);
    } catch (err) {
      console.error('Failed to update batch in MongoDB:', err);
    }
  };

  const deleteBatch = async (id: string) => {
    setAllBatches((prev) => prev.filter((b) => b.id !== id));
    setTodayQueueIds((prev) => prev.filter((queueId) => queueId !== id));
    if (selectedBatch?.id === id) {
      setSelectedBatch(null);
    }
    dbDeleteBatch(id).catch(() => {});

    // Delete in MongoDB
    try {
      await ApiService.deleteBatch(id);
    } catch (err) {
      console.error('Failed to delete batch in MongoDB:', err);
    }
  };

  const bulkImportBatches = async (newBatches: Batch[], replaceExisting: boolean) => {
    const taggedBatches = newBatches.map((b) => ({
      ...b,
      section: b.section || selectedSection,
    }));

    let combined: Batch[] = [];
    if (replaceExisting) {
      const otherBatches = allBatches.filter((b) => (b.section || 'AIML-E') !== selectedSection);
      combined = [...otherBatches, ...taggedBatches];
    } else {
      const existingMap = new Map(allBatches.map((b) => [b.id, b]));
      taggedBatches.forEach((b) => {
        existingMap.set(b.id, b);
      });
      combined = Array.from(existingMap.values());
    }

    setAllBatches(combined);
    dbSaveBatchesBulk(combined).catch(() => {});

    // Save in MongoDB
    try {
      await ApiService.bulkImportBatches(taggedBatches, replaceExisting, selectedSection);
    } catch (err) {
      console.error('Failed to bulk import batches in MongoDB:', err);
    }

    if (settings.soundEffects) AudioEffects.playSuccessChime();
  };

  const openRePresentModal = (batch: Batch) => {
    setRePresentTargetBatch(batch);
    setIsRePresentModalOpen(true);
  };

  const confirmBatchRePresent = async (
    batchId: string,
    data: {
      rePresentTopic: string;
      members: BatchMember[];
      trainerNotes?: string;
    }
  ) => {
    const target = allBatches.find((b) => b.id === batchId);
    if (!target) return;

    const now = new Date().toISOString();
    const notes = data.trainerNotes !== undefined ? data.trainerNotes : target.trainerNotes;
    const updatedHistory = [
      ...(target.history || []),
      {
        status: 'Re-Present' as PresentationStatus,
        timestamp: now,
        notes: `Re-presentation scheduled. Seminar Topic: ${data.rePresentTopic}. ${notes || ''}`.trim(),
      },
    ];

    const updatedBatch: Batch = {
      ...target,
      status: 'Re-Present',
      rePresentTopic: data.rePresentTopic,
      rePresentDate: now,
      members: data.members,
      trainerNotes: notes,
      history: updatedHistory,
      updatedDate: now,
    };

    setAllBatches((prev) => prev.map((b) => (b.id === batchId ? updatedBatch : b)));
    if (selectedBatch?.id === batchId) setSelectedBatch(updatedBatch);
    dbSaveBatch(updatedBatch).catch(() => {});

    const presentCount = updatedBatch.members.filter((m) => m.present).length;
    const sessionLog: SessionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchId: target.id,
      batchNumber: target.batchNumber,
      section: target.section || selectedSection,
      topic: target.topic,
      status: 'Re-Present',
      score: updatedBatch.evaluation?.totalScore,
      grade: updatedBatch.evaluation?.grade,
      presentCount,
      totalMembers: updatedBatch.members.length,
      timestamp: now,
      trainerNotes: `Seminar Topic: ${data.rePresentTopic}. ${notes || ''}`.trim(),
    };

    setAllSessionLogs((prev) => [sessionLog, ...prev]);
    dbSaveSessionLog(sessionLog).catch(() => {});

    try {
      await Promise.all([
        ApiService.updateBatch(updatedBatch),
        ApiService.createSessionLog(sessionLog),
      ]);
    } catch (err) {
      console.error('Failed to save Re-Present status & log in MongoDB:', err);
    }

    if (settings.soundEffects) AudioEffects.playSuccessChime();
  };

  const setBatchStatus = async (id: string, status: PresentationStatus, notes?: string) => {
    const target = allBatches.find((b) => b.id === id);
    if (!target) return;

    // If setting to Re-Present, trigger the Seminar Topic & Member Satisfaction modal
    if (status === 'Re-Present') {
      openRePresentModal(target);
      return;
    }

    const now = new Date().toISOString();
    const updatedHistory = [...(target.history || []), { status, timestamp: now, notes: notes || target.trainerNotes }];

    const updatedBatch: Batch = {
      ...target,
      status,
      trainerNotes: notes !== undefined ? notes : target.trainerNotes,
      history: updatedHistory,
      updatedDate: now,
    };

    setAllBatches((prev) => prev.map((b) => (b.id === id ? updatedBatch : b)));
    if (selectedBatch?.id === id) setSelectedBatch(updatedBatch);
    dbSaveBatch(updatedBatch).catch(() => {});

    // Create session log
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

    setAllSessionLogs((prev) => [sessionLog, ...prev]);
    dbSaveSessionLog(sessionLog).catch(() => {});

    // Save in MongoDB
    try {
      await Promise.all([
        ApiService.updateBatch(updatedBatch),
        ApiService.createSessionLog(sessionLog),
      ]);
    } catch (err) {
      console.error('Failed to save status & log in MongoDB:', err);
    }

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

    setAllBatches((prev) => prev.map((b) => (b.id === id ? updatedBatch : b)));
    setSelectedBatch(updatedBatch);
    dbSaveBatch(updatedBatch).catch(() => {});

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

    setAllSessionLogs((prev) => [log, ...prev]);
    dbSaveSessionLog(log).catch(() => {});

    // Save in MongoDB
    try {
      await Promise.all([
        ApiService.updateBatch(updatedBatch),
        ApiService.createSessionLog(log),
      ]);
    } catch (err) {
      console.error('Failed to save evaluation & log in MongoDB:', err);
    }

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

    setAllBatches(updatedAll);
    if (selectedBatch && (selectedBatch.section || 'AIML-E') === selectedSection) {
      const updated = updatedAll.find((b) => b.id === selectedBatch.id);
      setSelectedBatch(updated || null);
    }
    dbSaveBatchesBulk(updatedAll).catch(() => {});

    // Reset in MongoDB
    try {
      await ApiService.resetAllStatuses(selectedSection);
    } catch (err) {
      console.error('Failed to reset statuses in MongoDB:', err);
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
    setSettings(merged);
    dbSaveSettings(merged).catch(() => {});

    try {
      await ApiService.updateSettings(merged);
    } catch (err) {
      console.error('Failed to update settings in MongoDB:', err);
    }
  };

  const loadSampleData = async () => {
    setAllBatches(ALL_INITIAL_BATCHES);
    setSelectedBatch(null);
    dbClearAllBatches().then(() => dbSaveBatchesBulk(ALL_INITIAL_BATCHES)).catch(() => {});

    try {
      await ApiService.reseedDatabase();
    } catch (err) {
      console.error('Failed to reseed database in MongoDB:', err);
    }

    if (settings.soundEffects) AudioEffects.playSuccessChime();
  };

  const clearAllData = async () => {
    setAllBatches([]);
    setAllSessionLogs([]);
    setSelectedBatch(null);
    setTodayQueueIds([]);
    setTodayQueueIndex(0);

    dbClearAllBatches().catch(() => {});
    dbClearAllSessionLogs().catch(() => {});

    try {
      await Promise.all([
        ApiService.clearAllBatches(),
        ApiService.clearAllSessionLogs(),
      ]);
    } catch (err) {
      console.error('Failed to clear data in MongoDB:', err);
    }
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
      section: selectedSection,
      generatedDate: new Date().toISOString(),
      batchIds: ids,
      currentIndex: 0,
    };

    setTodayQueueIds(ids);
    setTodayQueueIndex(0);
    dbSaveSchedule(scheduleData).catch(() => {});

    try {
      await ApiService.saveSchedule(scheduleData);
    } catch (err) {
      console.error('Failed to save schedule in MongoDB:', err);
    }
  };

  const advanceScheduleQueue = (direction: 'next' | 'prev') => {
    let newIndex = todayQueueIndex;
    if (direction === 'next' && todayQueueIndex < todayQueueIds.length - 1) {
      newIndex = todayQueueIndex + 1;
    } else if (direction === 'prev' && todayQueueIndex > 0) {
      newIndex = todayQueueIndex - 1;
    }

    setTodayQueueIndex(newIndex);
    const scheduleData = {
      section: selectedSection,
      batchIds: todayQueueIds,
      currentIndex: newIndex,
    };
    ApiService.saveSchedule(scheduleData).catch(() => {});
  };

  const reorderScheduleQueue = async (newQueue: Batch[]) => {
    const ids = newQueue.map((b) => b.id);
    setTodayQueueIds(ids);
    const scheduleData = {
      section: selectedSection,
      batchIds: ids,
      currentIndex: todayQueueIndex,
    };

    try {
      await ApiService.saveSchedule(scheduleData);
    } catch (err) {
      console.error('Failed to save schedule in MongoDB:', err);
    }
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
        isRePresentModalOpen,
        setIsRePresentModalOpen,
        rePresentTargetBatch,
        setRePresentTargetBatch,
        openRePresentModal,
        confirmBatchRePresent,
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
