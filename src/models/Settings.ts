import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  facultyName: string;
  subjectName: string;
  academicYear: string;
  soundEffects: boolean;
  confettiEnabled: boolean;
  rubricMaxScore: number;
  customSnippets: string[];
}

const SettingsSchema = new Schema<ISettings>(
  {
    facultyName: { type: String, default: 'Faculty Member' },
    subjectName: { type: String, default: 'AI & Machine Learning Lab' },
    academicYear: { type: String, default: '2026-2027' },
    soundEffects: { type: Boolean, default: true },
    confettiEnabled: { type: Boolean, default: true },
    rubricMaxScore: { type: Number, default: 10 },
    customSnippets: { type: [String], default: [] },
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

export const SettingsModel: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default SettingsModel;
