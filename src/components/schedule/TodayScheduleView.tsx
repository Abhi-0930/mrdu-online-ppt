'use client';

import React, { useState } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch, STATUS_CONFIG, PresentationStatus } from '@/types/batch';
import {
  CalendarCheck,
  Play,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Clock,
  ListOrdered,
  Users,
  Award,
} from 'lucide-react';

export const TodayScheduleView: React.FC = () => {
  const {
    todayQueue,
    todayQueueIndex,
    generateTodayQueue,
    advanceScheduleQueue,
    reorderScheduleQueue,
    startPresentationWithBatch,
    batches,
  } = useBatch();

  const [genMode, setGenMode] = useState<'count' | 'range'>('count');
  const [targetCount, setTargetCount] = useState<number>(6);
  const [startBatch, setStartBatch] = useState<number>(1);
  const [endBatch, setEndBatch] = useState<number>(10);

  const handleGenerate = async () => {
    if (genMode === 'count') {
      await generateTodayQueue({ type: 'count', count: targetCount });
    } else {
      await generateTodayQueue({ type: 'range', start: startBatch, end: endBatch });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newQueue = [...todayQueue];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newQueue.length) return;

    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIdx];
    newQueue[targetIdx] = temp;

    await reorderScheduleQueue(newQueue);
  };

  const currentBatch = todayQueue[todayQueueIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" /> Today&apos;s Presentation Schedule
          </h2>
          <p className="text-xs text-slate-500">
            Generate and manage today&apos;s presentation sequence and queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {todayQueue.length} Batches in Today&apos;s Queue
          </span>
        </div>
      </div>

      {/* Generator Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Generate Session Queue</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Mode Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Queue Generation Mode</label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGenMode('count')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  genMode === 'count' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Target Count
              </button>
              <button
                type="button"
                onClick={() => setGenMode('range')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  genMode === 'range' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Batch Range
              </button>
            </div>
          </div>

          {/* Mode Inputs */}
          {genMode === 'count' ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Teams Today</label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-bold text-slate-700 mb-1">From Batch</label>
                <input
                  type="number"
                  value={startBatch}
                  onChange={(e) => setStartBatch(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="flex-1">
                <label className="block font-bold text-slate-700 mb-1">To Batch</label>
                <input
                  type="number"
                  value={endBatch}
                  onChange={(e) => setEndBatch(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Generate Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Presenter Spotlight Hero */}
      {currentBatch && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
              🎤 NOW ON STAGE (Queue #{todayQueueIndex + 1} of {todayQueue.length})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => advanceScheduleQueue('prev')}
                disabled={todayQueueIndex === 0}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => advanceScheduleQueue('next')}
                disabled={todayQueueIndex >= todayQueue.length - 1}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Next Up
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl font-black text-white">
              Batch {currentBatch.batchNumber}
            </h3>
            <p className="text-base font-bold text-blue-200">{currentBatch.topic}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <div className="text-xs text-blue-200">
              <span className="font-bold text-white">Members: </span>
              {currentBatch.members.map((m) => m.rollNo).join(', ')}
            </div>

            <button
              onClick={() => startPresentationWithBatch(currentBatch)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 shadow-md flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-blue-700" /> Launch Presentation Room
            </button>
          </div>
        </div>
      )}

      {/* Queue Sequence List */}
      {todayQueue.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Order of Presentations</h3>
            <span className="text-xs text-slate-500">Reorder with arrows or jump directly</span>
          </div>

          <div className="divide-y divide-slate-100">
            {todayQueue.map((batch, idx) => {
              const isCurrent = idx === todayQueueIndex;
              const statusCfg = STATUS_CONFIG[batch.status as PresentationStatus] || STATUS_CONFIG.Pending;

              return (
                <div
                  key={batch.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isCurrent ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center font-mono font-bold text-slate-400 text-xs">
                      #{idx + 1}
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-extrabold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                      B{batch.batchNumber}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{batch.topic}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Members: {batch.members.map((m) => m.rollNo).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.badgeClass}`}>
                      {batch.status}
                    </span>

                    {/* Reorder buttons */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                        title="Move Up in Queue"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === todayQueue.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                        title="Move Down in Queue"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => startPresentationWithBatch(batch)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                    >
                      Present
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Queue Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Generate Queue&quot; above to create today&apos;s presentation sequence based on your target count or batch range.
          </p>
        </div>
      )}
    </div>
  );
};
