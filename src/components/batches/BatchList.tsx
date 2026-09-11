'use client';

import React, { useState } from 'react';
import { useBatch } from '@/context/BatchContext';
import { BatchCard } from './BatchCard';
import {
  Plus,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Play,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react';
import { PresentationStatus, STATUS_CONFIG } from '@/types/batch';

export const BatchList: React.FC = () => {
  const {
    batches,
    filteredBatches,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    setIsBatchModalOpen,
    setEditingBatch,
    setIsExcelModalOpen,
    resetAllStatuses,
    startPresentationWithBatch,
    deleteBatch,
  } = useBatch();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const statusFilters: { id: PresentationStatus | 'All'; label: string; count: number }[] = [
    { id: 'All', label: 'All Batches', count: batches.length },
    { id: 'Pending', label: 'Pending', count: batches.filter((b) => b.status === 'Pending').length },
    { id: 'Presented', label: 'Presented', count: batches.filter((b) => b.status === 'Presented').length },
    { id: 'Absent', label: 'Absent', count: batches.filter((b) => b.status === 'Absent').length },
    { id: 'Rejected', label: 'Rejected', count: batches.filter((b) => b.status === 'Rejected').length },
    { id: 'Re-Present', label: 'Re-Present', count: batches.filter((b) => b.status === 'Re-Present').length },
  ];

  const handleResetStatuses = async () => {
    if (confirm('Reset presentation status for ALL batches back to "Pending"? Scores and notes will be reset.')) {
      await resetAllStatuses();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Batch Directory</h2>
          <p className="text-xs text-slate-500">
            Manage student presentation teams, track evaluation states, and update roster
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetStatuses}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Reset all batch statuses to Pending"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset All Statuses</span>
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel / Export</span>
          </button>

          <button
            onClick={() => {
              setEditingBatch(null);
              setIsBatchModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {statusFilters.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, and View Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Roll Number, Topic, or Batch #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="batchNumber">Batch Number</option>
                <option value="score">Highest Score</option>
                <option value="status">Status</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Content: Grid or Table */}
      {filteredBatches.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Roll Numbers</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBatches.map((batch) => {
                    const statusCfg = STATUS_CONFIG[batch.status as PresentationStatus] || STATUS_CONFIG.Pending;
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                            B{batch.batchNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                          {batch.topic}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {batch.members.map((m) => m.rollNo).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.badgeClass}`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {batch.evaluation ? (
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {batch.evaluation.totalScore}/50 ({batch.evaluation.grade})
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingBatch(batch);
                                setIsBatchModalOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBatch(batch.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => startPresentationWithBatch(batch)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] shadow-xs inline-flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Present
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Search className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800 text-sm">No Batches Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'All'
              ? 'No batches match your current search query or filter criteria.'
              : 'Your classroom directory is empty. Add your first batch or import an Excel spreadsheet.'}
          </p>
          {(searchQuery || filterStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('All');
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
