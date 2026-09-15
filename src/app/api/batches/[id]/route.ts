import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BatchModel from '@/models/Batch';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const batch = await BatchModel.findOne({ id }).lean();
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error: any) {
    console.error('API Error in GET /api/batches/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch batch from MongoDB' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await request.json();

    const updated = await BatchModel.findOneAndUpdate(
      { id },
      {
        $set: {
          ...body,
          updatedDate: new Date().toISOString(),
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Error in PUT /api/batches/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update batch in MongoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const result = await BatchModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error: any) {
    console.error('API Error in DELETE /api/batches/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete batch from MongoDB' },
      { status: 500 }
    );
  }
}
