import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISchedule extends Document {
  id: string;
  section: 'AIML-E' | 'AIML-A';
  generatedDate: string;
  batchIds: string[];
  currentIndex: number;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    id: { type: String, required: true, unique: true, index: true },
    section: {
      type: String,
      enum: ['AIML-E', 'AIML-A'],
      default: 'AIML-E',
      index: true,
    },
    generatedDate: { type: String, default: () => new Date().toISOString() },
    batchIds: { type: [String], default: [] },
    currentIndex: { type: Number, default: 0 },
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

export const ScheduleModel: Model<ISchedule> =
  mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default ScheduleModel;
