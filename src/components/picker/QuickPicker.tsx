'use client';

import React, { useState, useEffect } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch } from '@/types/batch';
import { AudioEffects } from '@/services/audioService';
import confetti from 'canvas-confetti';
import {
  Dices,
  Play,
  RotateCcw,
  Users,
  ExternalLink,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Disc,
} from 'lucide-react';

export const QuickPicker: React.FC = () => {
  const { batches, startPresentationWithBatch, setActiveTab, settings } = useBatch();

  const [includeRePresent, setIncludeRePresent] = useState<boolean>(false);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [animText, setAnimText] = useState<string>('');

  const eligibleBatches = batches.filter((b) => {
    if (b.status === 'Pending') return true;
    if (includeRePresent && b.status === 'Re-Present') return true;
    return false;
  });

  const handlePickBatch = () => {
    if (eligibleBatches.length === 0) return;

    setIsPicking(true);
    setSelectedBatch(null);

    let count = 0;
    const maxSteps = 18;
    const intervalTime = 70;

    const interval = setInterval(() => {
      count++;
      const randomIdx = Math.floor(Math.random() * eligibleBatches.length);
      const tempBatch = eligibleBatches[randomIdx];
      setAnimText(`Batch ${tempBatch.batchNumber}: ${tempBatch.topic.substring(0, 30)}...`);

      if (settings.soundEffects) {
        AudioEffects.playTick();
      }

      if (count >= maxSteps) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * eligibleBatches.length);
        const chosen = eligibleBatches[finalIdx];
        setSelectedBatch(chosen);
        setIsPicking(false);

        if (settings.soundEffects) {
          AudioEffects.playWinnerFanfare();
        }

        if (settings.confettiEnabled) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    }, intervalTime);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Dices className="w-6 h-6 text-blue-600" /> Random Batch Picker
          </h2>
          <p className="text-xs text-slate-500">
            Fair, suspenseful, and random selection from remaining pending batches
          </p>
        </div>

        <button
          onClick={() => setActiveTab('spinner')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <Disc className="w-4 h-4 text-blue-600" />
          <span>Switch to Wheel Spinner</span>
        </button>
      </div>

      {/* Control Card & Eligibility Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700">Eligible Pool:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {eligibleBatches.length} Teams Ready
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeRePresent}
              onChange={(e) => setIncludeRePresent(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Include &quot;Re-Present&quot; Batches</span>
          </label>
        </div>

        {/* Big Interactive Picker Action Area */}
        <div className="py-8 px-4 text-center space-y-6">
          {eligibleBatches.length > 0 ? (
            <div className="space-y-4">
              <button
                onClick={handlePickBatch}
                disabled={isPicking}
                className={`px-8 py-4 rounded-2xl text-lg font-extrabold text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3 mx-auto ${
                  isPicking
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 hover:-translate-y-0.5'
                }`}
              >
                <Dices className={`w-7 h-7 ${isPicking ? 'animate-spin' : ''}`} />
                <span>{isPicking ? 'Shuffling Batches...' : '🎲 Pick Random Batch'}</span>
              </button>

              {isPicking && (
                <div className="text-sm font-mono text-blue-600 font-bold animate-pulse">
                  {animText}
                </div>
              )}
            </div>
          ) : batches.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                📋
              </div>
              <h3 className="text-base font-bold text-slate-900">No Batches in Directory</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add batches manually or import your students dataset to start picking teams.
              </p>
              <button
                onClick={() => setActiveTab('batches')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Go to Batch Directory
              </button>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">All Batches Completed!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pending batches remain in the pool. You can reset statuses from the directory or import more batches.
              </p>
            </div>
          )}
        </div>

        {/* Selected Batch Winner Showcase Card */}
        {selectedBatch && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 rounded-2xl border-2 border-blue-500/40 p-6 shadow-md animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> Selected Team
              </span>
              <span className="text-xs text-slate-500 font-semibold">Status: {selectedBatch.status}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">
                Batch {selectedBatch.batchNumber}
              </h3>
              <p className="text-base font-bold text-blue-900 leading-snug">{selectedBatch.topic}</p>
            </div>

            {/* Team Members List */}
            <div className="pt-2 border-t border-blue-200/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-blue-600" /> Team Members:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedBatch.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-2 bg-white rounded-lg border border-blue-200 shadow-2xs text-xs space-y-0.5"
                  >
                    <div className="font-extrabold text-slate-900">{member.rollNo}</div>
                    {member.name && <div className="text-[11px] text-slate-500 truncate">{member.name}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* PPT Link if available */}
            {selectedBatch.pptLink && (
              <div className="pt-1">
                <a
                  href={selectedBatch.pptLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs"
                >
                  <ExternalLink className="w-4 h-4" /> Open Presentation PPT Link
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-blue-200/60 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={handlePickBatch}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Pick Another Batch
              </button>

              <button
                onClick={() => startPresentationWithBatch(selectedBatch)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Live Presentation &amp; Scoring</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
