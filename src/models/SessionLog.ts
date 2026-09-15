import mongoose, { Schema, Document, Model } from 'mongoose';
import { PresentationStatus } from '@/types/batch';

export interface ISessionLog extends Document {
  id: string;
  batchId: string;
  batchNumber: string | number;
  section: 'AIML-E' | 'AIML-A';
  topic: string;
  status: PresentationStatus;
  score?: number;
  grade?: string;
  presentCount: number;
  totalMembers: number;
  timestamp: string;
  trainerNotes?: string;
}

const SessionLogSchema = new Schema<ISessionLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    batchId: { type: String, required: true, index: true },
    batchNumber: { type: Schema.Types.Mixed, required: true },
    section: {
      type: String,
      enum: ['AIML-E', 'AIML-A'],
      default: 'AIML-E',
      index: true,
    },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Presented', 'Absent', 'Rejected', 'Re-Present'],
      required: true,
    },
    score: { type: Number },
    grade: { type: String },
    presentCount: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    timestamp: { type: String, default: () => new Date().toISOString() },
    trainerNotes: { type: String },
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

export const SessionLogModel: Model<ISessionLog> =
  mongoose.models.SessionLog || mongoose.model<ISessionLog>('SessionLog', SessionLogSchema);

export default SessionLogModel;
