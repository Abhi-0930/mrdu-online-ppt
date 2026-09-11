import * as XLSX from 'xlsx';
import { Batch, BatchMember, PresentationStatus } from '@/types/batch';

/**
 * Intelligent file parser supporting:
 * 1. Excel (.xlsx, .xls)
 * 2. CSV (.csv)
 * 3. JSON files (including students_data.json format)
 */
export async function parseExcelBatches(file: File): Promise<Batch[]> {
  const isJSON = file.name.endsWith('.json') || file.type === 'application/json';

  if (isJSON) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          const rawBatches = Array.isArray(parsed) ? parsed : parsed.batches || [];

          if (!Array.isArray(rawBatches) || rawBatches.length === 0) {
            throw new Error('No batches found in the uploaded JSON file.');
          }

          const now = new Date().toISOString();
          const results: Batch[] = rawBatches.map((item: any, idx: number) => {
            const batchNum = item.batch ?? item.batchNumber ?? item.batchNo ?? idx + 1;
            const topic = item.pptTitle ?? item.topic ?? item.title ?? 'Untitled Topic';
            const rawMembers = item.members || item.students || [];

            const members: BatchMember[] = Array.isArray(rawMembers)
              ? rawMembers.map((m: any, mIdx: number) => {
                  if (typeof m === 'object') {
                    return {
                      id: `m-${batchNum}-${mIdx}`,
                      rollNo: String(m.rollNo ?? m.roll ?? m.id ?? `M${mIdx + 1}`),
                      name: m.name ? String(m.name) : undefined,
                      present: m.present !== undefined ? Boolean(m.present) : true,
                    };
                  }
                  return {
                    id: `m-${batchNum}-${mIdx}`,
                    rollNo: String(m),
                    present: true,
                  };
                })
              : [];

            return {
              id: `batch-${batchNum}`,
              batchNumber: isNaN(Number(batchNum)) ? String(batchNum) : Number(batchNum),
              topic: String(topic),
              members: members.length > 0 ? members : [{ id: `m-${batchNum}-1`, rollNo: 'TBD', present: true }],
              pptLink: item.pptLink ? String(item.pptLink) : undefined,
              status: (item.status as PresentationStatus) || 'Pending',
              createdDate: item.createdDate || now,
              updatedDate: item.updatedDate || now,
            };
          });

          resolve(results);
        } catch (err: any) {
          reject(new Error(err.message || 'Failed to parse JSON file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read JSON file.'));
      reader.readAsText(file);
    });
  }

  // Excel / CSV Parsing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('The uploaded spreadsheet is empty.');
        }

        const batchesMap = new Map<string, Batch>();

        rawJson.forEach((row, index) => {
          // Normalize object keys to lowercase for flexible matching
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            normalized[key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
          });

          // Extract batch number
          const batchRaw =
            normalized['batchnumber'] ??
            normalized['batchno'] ??
            normalized['batch'] ??
            normalized['batchid'] ??
            normalized['teamno'] ??
            normalized['groupno'] ??
            `Batch ${index + 1}`;

          const batchNumber = String(batchRaw).trim();
          if (!batchNumber) return;

          // Extract topic
          const topic = String(
            normalized['topic'] ??
            normalized['ppttopic'] ??
            normalized['projecttitle'] ??
            normalized['presentationtopic'] ??
            normalized['title'] ??
            'Untitled Presentation'
          ).trim();

          // Extract PPT link
          const pptLink = String(
            normalized['pptlink'] ??
            normalized['ppturl'] ??
            normalized['drivelink'] ??
            normalized['presentationlink'] ??
            normalized['link'] ??
            ''
          ).trim();

          // Extract status if provided
          let status: PresentationStatus = 'Pending';
          const rawStatus = String(normalized['status'] ?? '').trim().toLowerCase();
          if (rawStatus.includes('present') && !rawStatus.includes('re')) status = 'Presented';
          else if (rawStatus.includes('absent')) status = 'Absent';
          else if (rawStatus.includes('reject')) status = 'Rejected';
          else if (rawStatus.includes('re-present') || rawStatus.includes('represent')) status = 'Re-Present';

          // Extract roll numbers and names
          const rollRaw = String(
            normalized['rollnumbers'] ??
            normalized['rollno'] ??
            normalized['roll'] ??
            normalized['members'] ??
            normalized['students'] ??
            normalized['usn'] ??
            ''
          ).trim();

          const nameRaw = String(
            normalized['membernames'] ??
            normalized['names'] ??
            normalized['studentnames'] ??
            normalized['name'] ??
            ''
          ).trim();

          if (batchesMap.has(batchNumber)) {
            const existing = batchesMap.get(batchNumber)!;
            if (rollRaw) {
              const newMembers = parseMembers(rollRaw, nameRaw, existing.members.length);
              existing.members.push(...newMembers);
            }
          } else {
            const members = parseMembers(rollRaw, nameRaw, 0);
            const now = new Date().toISOString();

            const newBatch: Batch = {
              id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              batchNumber: isNaN(Number(batchNumber)) ? batchNumber : Number(batchNumber),
              topic: topic || 'Untitled Topic',
              members: members.length > 0 ? members : [{ id: `m-${Date.now()}-1`, rollNo: 'TBD', name: 'Member 1', present: true }],
              pptLink: pptLink || undefined,
              status,
              createdDate: now,
              updatedDate: now,
            };

            batchesMap.set(batchNumber, newBatch);
          }
        });

        const batchesArray = Array.from(batchesMap.values());
        resolve(batchesArray);
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to parse file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function parseMembers(rollRaw: string, nameRaw: string, existingCount: number): BatchMember[] {
  if (!rollRaw && !nameRaw) return [];

  const rolls = rollRaw ? rollRaw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [];
  const names = nameRaw ? nameRaw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [];

  const maxLen = Math.max(rolls.length, names.length);
  const result: BatchMember[] = [];

  for (let i = 0; i < maxLen; i++) {
    const roll = rolls[i] || `M${existingCount + i + 1}`;
    const name = names[i] || undefined;
    result.push({
      id: `m-${Date.now()}-${existingCount + i}-${Math.random().toString(36).substring(2, 5)}`,
      rollNo: roll,
      name: name,
      present: true,
    });
  }

  return result;
}

export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Batch No': 1,
      'PPT Topic': 'AI in Transportation',
      'Roll Numbers': '368, 393, 384',
      'Member Names': 'Rithvika Reddy, Venkata Sai, Yedla Spandana',
      'PPT Link': 'https://drive.google.com/sample-deck-1',
      'Status': 'Pending',
    },
    {
      'Batch No': 2,
      'PPT Topic': 'What is Artificial Intelligence',
      'Roll Numbers': '379, 407, 416',
      'Member Names': 'Sai Shresta, Deevan Kumar, Harshith Chowdhary',
      'PPT Link': 'https://docs.google.com/presentation/sample-deck-2',
      'Status': 'Pending',
    },
    {
      'Batch No': 3,
      'PPT Topic': 'AI Image Generation',
      'Roll Numbers': '413, 424, 399',
      'Member Names': 'Srinivas, Vineeth, Ram Charan',
      'PPT Link': '',
      'Status': 'Pending',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 25 },
    { wch: 45 },
    { wch: 35 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches_Template');
  XLSX.writeFile(workbook, 'Classroom_Batches_Template.xlsx');
}

export function exportBatchesToExcel(batches: Batch[], subjectName = 'Classroom Presentations'): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Master Evaluation Summary
  const summaryData = batches.map((b) => {
    const presentCount = b.members.filter((m) => m.present).length;
    return {
      'Batch No': b.batchNumber,
      'Topic': b.topic,
      'Status': b.status,
      'Grade': b.evaluation?.grade || 'N/A',
      'Total Score (/50)': b.evaluation?.totalScore ?? 'N/A',
      'Percentage (%)': b.evaluation ? `${b.evaluation.percentage.toFixed(1)}%` : 'N/A',
      'Attendance': `${presentCount} / ${b.members.length} Present`,
      'Roll Numbers': b.members.map((m) => m.rollNo).join(', '),
      'Student Names': b.members.map((m) => m.name || m.rollNo).join(', '),
      'PPT Link': b.pptLink || '',
      'Trainer Notes': b.trainerNotes || '',
      'Evaluated At': b.evaluation?.evaluatedAt ? new Date(b.evaluation.evaluatedAt).toLocaleString() : '',
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 14 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 25 },
    { wch: 40 },
    { wch: 30 },
    { wch: 45 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Evaluation Summary');

  // Sheet 2: Detailed 5-Parameter Rubrics
  const rubricData = batches.map((b) => ({
    'Batch No': b.batchNumber,
    'Topic': b.topic,
    'Status': b.status,
    'Communication (/10)': b.evaluation?.communication ?? '-',
    'Confidence (/10)': b.evaluation?.confidence ?? '-',
    'Content Quality (/10)': b.evaluation?.contentQuality ?? '-',
    'Technical Understanding (/10)': b.evaluation?.technicalUnderstanding ?? '-',
    'Team Coordination (/10)': b.evaluation?.teamCoordination ?? '-',
    'Total Score (/50)': b.evaluation?.totalScore ?? '-',
    'Percentage': b.evaluation ? `${b.evaluation.percentage.toFixed(1)}%` : '-',
    'Grade': b.evaluation?.grade ?? '-',
  }));

  const rubricSheet = XLSX.utils.json_to_sheet(rubricData);
  rubricSheet['!cols'] = [
    { wch: 10 },
    { wch: 38 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 26 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(workbook, rubricSheet, 'Rubric Breakdown');

  // Sheet 3: Individual Student Attendance Register
  const rosterData: any[] = [];
  batches.forEach((b) => {
    b.members.forEach((m) => {
      rosterData.push({
        'Batch No': b.batchNumber,
        'Topic': b.topic,
        'Roll No': m.rollNo,
        'Student Name': m.name || '-',
        'Attendance': m.present ? 'Present ✅' : 'Absent ❌',
        'Batch Status': b.status,
        'Batch Grade': b.evaluation?.grade || 'N/A',
        'Batch Score (/50)': b.evaluation?.totalScore ?? 'N/A',
        'Individual Remarks': m.individualRemarks || '',
      });
    });
  });

  const rosterSheet = XLSX.utils.json_to_sheet(rosterData);
  rosterSheet['!cols'] = [
    { wch: 10 },
    { wch: 35 },
    { wch: 14 },
    { wch: 25 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, rosterSheet, 'Attendance Register');

  const safeSubjectName = subjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${safeSubjectName}_Evaluations_${dateStr}.xlsx`);
}
