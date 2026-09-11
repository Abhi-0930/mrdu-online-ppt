'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBatch } from '@/context/BatchContext';
import {
  Batch,
  PresentationStatus,
  STATUS_CONFIG,
  DEFAULT_FEEDBACK_SNIPPETS,
  calculateGrade,
} from '@/types/batch';
import {
  Users,
  Award,
  ExternalLink,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Save,
  Clock,
  Dices,
  FileText,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

export const LivePresentationRoom: React.FC = () => {
  const {
    selectedBatch,
    batches,
    setSelectedBatch,
    saveBatchEvaluation,
    setBatchStatus,
    pickRandomPendingBatch,
    startPresentationWithBatch,
    setActiveTab,
    settings,
  } = useBatch();

  // Rubric Scores (1-10)
  const [communication, setCommunication] = useState<number>(8);
  const [confidence, setConfidence] = useState<number>(8);
  const [contentQuality, setContentQuality] = useState<number>(8);
  const [technicalUnderstanding, setTechnicalUnderstanding] = useState<number>(8);
  const [teamCoordination, setTeamCoordination] = useState<number>(8);

  // Trainer Notes
  const [trainerNotes, setTrainerNotes] = useState<string>('');

  // Attendance states
  const [attendance, setAttendance] = useState<{ id: string; rollNo: string; present: boolean; remarks?: string }[]>(
    []
  );

  // Timer / Stopwatch
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset form when selectedBatch changes
  useEffect(() => {
    if (selectedBatch) {
      if (selectedBatch.evaluation) {
        setCommunication(selectedBatch.evaluation.communication);
        setConfidence(selectedBatch.evaluation.confidence);
        setContentQuality(selectedBatch.evaluation.contentQuality);
        setTechnicalUnderstanding(selectedBatch.evaluation.technicalUnderstanding);
        setTeamCoordination(selectedBatch.evaluation.teamCoordination);
      } else {
        // Defaults
        setCommunication(8);
        setConfidence(8);
        setContentQuality(8);
        setTechnicalUnderstanding(8);
        setTeamCoordination(8);
      }

      setTrainerNotes(selectedBatch.trainerNotes || '');

      setAttendance(
        selectedBatch.members.map((m) => ({
          id: m.id,
          rollNo: m.rollNo,
          present: m.present,
          remarks: m.individualRemarks,
        }))
      );

      // Reset timer
      setSecondsElapsed(0);
      setIsTimerRunning(true);
    }
  }, [selectedBatch]);

  // Stopwatch interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  if (!selectedBatch) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl font-bold">
          🎤
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Batch Selected for Presentation</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Choose a batch from your directory or use the Random Batch Picker to begin live evaluation.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => setActiveTab('picker')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            🎲 Pick Random Batch
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200"
          >
            View Directory
          </button>
        </div>
      </div>
    );
  }

  // Live Score Calculations
  const totalScore = communication + confidence + contentQuality + technicalUnderstanding + teamCoordination;
  const percentage = (totalScore / 50) * 100;
  const grade = calculateGrade(percentage);

  // Timer format (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle Member Attendance
  const handleToggleAttendance = (id: string) => {
    setAttendance((prev) =>
      prev.map((m) => (m.id === id ? { ...m, present: !m.present } : m))
    );
  };

  const handleMarkAllAttendance = (status: boolean) => {
    setAttendance((prev) => prev.map((m) => ({ ...m, present: status })));
  };

  // Quick Preset Scoring
  const handleApplyPreset = (preset: 'excellent' | 'good' | 'average' | 'poor') => {
    if (preset === 'excellent') {
      setCommunication(9);
      setConfidence(9);
      setContentQuality(10);
      setTechnicalUnderstanding(9);
      setTeamCoordination(9);
    } else if (preset === 'good') {
      setCommunication(7);
      setConfidence(8);
      setContentQuality(7);
      setTechnicalUnderstanding(7);
      setTeamCoordination(8);
    } else if (preset === 'average') {
      setCommunication(5);
      setConfidence(5);
      setContentQuality(5);
      setTechnicalUnderstanding(5);
      setTeamCoordination(5);
    } else if (preset === 'poor') {
      setCommunication(3);
      setConfidence(3);
      setContentQuality(3);
      setTechnicalUnderstanding(3);
      setTeamCoordination(3);
    }
  };

  // Add Snippet to Notes
  const handleAddSnippet = (snippet: string) => {
    setTrainerNotes((prev) => (prev ? `${prev}. ${snippet}` : snippet));
  };

  // Final Action Handlers
  const handleSavePresented = async () => {
    await saveBatchEvaluation(
      selectedBatch.id,
      {
        communication,
        confidence,
        contentQuality,
        technicalUnderstanding,
        teamCoordination,
      },
      trainerNotes,
      attendance
    );
  };

  const handleSaveAndPickNext = async () => {
    await handleSavePresented();
    const next = pickRandomPendingBatch();
    if (next) {
      startPresentationWithBatch(next);
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSetQuickStatus = async (status: PresentationStatus) => {
    await setBatchStatus(selectedBatch.id, status, trainerNotes);
  };

  const statusCfg = STATUS_CONFIG[selectedBatch.status] || STATUS_CONFIG.Pending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Presentation Cockpit Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-extrabold flex flex-col items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">BATCH</span>
            <span className="text-xl font-black">{selectedBatch.batchNumber}</span>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusCfg.badgeClass}`}>
                {selectedBatch.status}
              </span>
              <span className="text-xs text-slate-500">
                {selectedBatch.members.length} Members Enrolled
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {selectedBatch.topic}
            </h2>
          </div>
        </div>

        {/* Stopwatch & PPT Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Stopwatch */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-800">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm">{formatTime(secondsElapsed)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              title={isTimerRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setSecondsElapsed(0);
              }}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PPT Link Button */}
          {selectedBatch.pptLink ? (
            <a
              href={selectedBatch.pptLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs border border-blue-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open PPT Slide Deck</span>
            </a>
          ) : (
            <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">No PPT URL</span>
          )}
        </div>
      </div>

      {/* Main Scoring Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attendance & Trainer Notes (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Attendance Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Student Attendance</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => handleMarkAllAttendance(true)}
                  className="px-2 py-0.5 rounded font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  All Present
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleMarkAllAttendance(false)}
                  className="px-2 py-0.5 rounded font-semibold text-amber-700 hover:bg-amber-50"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {attendance.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleToggleAttendance(student.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    student.present
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        student.present ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {student.present ? '✓' : '✕'}
                    </span>
                    <div>
                      <span className="font-extrabold text-xs">{student.rollNo}</span>
                      {selectedBatch.members.find((m) => m.id === student.id)?.name && (
                        <span className="text-xs text-slate-600 ml-1.5">
                          ({selectedBatch.members.find((m) => m.id === student.id)?.name})
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      student.present ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {student.present ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trainer Notes & Quick Snippets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Trainer Feedback &amp; Notes</h3>
              </div>
              <span className="text-[11px] text-slate-400">Autosaves on submit</span>
            </div>

            {/* Quick Feedback Snippet Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Feedback Snippets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_FEEDBACK_SNIPPETS.map((snippet, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddSnippet(snippet)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors"
                  >
                    + {snippet}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="Type specific evaluation notes, improvements, strengths, or questions asked..."
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Right Column: 5-Parameter Rubric & Total Score (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" /> 5-Parameter Evaluation Rubric
                </h3>
                <p className="text-xs text-slate-500">Score each parameter from 1 (poor) to 10 (exceptional)</p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleApplyPreset('excellent')}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] transition-colors"
                >
                  🌟 9/10
                </button>
                <button
                  onClick={() => handleApplyPreset('good')}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[10px] transition-colors"
                >
                  👍 7/10
                </button>
                <button
                  onClick={() => handleApplyPreset('average')}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[10px] transition-colors"
                >
                  👌 5/10
                </button>
              </div>
            </div>

            {/* Rubrics Sliders */}
            <div className="space-y-4">
              {/* 1. Communication */}
              <RubricSlider
                title="1. Communication & Articulation"
                description="Clarity of speech, pacing, vocal projection, avoidance of filler words"
                value={communication}
                onChange={setCommunication}
              />

              {/* 2. Confidence */}
              <RubricSlider
                title="2. Confidence & Body Language"
                description="Eye contact, posture, engagement with audience, poise during questions"
                value={confidence}
                onChange={setConfidence}
              />

              {/* 3. Content Quality */}
              <RubricSlider
                title="3. Content Quality & Slide Design"
                description="Structure, visual aesthetics, absence of cluttered text walls, references"
                value={contentQuality}
                onChange={setContentQuality}
              />

              {/* 4. Technical Understanding */}
              <RubricSlider
                title="4. Technical Understanding & Q&A"
                description="Depth of subject mastery, accuracy of architecture, responses to cross-questions"
                value={technicalUnderstanding}
                onChange={setTechnicalUnderstanding}
              />

              {/* 5. Team Coordination */}
              <RubricSlider
                title="5. Team Coordination & Equity"
                description="Equal participation among members, smooth handoffs, collective knowledge"
                value={teamCoordination}
                onChange={setTeamCoordination}
              />
            </div>

            {/* Live Score Output Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-4 text-white flex items-center justify-between shadow-md">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Calculated Evaluation
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{totalScore}</span>
                  <span className="text-sm font-semibold text-blue-200">/ 50 Points</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="text-center bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block">Grade</span>
                <span className="text-2xl font-black">{grade}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky bottom-3 z-30">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Quick Status:</span>
          <button
            onClick={() => handleSetQuickStatus('Absent')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            Mark Absent
          </button>
          <button
            onClick={() => handleSetQuickStatus('Re-Present')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            Schedule Re-Present
          </button>
          <button
            onClick={() => handleSetQuickStatus('Rejected')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            Mark Rejected
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePresented}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save as Presented
          </button>

          <button
            onClick={handleSaveAndPickNext}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
          >
            <Dices className="w-4 h-4" />
            <span>Save &amp; Pick Next Batch</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface RubricSliderProps {
  title: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
}

const RubricSlider: React.FC<RubricSliderProps> = ({ title, description, value, onChange }) => {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-xs">{title}</h4>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shadow-2xs ${
            value >= 9
              ? 'bg-emerald-600 text-white'
              : value >= 7
              ? 'bg-blue-600 text-white'
              : value >= 5
              ? 'bg-amber-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {value}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-400">
          <span>/10</span>
        </div>
      </div>
    </div>
  );
};
