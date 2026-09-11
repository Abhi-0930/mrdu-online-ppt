'use client';

import React from 'react';
import { useBatch } from '@/context/BatchContext';
import {
  BarChart3,
  Award,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { batches, stats, startPresentationWithBatch } = useBatch();

  const evaluatedBatches = batches.filter((b) => b.evaluation !== undefined);

  // Compute Rubric Averages
  let avgComm = 0;
  let avgConf = 0;
  let avgContent = 0;
  let avgTech = 0;
  let avgTeam = 0;

  if (evaluatedBatches.length > 0) {
    evaluatedBatches.forEach((b) => {
      if (b.evaluation) {
        avgComm += b.evaluation.communication;
        avgConf += b.evaluation.confidence;
        avgContent += b.evaluation.contentQuality;
        avgTech += b.evaluation.technicalUnderstanding;
        avgTeam += b.evaluation.teamCoordination;
      }
    });

    const len = evaluatedBatches.length;
    avgComm = Number((avgComm / len).toFixed(1));
    avgConf = Number((avgConf / len).toFixed(1));
    avgContent = Number((avgContent / len).toFixed(1));
    avgTech = Number((avgTech / len).toFixed(1));
    avgTeam = Number((avgTeam / len).toFixed(1));
  }

  // Grade Distribution Counts
  const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
  evaluatedBatches.forEach((b) => {
    if (b.evaluation?.grade && gradeCounts[b.evaluation.grade] !== undefined) {
      gradeCounts[b.evaluation.grade]++;
    }
  });

  // Top 3 Leaderboard
  const sortedByScore = [...evaluatedBatches].sort(
    (a, b) => (b.evaluation?.totalScore || 0) - (a.evaluation?.totalScore || 0)
  );
  const topTeams = sortedByScore.slice(0, 3);

  if (batches.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          📊
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Analytics Data Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add your student batches and conduct live evaluations to unlock class performance charts and rubric insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" /> Class Performance &amp; Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Aggregated rubrics analysis, parameter strengths, and grade distributions
        </p>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Evaluated Teams</div>
          <div className="text-2xl font-bold text-slate-900">
            {evaluatedBatches.length} / {batches.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.completionRate}% of class scored</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Class Average Score</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageScore > 0 ? `${stats.averageScore}/50` : '—'}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1">
            {stats.averageScore > 0 ? `${((stats.averageScore / 50) * 100).toFixed(0)}% overall average` : 'No scores'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Highest Score Awarded</div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats.bestTeam ? `${stats.bestTeam.score}/50` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.bestTeam ? `Batch ${stats.bestTeam.batchNumber}` : 'None yet'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Student Attendance Rate</div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalStudents > 0
              ? `${Math.round((stats.presentStudents / stats.totalStudents) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.presentStudents} of {stats.totalStudents} students present
          </div>
        </div>
      </div>

      {/* Main Analysis: Rubric Parameters & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rubric Parameter Breakdown Bars */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Rubric Parameter Averages
            </h3>
            <p className="text-xs text-slate-500">Class average scored across each 10-point parameter</p>
          </div>

          <div className="space-y-4 pt-2 text-xs">
            <ParameterBar label="Communication & Articulation" avg={avgComm} color="bg-blue-600" />
            <ParameterBar label="Confidence & Body Language" avg={avgConf} color="bg-indigo-600" />
            <ParameterBar label="Content Quality & Slide Design" avg={avgContent} color="bg-emerald-600" />
            <ParameterBar label="Technical Understanding & Q&A" avg={avgTech} color="bg-cyan-600" />
            <ParameterBar label="Team Coordination & Equity" avg={avgTeam} color="bg-purple-600" />
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> Grade Distribution
            </h3>
            <p className="text-xs text-slate-500">Distribution of calculated letter grades across evaluated teams</p>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4">
            {Object.entries(gradeCounts).map(([grade, count]) => {
              const maxCount = Math.max(...Object.values(gradeCounts), 1);
              const heightPct = Math.round((count / maxCount) * 100);
              return (
                <div key={grade} className="flex flex-col items-center justify-end space-y-2 h-44">
                  <span className="text-[11px] font-bold text-slate-700">{count}</span>
                  <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end justify-center p-1">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        grade.startsWith('A')
                          ? 'bg-emerald-500'
                          : grade.startsWith('B')
                          ? 'bg-blue-500'
                          : grade === 'C'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ height: `${heightPct > 0 ? heightPct : 6}%` }}
                    />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800">{grade}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Teams Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Top Performing Teams Leaderboard
        </h3>

        {topTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topTeams.map((batch, index) => {
              const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              return (
                <div
                  key={batch.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{medals[index]}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                        {batch.evaluation?.grade}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Batch {batch.batchNumber}: {batch.topic}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Members: {batch.members.map((m) => m.rollNo).join(', ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 text-sm">
                      {batch.evaluation?.totalScore}/50 Points
                    </span>
                    <button
                      onClick={() => startPresentationWithBatch(batch)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 font-bold rounded-lg text-slate-700 shadow-2xs"
                    >
                      View Sheet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No teams scored yet. Top performers will appear here after evaluations.
          </p>
        )}
      </div>
    </div>
  );
};

const ParameterBar: React.FC<{ label: string; avg: number; color: string }> = ({ label, avg, color }) => {
  const pct = Math.round((avg / 10) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-semibold text-slate-700">
        <span>{label}</span>
        <span className="font-mono font-bold text-slate-900">{avg > 0 ? `${avg}/10` : '—'}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
