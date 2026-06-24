import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';

// Schema for request validation
const eventSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  pageUrl: z.string().min(1, 'pageUrl is required'),
  timestamp: z.string().transform((val) => new Date(val)),
  clickX: z.number().nullable().optional(),
  clickY: z.number().nullable().optional(),
  userAgent: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate the input
    const validation = eventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validation.error.flatten() },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const eventData = validation.data;
    const newEvent = new Event(eventData);
    const savedEvent = await newEvent.save();

    return NextResponse.json(savedEvent, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Failed to store event:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Support preflight requests (CORS) if needed, although it's same-origin
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
