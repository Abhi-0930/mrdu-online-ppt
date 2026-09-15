import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SettingsModel from '@/models/Settings';

const DEFAULT_SETTINGS = {
  facultyName: 'Faculty Member',
  subjectName: 'AI & Machine Learning Lab',
  academicYear: '2026-2027',
  soundEffects: true,
  confettiEnabled: true,
  rubricMaxScore: 10,
  customSnippets: [],
};

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SettingsModel.findOne({}).lean();

    if (!settings) {
      settings = await SettingsModel.create(DEFAULT_SETTINGS);
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('API Error in GET /api/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings from MongoDB' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const updated = await SettingsModel.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Error in PUT /api/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings in MongoDB' },
      { status: 500 }
    );
  }
}
