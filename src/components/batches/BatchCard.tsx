'use client';

import React, { useState } from 'react';
import { Batch, STATUS_CONFIG, PresentationStatus } from '@/types/batch';
import { useBatch } from '@/context/BatchContext';
import {
  ExternalLink,
  Edit2,
  Trash2,
  Play,
  FileText,
  Users,
  ChevronDown,
  CheckCircle2,
  Award,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface BatchCardProps {
  batch: Batch;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const {
    setBatchStatus,
    setEditingBatch,
    setIsBatchModalOpen,
    deleteBatch,
    startPresentationWithBatch,
    openRePresentModal,
  } = useBatch();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const statusCfg = STATUS_CONFIG[batch.status as PresentationStatus] || STATUS_CONFIG.Pending;
  const presentCount = batch.members.filter((m) => m.present).length;

  const handleStatusChange = async (newStatus: PresentationStatus) => {
    setIsStatusMenuOpen(false);
    if (newStatus === 'Re-Present') {
      openRePresentModal(batch);
    } else {
      await setBatchStatus(batch.id, newStatus);
    }
  };

  const handleEdit = () => {
    setEditingBatch(batch);
    setIsBatchModalOpen(true);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete Batch ${batch.batchNumber}: "${batch.topic}"?`)) {
      await deleteBatch(batch.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group overflow-hidden">
      {/* Top Card Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          {/* Batch Number */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs border border-blue-200 shrink-0">
              B{batch.batchNumber}
            </span>
            <span className="font-bold text-slate-900 text-sm">Batch {batch.batchNumber}</span>
          </div>

          {/* Status Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badgeClass} hover:opacity-90 transition-opacity`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
              <span>{batch.status}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isStatusMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsStatusMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                  {(['Pending', 'Presented', 'Absent', 'Rejected', 'Re-Present'] as PresentationStatus[]).map(
                    (st) => {
                      const cfg = STATUS_CONFIG[st];
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                            batch.status === st ? 'font-bold text-slate-900 bg-slate-100/70' : 'text-slate-600'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Topic Title */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
            {batch.topic}
          </h3>
        </div>

        {/* Seminar Topic Highlight Card if in Re-Present status */}
        {batch.status === 'Re-Present' && (
          <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center gap-1 text-[11px]">
                <RotateCcw className="w-3.5 h-3.5 text-purple-600" /> Seminar Topic:
              </span>
              <button
                type="button"
                onClick={() => openRePresentModal(batch)}
                className="text-[10px] text-purple-700 hover:text-purple-950 font-bold underline"
              >
                Edit
              </button>
            </div>
            <p className="font-bold text-purple-950 text-xs leading-snug">
              {batch.rePresentTopic || 'No seminar topic set'}
            </p>
          </div>
        )}

        {/* Members Roll Numbers & Status */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Team Members:
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              {presentCount}/{batch.members.length} Present
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {batch.members.map((member) => {
              if (batch.status === 'Re-Present') {
                return (
                  <span
                    key={member.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      member.satisfied
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-purple-50 text-purple-800 border-purple-300'
                    }`}
                    title={
                      member.rePresentRemarks
                        ? `${member.rollNo}: ${member.rePresentRemarks}`
                        : member.name
                        ? `${member.rollNo} - ${member.name}`
                        : member.rollNo
                    }
                  >
                    <span>{member.rollNo}</span>
                    <span className="text-[10px] font-normal">
                      ({member.satisfied ? 'Cleared' : 'Re-Present'})
                    </span>
                  </span>
                );
              }

              return (
                <span
                  key={member.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    member.present
                      ? 'bg-slate-50 text-slate-700 border-slate-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200 line-through opacity-75'
                  }`}
                  title={member.name ? `${member.rollNo} - ${member.name}` : member.rollNo}
                >
                  <span>{member.rollNo}</span>
                  {member.name && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      ({member.name})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Evaluation Score Pill if present */}
        {batch.evaluation && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Score: {batch.evaluation.totalScore}/50</span>
              <span className="text-[11px] font-normal text-emerald-600">({batch.evaluation.percentage.toFixed(0)}%)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[11px]">
              {batch.evaluation.grade}
            </span>
          </div>
        )}

        {/* Trainer Notes snippet */}
        {batch.trainerNotes && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
            &quot;{batch.trainerNotes}&quot;
          </p>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {batch.pptLink ? (
            <a
              href={batch.pptLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              title="Open Presentation PPT"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>PPT Link</span>
            </a>
          ) : batch.pptFileName ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 truncate max-w-[100px]">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{batch.pptFileName}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No PPT link</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors"
            title="Edit Batch Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Batch"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => startPresentationWithBatch(batch)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{batch.status === 'Presented' ? 'Review' : 'Present'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
