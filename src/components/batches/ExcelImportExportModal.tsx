'use client';

import React, { useState, useRef } from 'react';
import { useBatch } from '@/context/BatchContext';
import { Batch } from '@/types/batch';
import {
  parseExcelBatches,
  downloadSampleExcelTemplate,
  exportBatchesToExcel,
} from '@/services/excelService';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
} from 'lucide-react';

export const ExcelImportExportModal: React.FC = () => {
  const { isExcelModalOpen, setIsExcelModalOpen, batches, bulkImportBatches, settings } = useBatch();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsedBatches, setParsedBatches] = useState<Batch[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isExcelModalOpen) return null;

  const handleFileChange = async (file: File) => {
    setError('');
    setSuccessMessage('');
    setIsParsing(true);
    setFileName(file.name);

    try {
      const results = await parseExcelBatches(file);
      setParsedBatches(results);
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file.');
      setParsedBatches([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleConfirmImport = async () => {
    if (parsedBatches.length === 0) return;
    try {
      await bulkImportBatches(parsedBatches, importMode === 'replace');
      setSuccessMessage(
        `Successfully imported ${parsedBatches.length} batches (${importMode === 'replace' ? 'replaced existing' : 'merged'}).`
      );
      setTimeout(() => {
        setIsExcelModalOpen(false);
        setParsedBatches([]);
        setFileName('');
        setSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save imported batches.');
    }
  };

  const handleExport = () => {
    exportBatchesToExcel(batches, settings.subjectName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Excel Hub (Import &amp; Export)</h3>
              <p className="text-xs text-slate-500">Import student batches or export detailed evaluation reports</p>
            </div>
          </div>
          <button
            onClick={() => setIsExcelModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Section 1: Template & Export Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" /> Download Sample Template
                </span>
                <p className="text-[11px] text-slate-500">
                  Pre-formatted Excel template with columns for Batch No, Topic, Roll Numbers, and Links.
                </p>
              </div>
              <button
                onClick={downloadSampleExcelTemplate}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
              </button>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Class Reports
                </span>
                <p className="text-[11px] text-emerald-700">
                  Export master summary, 5-parameter rubric breakdown, and student attendance roster.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={batches.length === 0}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Export All Data ({batches.length} Batches)
              </button>
            </div>
          </div>

          {/* Section 2: Drag and drop import zone */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Upload Batch File (.xlsx, .xls, .csv, .json)
            </h4>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Click to select or drag and drop your Excel or JSON file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports XLSX, XLS, CSV, and students_data.json</p>
            </div>

            {isParsing && (
              <div className="p-3 text-center text-blue-600 font-semibold text-xs animate-pulse">
                Parsing spreadsheet batches...
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedBatches.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Ready to Import ({parsedBatches.length} Batches Found)
                  </span>

                  <div className="flex items-center gap-2 text-[11px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-blue-600"
                      />
                      <span>Merge with existing</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-blue-600"
                      />
                      <span>Replace all existing</span>
                    </label>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Batch</th>
                        <th className="py-2 px-3">Topic</th>
                        <th className="py-2 px-3">Roll Numbers</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {parsedBatches.slice(0, 15).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold text-slate-900">B{b.batchNumber}</td>
                          <td className="py-1.5 px-3 truncate max-w-[180px]">{b.topic}</td>
                          <td className="py-1.5 px-3">{b.members.map((m) => m.rollNo).join(', ')}</td>
                          <td className="py-1.5 px-3 font-semibold">{b.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import {parsedBatches.length} Batches Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
