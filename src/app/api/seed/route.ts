import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BatchModel from '@/models/Batch';
import { ALL_INITIAL_BATCHES } from '@/services/sampleData';

export async function POST() {
  try {
    await connectToDatabase();
    await BatchModel.deleteMany({});
    await BatchModel.insertMany(ALL_INITIAL_BATCHES);

    const count = await BatchModel.countDocuments();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded MongoDB with ${count} batches (29 Section E + 29 Section A)`,
      count,
    });
  } catch (error: any) {
    console.error('API Error in POST /api/seed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed MongoDB' },
      { status: 500 }
    );
  }
}
