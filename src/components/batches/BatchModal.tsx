'use client';

import React, { useState, useEffect } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch, BatchMember, PresentationStatus } from '@/types/batch';
import { X, Plus, Trash2, Link as LinkIcon, Upload, Users } from 'lucide-react';

export const BatchModal: React.FC = () => {
  const { isBatchModalOpen, setIsBatchModalOpen, editingBatch, addBatch, updateBatch } = useBatch();

  const [batchNumber, setBatchNumber] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [pptLink, setPptLink] = useState<string>('');
  const [status, setStatus] = useState<PresentationStatus>('Pending');
  const [members, setMembers] = useState<{ id: string; rollNo: string; name: string }[]>([
    { id: '1', rollNo: '', name: '' },
  ]);
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingBatch) {
      setBatchNumber(String(editingBatch.batchNumber));
      setTopic(editingBatch.topic);
      setPptLink(editingBatch.pptLink || '');
      setStatus(editingBatch.status);
      setMembers(
        editingBatch.members.map((m) => ({
          id: m.id,
          rollNo: m.rollNo,
          name: m.name || '',
        }))
      );
    } else {
      // Default empty form
      setBatchNumber('');
      setTopic('');
      setPptLink('');
      setStatus('Pending');
      setMembers([{ id: '1', rollNo: '', name: '' }]);
    }
    setError('');
  }, [editingBatch, isBatchModalOpen]);

  if (!isBatchModalOpen) return null;

  const handleAddMemberRow = () => {
    setMembers((prev) => [...prev, { id: `m-${Date.now()}-${prev.length}`, rollNo: '', name: '' }]);
  };

  const handleRemoveMemberRow = (id: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMemberChange = (id: string, field: 'rollNo' | 'name', value: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;
    // Split by comma, semicolon, space, or newline
    const items = quickPasteText.split(/[,;\n\t]+/).map((s) => s.trim()).filter(Boolean);
    if (items.length > 0) {
      const newMemberList = items.map((roll, idx) => ({
        id: `m-quick-${Date.now()}-${idx}`,
        rollNo: roll,
        name: '',
      }));
      setMembers(newMemberList);
      setQuickPasteText('');
      setIsQuickPasteOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!batchNumber.trim()) {
      setError('Batch Number is required.');
      return;
    }
    if (!topic.trim()) {
      setError('Presentation Topic is required.');
      return;
    }

    const validMembers: BatchMember[] = members
      .filter((m) => m.rollNo.trim() !== '')
      .map((m) => ({
        id: m.id,
        rollNo: m.rollNo.trim(),
        name: m.name.trim() || undefined,
        present: true,
      }));

    if (validMembers.length === 0) {
      setError('Please add at least one member with a Roll Number.');
      return;
    }

    try {
      const cleanBatchNum = isNaN(Number(batchNumber)) ? batchNumber.trim() : Number(batchNumber);

      if (editingBatch) {
        await updateBatch({
          ...editingBatch,
          batchNumber: cleanBatchNum,
          topic: topic.trim(),
          pptLink: pptLink.trim() || undefined,
          status,
          members: validMembers,
        });
      } else {
        await addBatch({
          batchNumber: cleanBatchNum,
          topic: topic.trim(),
          pptLink: pptLink.trim() || undefined,
          status,
          members: validMembers,
        });
      }

      setIsBatchModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save batch.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {editingBatch ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingBatch ? `Edit Batch ${editingBatch.batchNumber}` : 'Add New Presentation Batch'}
              </h3>
              <p className="text-xs text-slate-500">Configure team members, topic, and presentation links</p>
            </div>
          </div>
          <button
            onClick={() => setIsBatchModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Row 1: Batch Number & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 12 or B-12"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PresentationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
              >
                <option value="Pending">Pending</option>
                <option value="Presented">Presented</option>
                <option value="Absent">Absent</option>
                <option value="Rejected">Rejected</option>
                <option value="Re-Present">Re-Present</option>
              </select>
            </div>
          </div>

          {/* Row 2: Presentation Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Presentation Topic / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AI in Healthcare: Early Diabetes Prediction"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              required
            />
          </div>

          {/* Row 3: PPT URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              Presentation Link (Google Slides, PPT, Drive, GitHub)
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/presentation/..."
              value={pptLink}
              onChange={(e) => setPptLink(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Row 4: Team Members List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> Team Members &amp; Roll Numbers{' '}
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsQuickPasteOpen(!isQuickPasteOpen)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                {isQuickPasteOpen ? 'Cancel Paste' : '📋 Quick Paste Roll Numbers'}
              </button>
            </div>

            {/* Quick Paste Box */}
            {isQuickPasteOpen && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <p className="text-[11px] text-blue-900">
                  Paste comma or space separated roll numbers (e.g. <code>433, 405, 409, 417</code>):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="433, 405, 409, 417"
                    value={quickPasteText}
                    onChange={(e) => setQuickPasteText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Members Input Rows */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2">
                  <span className="w-5 text-center text-slate-400 font-mono text-[11px]">{index + 1}.</span>
                  <input
                    type="text"
                    placeholder="Roll No (e.g. 433)"
                    value={member.rollNo}
                    onChange={(e) => handleMemberChange(member.id, 'rollNo', e.target.value)}
                    className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-semibold"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Student Name (Optional)"
                    value={member.name}
                    onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberRow(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMemberRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Member
            </button>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              {editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
