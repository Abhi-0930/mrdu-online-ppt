'use client';

import React, { useState, useEffect } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch, BatchMember } from '@/types/batch';
import {
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const RePresentModal: React.FC = () => {
  const {
    isRePresentModalOpen,
    setIsRePresentModalOpen,
    rePresentTargetBatch,
    confirmBatchRePresent,
  } = useBatch();

  const [seminarTopic, setSeminarTopic] = useState<string>('');
  const [memberStatuses, setMemberStatuses] = useState<
    {
      id: string;
      rollNo: string;
      name?: string;
      satisfied: boolean;
      needsRePresent: boolean;
      rePresentRemarks: string;
    }[]
  >([]);
  const [trainerNotes, setTrainerNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (rePresentTargetBatch) {
      setSeminarTopic(rePresentTargetBatch.rePresentTopic || '');
      setTrainerNotes(rePresentTargetBatch.trainerNotes || '');
      setError('');

      // Initialize member statuses
      setMemberStatuses(
        rePresentTargetBatch.members.map((m) => {
          // If already configured previously, preserve it, else default: all must re-present
          const isSatisfied = m.satisfied === true;
          const needsRep = m.needsRePresent !== undefined ? m.needsRePresent : !isSatisfied;
          return {
            id: m.id,
            rollNo: m.rollNo,
            name: m.name,
            satisfied: isSatisfied,
            needsRePresent: needsRep,
            rePresentRemarks: m.rePresentRemarks || '',
          };
        })
      );
    }
  }, [rePresentTargetBatch, isRePresentModalOpen]);

  if (!isRePresentModalOpen || !rePresentTargetBatch) return null;

  const handleToggleMemberState = (id: string, satisfied: boolean) => {
    setMemberStatuses((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              satisfied,
              needsRePresent: !satisfied,
            }
          : m
      )
    );
  };

  const handleMemberRemarkChange = (id: string, remark: string) => {
    setMemberStatuses((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rePresentRemarks: remark } : m))
    );
  };

  const handleSetAll = (allSatisfied: boolean) => {
    setMemberStatuses((prev) =>
      prev.map((m) => ({
        ...m,
        satisfied: allSatisfied,
        needsRePresent: !allSatisfied,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!seminarTopic.trim()) {
      setError('Please enter the Seminar Topic assigned for re-presentation.');
      return;
    }

    const hasAtLeastOneRePresent = memberStatuses.some((m) => m.needsRePresent);
    if (!hasAtLeastOneRePresent) {
      setError('Please select at least one student who is required to re-present the seminar topic.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMembers: BatchMember[] = rePresentTargetBatch.members.map((m) => {
        const status = memberStatuses.find((ms) => ms.id === m.id || ms.rollNo === m.rollNo);
        return {
          ...m,
          satisfied: status ? status.satisfied : false,
          needsRePresent: status ? status.needsRePresent : true,
          rePresentRemarks: status ? status.rePresentRemarks.trim() : undefined,
        };
      });

      await confirmBatchRePresent(rePresentTargetBatch.id, {
        rePresentTopic: seminarTopic.trim(),
        members: updatedMembers,
        trainerNotes: trainerNotes.trim(),
      });

      setIsRePresentModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save re-presentation details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rePresentCount = memberStatuses.filter((m) => m.needsRePresent).length;
  const satisfiedCount = memberStatuses.filter((m) => m.satisfied).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-purple-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                  Batch {rePresentTargetBatch.batchNumber}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Schedule Re-Presentation
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Original Topic: <span className="font-semibold text-slate-700">{rePresentTargetBatch.topic}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRePresentModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Common Seminar Topic */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Seminar Topic for Re-Presentation <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-purple-700 font-medium bg-purple-100/80 px-2 py-0.5 rounded-md">
                Assigned to all team members
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This seminar topic is assigned to the whole batch. Students who must re-present will present this specific topic.
            </p>
            <input
              type="text"
              placeholder="e.g. Explain Attention Mechanism and Transformer Architecture in Detail"
              value={seminarTopic}
              onChange={(e) => setSeminarTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
              required
            />
          </div>

          {/* 2. Member Satisfaction Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Team Member Evaluation &amp; Re-Presentation Requirements
                </label>
                <p className="text-[11px] text-slate-500">
                  Select who you are satisfied with (cleared) vs who must re-present the seminar topic.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSetAll(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                >
                  All Must Re-Present
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                >
                  All Satisfied
                </button>
              </div>
            </div>

            {/* Summary Count Pill */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <strong>{rePresentCount}</strong> must re-present
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <strong>{satisfiedCount}</strong> satisfied / cleared
              </span>
            </div>

            {/* Member Cards List */}
            <div className="space-y-2.5">
              {memberStatuses.map((member) => (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    member.needsRePresent
                      ? 'bg-purple-50/40 border-purple-200 shadow-2xs'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-900 font-extrabold flex items-center justify-center text-xs shadow-2xs">
                        {member.rollNo.slice(-3) || member.rollNo}
                      </span>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>Roll No: {member.rollNo}</span>
                          {member.name && (
                            <span className="text-[11px] font-semibold text-slate-600">
                              ({member.name})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {member.needsRePresent
                            ? 'Required to present the seminar topic'
                            : 'Cleared from re-presentation'}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Buttons: Satisfied vs Must Re-Present */}
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMemberState(member.id, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          member.satisfied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Satisfied (Cleared)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleMemberState(member.id, false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          member.needsRePresent
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Must Re-Present</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual Remark Input */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 shrink-0">Remark / Focus:</span>
                    <input
                      type="text"
                      placeholder={
                        member.needsRePresent
                          ? 'e.g. Needs to explain architecture & slide 4 properly'
                          : 'e.g. Good answers in Q&A, exempted'
                      }
                      value={member.rePresentRemarks}
                      onChange={(e) => handleMemberRemarkChange(member.id, e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. General Notes / Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              General Notes for Re-Presentation (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Re-evaluation scheduled for next lab session. All slides must include working diagrams."
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsRePresentModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Confirm & Schedule Re-Present'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
