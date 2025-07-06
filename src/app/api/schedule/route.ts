import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to your CSV file (adjust the path as needed)
    const csvPath = path.join(process.cwd(), 'data', 'jetblue_schedule062025.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'Schedule data not found' },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="jetblue-schedule.csv"',
      },
    });
  } catch (error) {
    console.error('Error serving CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 