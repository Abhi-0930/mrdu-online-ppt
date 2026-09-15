import mongoose, { Schema, Document, Model } from 'mongoose';
import { PresentationStatus } from '@/types/batch';

export interface IBatchMember {
  id: string;
  rollNo: string;
  name?: string;
  present: boolean;
  individualRemarks?: string;
}

export interface IEvaluationScore {
  communication: number;
  confidence: number;
  contentQuality: number;
  technicalUnderstanding: number;
  teamCoordination: number;
  totalScore: number;
  percentage: number;
  grade: string;
  evaluatedAt?: string;
}

export interface IStatusHistoryEntry {
  status: PresentationStatus;
  timestamp: string;
  notes?: string;
}

export interface IBatch extends Document {
  id: string;
  batchNumber: number | string;
  topic: string;
  section: 'AIML-E' | 'AIML-A';
  members: IBatchMember[];
  pptLink?: string;
  pptFileName?: string;
  pptFileData?: string;
  status: PresentationStatus;
  evaluation?: IEvaluationScore;
  trainerNotes?: string;
  history?: IStatusHistoryEntry[];
  createdDate: string;
  updatedDate: string;
  scheduledDate?: string;
  orderIndex?: number;
}

const BatchMemberSchema = new Schema<IBatchMember>(
  {
    id: { type: String, required: true },
    rollNo: { type: String, required: true },
    name: { type: String },
    present: { type: Boolean, default: true },
    individualRemarks: { type: String },
  },
  { _id: false }
);

const EvaluationScoreSchema = new Schema<IEvaluationScore>(
  {
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    contentQuality: { type: Number, default: 0 },
    technicalUnderstanding: { type: Number, default: 0 },
    teamCoordination: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: 'F' },
    evaluatedAt: { type: String },
  },
  { _id: false }
);

const StatusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['Pending', 'Presented', 'Absent', 'Rejected', 'Re-Present'],
      required: true,
    },
    timestamp: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const BatchSchema = new Schema<IBatch>(
  {
    id: { type: String, required: true, unique: true, index: true },
    batchNumber: { type: Schema.Types.Mixed, required: true },
    topic: { type: String, required: true },
    section: {
      type: String,
      enum: ['AIML-E', 'AIML-A'],
      default: 'AIML-E',
      index: true,
    },
    members: { type: [BatchMemberSchema], default: [] },
    pptLink: { type: String },
    pptFileName: { type: String },
    pptFileData: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Presented', 'Absent', 'Rejected', 'Re-Present'],
      default: 'Pending',
      index: true,
    },
    evaluation: { type: EvaluationScoreSchema },
    trainerNotes: { type: String, default: '' },
    history: { type: [StatusHistoryEntrySchema], default: [] },
    createdDate: { type: String, default: () => new Date().toISOString() },
    updatedDate: { type: String, default: () => new Date().toISOString() },
    scheduledDate: { type: String },
    orderIndex: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const BatchModel: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);

export default BatchModel;
