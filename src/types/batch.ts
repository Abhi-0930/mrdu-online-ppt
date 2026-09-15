export type PresentationStatus = 'Pending' | 'Presented' | 'Absent' | 'Rejected' | 'Re-Present';

export interface BatchMember {
  id: string;
  rollNo: string;
  name?: string;
  present: boolean;
  individualRemarks?: string;
  satisfied?: boolean;
  needsRePresent?: boolean;
  rePresentRemarks?: string;
}

export interface EvaluationScore {
  communication: number; // 1-10
  confidence: number; // 1-10
  contentQuality: number; // 1-10
  technicalUnderstanding: number; // 1-10
  teamCoordination: number; // 1-10
  totalScore: number; // Sum 5-50
  percentage: number; // (totalScore / 50) * 100
  grade: string; // 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'
  evaluatedAt?: string;
}

export interface StatusHistoryEntry {
  status: PresentationStatus;
  timestamp: string;
  notes?: string;
}

export interface Batch {
  id: string;
  batchNumber: number | string;
  topic: string;
  section?: 'AIML-E' | 'AIML-A';
  members: BatchMember[];
  pptLink?: string;
  pptFileName?: string;
  pptFileData?: string; // base64 / dataUrl or offline storage reference
  status: PresentationStatus;
  evaluation?: EvaluationScore;
  trainerNotes?: string;
  history?: StatusHistoryEntry[];
  createdDate: string;
  updatedDate: string;
  scheduledDate?: string;
  orderIndex?: number;
  rePresentTopic?: string;
  rePresentDate?: string;
}

export interface SessionLog {
  id: string;
  batchId: string;
  batchNumber: string | number;
  section?: 'AIML-E' | 'AIML-A';
  topic: string;
  status: PresentationStatus;
  score?: number;
  grade?: string;
  presentCount: number;
  totalMembers: number;
  timestamp: string;
  trainerNotes?: string;
}

export interface AppSettings {
  facultyName: string;
  subjectName: string;
  academicYear: string;
  soundEffects: boolean;
  confettiEnabled: boolean;
  rubricMaxScore: number;
  customSnippets: string[];
}

export interface TodayScheduleQueue {
  id: string;
  generatedDate: string;
  batchIds: string[];
  currentIndex: number;
}

export interface DashboardStats {
  totalBatches: number;
  completedBatches: number;
  pendingBatches: number;
  absentBatches: number;
  rejectedBatches: number;
  rePresentBatches: number;
  averageScore: number;
  completionRate: number;
  totalStudents: number;
  presentStudents: number;
  bestTeam?: { batchNumber: string | number; topic: string; score: number };
  lowestTeam?: { batchNumber: string | number; topic: string; score: number };
}

export const STATUS_CONFIG: Record<
  PresentationStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    badgeClass: string;
    dotColor: string;
  }
> = {
  Pending: {
    label: 'Pending',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
    dotColor: 'bg-slate-400',
  },
  Presented: {
    label: 'Presented',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  Absent: {
    label: 'Absent',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    dotColor: 'bg-amber-500',
  },
  Rejected: {
    label: 'Rejected',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300',
    dotColor: 'bg-rose-500',
  },
  'Re-Present': {
    label: 'Re-Present',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300',
    dotColor: 'bg-purple-500',
  },
};

export const DEFAULT_FEEDBACK_SNIPPETS = [
  'Good Content',
  'Need better communication',
  'Too much reading from slides',
  'Strong Q&A & Technical Answers',
  'Time limit exceeded',
  'Clear architecture & diagrams',
  'Excellent team coordination',
  'Great slide visual design',
  'Needs more in-depth practical examples',
  'Confident body language and delivery',
];

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}
