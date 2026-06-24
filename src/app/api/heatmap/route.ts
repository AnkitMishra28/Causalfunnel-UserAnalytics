import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const distinct = searchParams.get('distinct');

    // If requesting a list of unique pages
    if (distinct === 'true') {
      const pages = await Event.distinct('pageUrl');
      return NextResponse.json(pages);
    }

    const pageUrl = searchParams.get('pageUrl');
    if (!pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl query parameter is required' },
        { status: 400 }
      );
    }

    // Retrieve click events with coordinates for pageUrl
    const clicks = await Event.find(
      {
        eventType: 'click',
        pageUrl: pageUrl,
        clickX: { $ne: null },
        clickY: { $ne: null },
      },
      {
        clickX: 1,
        clickY: 1,
        _id: 0,
      }
    );

    // Map to heatmap.js coordinate format: { x, y, value }
    const points = clicks.map((click) => ({
      x: click.clickX,
      y: click.clickY,
      value: 1, // Density weight
    }));

    return NextResponse.json(points);
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch heatmap data:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
