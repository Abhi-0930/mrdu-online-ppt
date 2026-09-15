import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BatchModel from '@/models/Batch';
import { ALL_INITIAL_BATCHES, SAMPLE_BATCHES_AIML_A, SAMPLE_BATCHES_AIML_E } from '@/services/sampleData';
import { Batch } from '@/types/batch';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    const totalCount = await BatchModel.countDocuments();

    // If database is completely empty or missing either section, seed with real initial batches
    if (totalCount === 0) {
      await BatchModel.insertMany(ALL_INITIAL_BATCHES);
    } else {
      const hasSectionA = await BatchModel.exists({ section: 'AIML-A' });
      const hasSectionE = await BatchModel.exists({ section: 'AIML-E' });

      if (!hasSectionA) {
        await BatchModel.insertMany(SAMPLE_BATCHES_AIML_A);
      }
      if (!hasSectionE) {
        await BatchModel.insertMany(SAMPLE_BATCHES_AIML_E);
      }
    }

    const query: any = section ? { section } : {};
    const batches = await BatchModel.find(query).sort({ batchNumber: 1 }).lean();

    return NextResponse.json({ success: true, count: batches.length, data: batches });
  } catch (error: any) {
    console.error('API Error in GET /api/batches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch batches from MongoDB' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const id = body.id || `batch-${(body.section || 'aiml-e').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newBatch = await BatchModel.create({
      ...body,
      id,
      createdDate: body.createdDate || now,
      updatedDate: now,
    });

    return NextResponse.json({ success: true, data: newBatch }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in POST /api/batches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create batch in MongoDB' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action, section, batches, replaceExisting } = body;

    const now = new Date().toISOString();

    if (action === 'reset_all') {
      const filter: any = section ? { section } : {};
      await BatchModel.updateMany(filter, {
        $set: {
          status: 'Pending',
          evaluation: undefined,
          trainerNotes: '',
          history: [],
          updatedDate: now,
          'members.$[].present': true,
        },
      });

      const updatedBatches = await BatchModel.find(filter).lean();
      return NextResponse.json({ success: true, data: updatedBatches });
    }

    if (action === 'bulk_import' && Array.isArray(batches)) {
      if (replaceExisting) {
        const deleteFilter: any = section ? { section } : {};
        await BatchModel.deleteMany(deleteFilter);
        await BatchModel.insertMany(batches);
      } else {
        const operations = batches.map((b: Batch) => ({
          updateOne: {
            filter: { id: b.id },
            update: { $set: { ...b, updatedDate: now } },
            upsert: true,
          },
        }));
        await BatchModel.bulkWrite(operations);
      }

      const allUpdated = await BatchModel.find(section ? { section } : {}).lean();
      return NextResponse.json({ success: true, data: allUpdated });
    }

    if (action === 'seed') {
      await BatchModel.deleteMany({});
      await BatchModel.insertMany(ALL_INITIAL_BATCHES);
      const seeded = await BatchModel.find({}).lean();
      return NextResponse.json({ success: true, data: seeded });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error in PUT /api/batches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update batches in MongoDB' },
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
    await BatchModel.deleteMany(filter);

    return NextResponse.json({ success: true, message: 'Batches cleared successfully' });
  } catch (error: any) {
    console.error('API Error in DELETE /api/batches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear batches from MongoDB' },
      { status: 500 }
    );
  }
}
