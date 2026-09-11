import rawDataE from '../../students_data.json';
import rawDataA from '../../students_aiml-a.json';
import { Batch } from '@/types/batch';

export const SAMPLE_BATCHES_AIML_E: Batch[] = (rawDataE.batches || []).map((item) => ({
  id: `batch-e-${item.batch}`,
  batchNumber: item.batch,
  section: 'AIML-E' as const,
  topic: item.pptTitle || 'Untitled Topic',
  members: (item.members || []).map((m, idx) => ({
    id: `m-e-${item.batch}-${idx}`,
    rollNo: String(m.rollNo),
    name: m.name || undefined,
    present: true,
  })),
  status: 'Pending',
  createdDate: new Date().toISOString(),
  updatedDate: new Date().toISOString(),
}));

const rawListA: any[] = Array.isArray(rawDataA) ? rawDataA : (rawDataA as any).batches || [];

export const SAMPLE_BATCHES_AIML_A: Batch[] = rawListA.map((item) => ({
  id: `batch-a-${item.batch}`,
  batchNumber: item.batch,
  section: 'AIML-A' as const,
  topic: item.pptTitle || 'Untitled Topic',
  members: (item.members || []).map((m: any, idx: number) => ({
    id: `m-a-${item.batch}-${idx}`,
    rollNo: String(m.rollNo),
    name: m.name || undefined,
    present: true,
  })),
  status: 'Pending',
  createdDate: new Date().toISOString(),
  updatedDate: new Date().toISOString(),
}));

export const ALL_INITIAL_BATCHES: Batch[] = [...SAMPLE_BATCHES_AIML_E, ...SAMPLE_BATCHES_AIML_A];

export const SAMPLE_BATCHES: Batch[] = SAMPLE_BATCHES_AIML_E;

export function getSectionDefaultBatches(section: 'AIML-E' | 'AIML-A'): Batch[] {
  return section === 'AIML-A' ? SAMPLE_BATCHES_AIML_A : SAMPLE_BATCHES_AIML_E;
}
