import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET() {
  try {
    await connectToDatabase();

    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          eventCount: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          eventCount: 1,
          firstSeen: 1,
          lastSeen: 1,
        },
      },
      {
        $sort: { lastSeen: -1 }, // Sort by most recent activity
      },
    ]);

    return NextResponse.json(sessions);
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch sessions:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
