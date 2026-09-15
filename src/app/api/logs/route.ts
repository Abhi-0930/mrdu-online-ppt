import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SessionLogModel from '@/models/SessionLog';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    const filter: any = section ? { section } : {};
    const logs = await SessionLogModel.find(filter).sort({ timestamp: -1 }).limit(200).lean();

    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    console.error('API Error in GET /api/logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch session logs from MongoDB' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const id = body.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const log = await SessionLogModel.create({
      ...body,
      id,
      timestamp: body.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in POST /api/logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save session log in MongoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    const filter: any = section ? { section } : {};
    await SessionLogModel.deleteMany(filter);

    return NextResponse.json({ success: true, message: 'Session logs cleared successfully' });
  } catch (error: any) {
    console.error('API Error in DELETE /api/logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear session logs from MongoDB' },
      { status: 500 }
    );
  }
}
