'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch } from '@/types/batch';
import { AudioEffects } from '@/services/audioService';
import confetti from 'canvas-confetti';
import { Disc, Dices, Play, RotateCcw, Sparkles, CheckCircle2, Users } from 'lucide-react';

const WHEEL_COLORS = [
  '#2563EB', // Blue 600
  '#059669', // Emerald 600
  '#D97706', // Amber 600
  '#7C3AED', // Violet 600
  '#DC2626', // Red 600
  '#0891B2', // Cyan 600
  '#4F46E5', // Indigo 600
  '#EA580C', // Orange 600
  '#0D9488', // Teal 600
  '#9333EA', // Purple 600
];

export const WheelSpinner: React.FC = () => {
  const { batches, startPresentationWithBatch, setActiveTab, settings } = useBatch();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [includeRePresent, setIncludeRePresent] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winnerBatch, setWinnerBatch] = useState<Batch | null>(null);

  // Rotation state
  const rotationAngleRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSliceIndexRef = useRef<number>(-1);

  const eligibleBatches = batches.filter((b) => {
    if (b.status === 'Pending') return true;
    if (includeRePresent && b.status === 'Re-Present') return true;
    return false;
  });

  const numSlices = eligibleBatches.length;
  const arcSize = numSlices > 0 ? (2 * Math.PI) / numSlices : 0;

  // Draw Wheel on Canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    if (numSlices === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 16px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No Pending Batches', centerX, centerY);
      return;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngleRef.current);

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const angle = i * arcSize;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Batch Text
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Poppins, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;

      const batchLabel = `Batch ${eligibleBatches[i].batchNumber}`;
      ctx.fillText(batchLabel, radius - 24, 5);
      ctx.restore();
    }

    // Outer Rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', 0, 0);

    ctx.restore();

    // Draw Top Pointer (Fixed at top)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - 16, centerY - radius - 10);
    ctx.lineTo(centerX + 16, centerY - radius - 10);
    ctx.lineTo(centerX, centerY - radius + 14);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [numSlices, arcSize, eligibleBatches]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Spin physics loop
  const spinLoop = () => {
    if (angularVelocityRef.current > 0.002) {
      rotationAngleRef.current += angularVelocityRef.current;
      angularVelocityRef.current *= 0.985; // Friction

      // Calculate slice passing pointer (pointer is at -PI/2)
      const currentAngle = (rotationAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const pointerAngle = (3 * Math.PI) / 2; // top position
      const relativeAngle = (pointerAngle - currentAngle + 2 * Math.PI) % (2 * Math.PI);
      const currentSlice = Math.floor(relativeAngle / arcSize) % numSlices;

      if (currentSlice !== lastSliceIndexRef.current) {
        lastSliceIndexRef.current = currentSlice;
        if (settings.soundEffects) {
          AudioEffects.playTick();
        }
      }

      drawWheel();
      animationFrameRef.current = requestAnimationFrame(spinLoop);
    } else {
      // Stopped
      setIsSpinning(false);
      const currentAngle = (rotationAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const pointerAngle = (3 * Math.PI) / 2;
      const relativeAngle = (pointerAngle - currentAngle + 2 * Math.PI) % (2 * Math.PI);
      const winningIndex = Math.floor(relativeAngle / arcSize) % numSlices;
      const winner = eligibleBatches[winningIndex];

      setWinnerBatch(winner);

      if (settings.soundEffects) {
        AudioEffects.playWinnerFanfare();
      }

      if (settings.confettiEnabled) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleStartSpin = () => {
    if (isSpinning || numSlices === 0) return;
    setWinnerBatch(null);
    setIsSpinning(true);

    // Random initial velocity (0.25 to 0.45 radians per frame)
    angularVelocityRef.current = 0.28 + Math.random() * 0.2;
    animationFrameRef.current = requestAnimationFrame(spinLoop);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Disc className="w-6 h-6 text-purple-600" /> Interactive Wheel Spinner
          </h2>
          <p className="text-xs text-slate-500">
            Visual animated wheel loaded with all pending batches. Great for student engagement!
          </p>
        </div>

        <button
          onClick={() => setActiveTab('picker')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <Dices className="w-4 h-4 text-purple-600" />
          <span>Switch to Quick Draw</span>
        </button>
      </div>

      {/* Wheel Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 flex flex-col items-center">
        {/* Filter bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700">Wheel Segments:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {eligibleBatches.length} Teams on Wheel
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeRePresent}
              onChange={(e) => setIncludeRePresent(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Include Re-Present Batches</span>
          </label>
        </div>

        {/* Canvas Display */}
        <div className="relative py-2">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onClick={handleStartSpin}
            className={`max-w-full h-auto cursor-pointer select-none drop-shadow-md transition-transform ${
              isSpinning ? '' : 'hover:scale-[1.02]'
            }`}
          />
        </div>

        {/* Spin Button */}
        {eligibleBatches.length > 0 ? (
          <button
            onClick={handleStartSpin}
            disabled={isSpinning}
            className={`px-10 py-3.5 rounded-2xl text-base font-extrabold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
              isSpinning
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/25'
            }`}
          >
            <Disc className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Wheel Spinning...' : '🎡 SPIN WHEEL'}</span>
          </button>
        ) : batches.length === 0 ? (
          <div className="text-center py-6 space-y-2 text-slate-500 text-xs">
            <p className="font-bold text-slate-800 text-sm">No batches in classroom directory.</p>
            <p className="text-[11px]">Add batches manually or import your students dataset to spin the wheel.</p>
            <button
              onClick={() => setActiveTab('batches')}
              className="mt-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
            >
              Go to Batches
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800">All teams completed!</p>
          </div>
        )}

        {/* Winner Announcement Box */}
        {winnerBatch && (
          <div className="w-full bg-gradient-to-br from-purple-50 via-indigo-50/40 to-slate-50 rounded-2xl border-2 border-purple-500/40 p-6 shadow-md animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-600 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> Selected by Wheel!
              </span>
              <span className="text-xs text-slate-500 font-semibold">Status: {winnerBatch.status}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">
                Batch {winnerBatch.batchNumber}
              </h3>
              <p className="text-base font-bold text-purple-900 leading-snug">{winnerBatch.topic}</p>
            </div>

            {/* Seminar Topic Banner if in Re-Present status */}
            {winnerBatch.status === 'Re-Present' && (
              <div className="bg-purple-100/80 border border-purple-300 rounded-xl p-3 space-y-1 text-xs">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                  🔁 Assigned Seminar Topic (Common to all members):
                </span>
                <p className="font-bold text-purple-950 text-sm">
                  {winnerBatch.rePresentTopic || 'No seminar topic specified'}
                </p>
              </div>
            )}

            {/* Team Members Grid with Roll Numbers & Names */}
            <div className="pt-2 border-t border-purple-200/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-purple-600" /> Team Members:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {winnerBatch.members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl border shadow-2xs text-xs space-y-1 ${
                      winnerBatch.status === 'Re-Present'
                        ? member.satisfied
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-purple-50 border-purple-300'
                        : 'bg-white border-purple-200/80'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${member.satisfied ? 'bg-emerald-500' : 'bg-purple-500'} shrink-0`} />
                        <span>Roll No: {member.rollNo}</span>
                      </div>
                      {winnerBatch.status === 'Re-Present' && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          member.satisfied ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {member.satisfied ? 'Cleared' : 'Re-Present'}
                        </span>
                      )}
                    </div>
                    {member.name && (
                      <div className="text-xs font-semibold text-purple-900 truncate pl-3.5">
                        {member.name}
                      </div>
                    )}
                    {member.rePresentRemarks && (
                      <div className="text-[10px] text-purple-700 italic pl-3.5 truncate">
                        &quot;{member.rePresentRemarks}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-200/60 flex items-center justify-end gap-3">
              <button
                onClick={handleStartSpin}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Spin Again
              </button>

              <button
                onClick={() => startPresentationWithBatch(winnerBatch)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Open Presentation Room</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
