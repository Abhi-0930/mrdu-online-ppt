'use client';

import React from 'react';
import { useBatch } from '@/context/BatchContext';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Dices,
  Disc,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { STATUS_CONFIG, PresentationStatus } from '@/types/batch';

export const DashboardOverview: React.FC = () => {
  const {
    batches,
    stats,
    setActiveTab,
    pickRandomPendingBatch,
    startPresentationWithBatch,
    sessionLogs,
    setIsBatchModalOpen,
    setEditingBatch,
    setIsExcelModalOpen,
    loadSampleData,
  } = useBatch();

  const handleQuickPick = () => {
    const picked = pickRandomPendingBatch();
    if (picked) {
      startPresentationWithBatch(picked);
    } else {
      setActiveTab('picker');
    }
  };

  if (batches.length === 0) {
    return (
      <div className="space-y-6">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-blue-100 backdrop-blur-xs">
              ⚡ Classroom Presentation Manager
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Manage Student Presentations
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Your classroom database is currently empty. Add your student batches manually, upload an Excel/JSON spreadsheet, or load your workspace file to begin.
            </p>
          </div>
        </div>

        {/* 3 Quick Setup Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Action 1: Add Single Batch */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                ➕
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Add Batch Manually</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add an individual batch with batch number, presentation topic title, and student roll numbers.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBatch(null);
                setIsBatchModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Single Batch
            </button>
          </div>

          {/* Action 2: Import from Excel / CSV / JSON */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                📥
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Import Excel / JSON</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your class roster file (.xlsx, .xls, .csv, or .json) with automatic column detection.
              </p>
            </div>
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" /> Open File Uploader
            </button>
          </div>

          {/* Action 3: Quick-Load Workspace students_data.json */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Load students_data.json</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                One-click load the 29 classroom batches and 87 students from your workspace dataset.
              </p>
            </div>
            <button
              onClick={loadSampleData}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Load 29 Batches Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-xs">
              ⚡ Classroom Presentation Engine
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ready for Today&apos;s Presentations
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {stats.pendingBatches} out of {stats.totalBatches} batches pending. Select a team randomly, launch live
              rubric scoring, and track attendance completely offline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleQuickPick}
              disabled={stats.pendingBatches === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-blue-700 hover:bg-blue-50 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Dices className="w-4 h-4 text-blue-600" />
              <span>🎲 Pick Random Batch</span>
            </button>

            <button
              onClick={() => setActiveTab('spinner')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition-all border border-white/20 active:scale-95"
            >
              <Disc className="w-4 h-4" />
              <span>Wheel Spinner</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition-all border border-white/20 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Generate Queue</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Batches */}
        <div
          onClick={() => setActiveTab('batches')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.totalStudents} enrolled students</div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presented</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completedBatches}</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.pendingBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting evaluation</div>
        </div>

        {/* Absent / Rejected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Absent / Re</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.absentBatches + stats.rePresentBatches + stats.rejectedBatches}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.absentBatches} absent, {stats.rePresentBatches} re-present
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Class Avg</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageScore > 0 ? `${stats.averageScore}/50` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.averageScore > 0 ? `${((stats.averageScore / 50) * 100).toFixed(0)}% overall` : 'No scores yet'}
          </div>
        </div>

        {/* Student Attendance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalStudents > 0
              ? `${Math.round((stats.presentStudents / stats.totalStudents) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.presentStudents}/{stats.totalStudents} students present
          </div>
        </div>
      </div>

      {/* Highlights & Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performer Card */}
        {stats.bestTeam ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Top Performing Batch</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                Batch {stats.bestTeam.batchNumber}: {stats.bestTeam.topic}
              </h4>
              <p className="text-xs text-emerald-700">
                Score: <span className="font-bold text-emerald-900">{stats.bestTeam.score}/50</span> (
                {((stats.bestTeam.score / 50) * 100).toFixed(0)}%)
              </p>
            </div>
            <button
              onClick={() => {
                const target = batches.find((b) => b.batchNumber === stats.bestTeam?.batchNumber);
                if (target) startPresentationWithBatch(target);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
            >
              View Sheet
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-slate-500 text-xs">
            <span>No batches evaluated yet. Pick a batch to start scoring!</span>
            <button
              onClick={handleQuickPick}
              className="px-3 py-1.5 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start First
            </button>
          </div>
        )}

        {/* Re-Present / Attention Card */}
        {stats.rePresentBatches > 0 ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 uppercase tracking-wide">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span>Action Needed</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                {stats.rePresentBatches} {stats.rePresentBatches === 1 ? 'batch needs' : 'batches need'} Re-Presentation
              </h4>
              <p className="text-xs text-purple-700">Schedule them in today&apos;s queue or re-roll</p>
            </div>
            <button
              onClick={() => {
                const target = batches.find((b) => b.status === 'Re-Present');
                if (target) startPresentationWithBatch(target);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shrink-0 shadow-xs"
            >
              View Re-Present
            </button>
          </div>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-slate-900 text-xs">Need to import your student roster?</h4>
              <p className="text-xs text-slate-500">Upload your class Excel file or download the template</p>
            </div>
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100/80 hover:bg-blue-200/80 rounded-lg transition-colors shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Excel
            </button>
          </div>
        )}
      </div>

      {/* Main Bottom Section: Recent Activity & Quick Batch Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Batches Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Presentation Roster</h3>
              <span className="text-xs text-slate-500">({batches.length} total)</span>
            </div>
            <button
              onClick={() => setActiveTab('batches')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All Batches <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto thin-scrollbar">
            {batches.slice(0, 8).map((batch) => {
              const statusCfg = STATUS_CONFIG[batch.status as PresentationStatus] || STATUS_CONFIG.Pending;
              return (
                <div
                  key={batch.id}
                  className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                      B{batch.batchNumber}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{batch.topic}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Members:{' '}
                        {batch.members.map((m) => m.rollNo).join(', ')} ({batch.members.length} students)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.badgeClass}`}>
                      {batch.status}
                    </span>

                    {batch.evaluation && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {batch.evaluation.totalScore}/50 ({batch.evaluation.grade})
                      </span>
                    )}

                    <button
                      onClick={() => startPresentationWithBatch(batch)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Open Presentation Room"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Session Logs & Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Session Activity Log</h3>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Full Log
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3 thin-scrollbar">
            {sessionLogs.length > 0 ? (
              sessionLogs.slice(0, 8).map((log) => {
                const statusCfg = STATUS_CONFIG[log.status as PresentationStatus] || STATUS_CONFIG.Pending;
                return (
                  <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Batch {log.batchNumber}</span>
                      <span className={`px-1.5 py-0.2 rounded-sm text-[10px] font-bold ${statusCfg.badgeClass}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{log.topic}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>
                        {log.score !== undefined ? `Score: ${log.score}/50 (${log.grade})` : 'Status updated'}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                <Clock className="w-6 h-6 mx-auto text-slate-300" />
                <p>No activity recorded yet for this session.</p>
                <p className="text-[11px]">Evaluations and status updates will appear here live.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
