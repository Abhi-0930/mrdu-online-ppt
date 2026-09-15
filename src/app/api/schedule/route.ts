import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ScheduleModel from '@/models/Schedule';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    const filter: any = section ? { section } : {};
    const schedule = await ScheduleModel.findOne(filter).sort({ generatedDate: -1 }).lean();

    return NextResponse.json({ success: true, data: schedule || null });
  } catch (error: any) {
    console.error('API Error in GET /api/schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schedule from MongoDB' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const id = body.id || `sched-${Date.now()}`;
    const schedule = await ScheduleModel.findOneAndUpdate(
      { section: body.section || 'AIML-E' },
      {
        $set: {
          id,
          section: body.section || 'AIML-E',
          batchIds: body.batchIds || [],
          currentIndex: body.currentIndex || 0,
          generatedDate: new Date().toISOString(),
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error('API Error in POST /api/schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save schedule in MongoDB' },
      { status: 500 }
    );
  }
}
