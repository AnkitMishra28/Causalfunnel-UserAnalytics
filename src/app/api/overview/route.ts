import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET() {
  try {
    await connectToDatabase();

    // Run queries in parallel for high performance
    const [totalEvents, sessionsList, totalClicks, sessionsTrend, eventsDistribution] =
      await Promise.all([
        Event.countDocuments({}),
        Event.distinct('sessionId'),
        Event.countDocuments({ eventType: 'click' }),
        
        // Sessions trend (distinct sessions per day for the last 30 days)
        Event.aggregate([
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                sessionId: '$sessionId',
              },
            },
          },
          {
            $group: {
              _id: '$_id.date',
              sessions: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $limit: 30, // Get last 30 days of data
          },
          {
            $project: {
              _id: 0,
              date: '$_id',
              sessions: 1,
            },
          },
        ]),

        // Events distribution by type (for pie chart / list)
        Event.aggregate([
          {
            $group: {
              _id: '$eventType',
              value: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              name: '$_id',
              value: 1,
            },
          },
        ]),
      ]);

    const totalSessions = sessionsList.length;

    return NextResponse.json({
      totalSessions,
      totalEvents,
      totalClicks,
      sessionsTrend,
      eventsDistribution,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch overview metrics:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
