'use client';

import React, { useState } from 'react';
import { useBatch } from '@/context/BatchContext';
import { STATUS_CONFIG, PresentationStatus } from '@/types/batch';
import {
  History,
  Clock,
  Award,
  Users,
  Search,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Play,
} from 'lucide-react';

export const SessionHistoryView: React.FC = () => {
  const { sessionLogs, batches, startPresentationWithBatch } = useBatch();
  const [historySearch, setHistorySearch] = useState<string>('');

  const filteredLogs = sessionLogs.filter((log) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      String(log.batchNumber).toLowerCase().includes(q) ||
      log.topic.toLowerCase().includes(q) ||
      (log.trainerNotes || '').toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q)
    );
  });

  // Group logs by date (e.g. "Today - September 11, 2026")
  const groupedByDate: Record<string, typeof sessionLogs> = {};
  filteredLogs.forEach((log) => {
    const dateKey = new Date(log.timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(log);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> Presentation History &amp; Logs
          </h2>
          <p className="text-xs text-slate-500">
            Timeline of all presentation evaluations, status updates, and faculty remarks
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search history logs..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
      </div>

      {/* History Timeline */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateLabel, logs]) => (
            <div key={dateLabel} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" /> {dateLabel}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{logs.length} Actions Recorded</span>
              </div>

              <div className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const statusCfg = STATUS_CONFIG[log.status as PresentationStatus] || STATUS_CONFIG.Pending;
                  const originalBatch = batches.find((b) => b.id === log.batchId || b.batchNumber === log.batchNumber);

                  return (
                    <div
                      key={log.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs border border-blue-200">
                            B{log.batchNumber}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">Batch {log.batchNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.badgeClass}`}>
                            {log.status}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">{log.topic}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span>
                            Attendance: <span className="font-semibold text-slate-700">{log.presentCount}/{log.totalMembers} Present</span>
                          </span>

                          {log.score !== undefined && (
                            <span className="font-bold text-emerald-700">
                              Score: {log.score}/50 ({log.grade})
                            </span>
                          )}
                        </div>

                        {log.trainerNotes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded-md border border-slate-100">
                            &quot;{log.trainerNotes}&quot;
                          </p>
                        )}
                      </div>

                      {originalBatch && (
                        <button
                          onClick={() => startPresentationWithBatch(originalBatch)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <Play className="w-3.5 h-3.5" /> Re-Open
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Presentation Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {historySearch
              ? 'No history entries matched your search filter.'
              : 'Evaluations, marks, and status changes will be recorded here with timestamps as you conduct sessions.'}
          </p>
        </div>
      )}
    </div>
  );
};
