import { NextResponse } from 'next/server';
import { getAllReports } from '@/lib/reports';

export async function GET() {
  const reports = getAllReports();
  return NextResponse.json({
    count: reports.length,
    reports: reports.map(r => ({ id: r.id, title: r.title }))
  });
}
