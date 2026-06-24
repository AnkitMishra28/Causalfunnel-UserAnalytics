import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  sessionId: string;
  eventType: string;
  pageUrl: string;
  timestamp: Date;
  clickX?: number | null;
  clickY?: number | null;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
}

const EventSchema = new Schema<IEvent>(
  {
    sessionId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    pageUrl: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    clickX: {
      type: Number,
      default: null,
    },
    clickY: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
    },
    screenWidth: {
      type: Number,
    },
    screenHeight: {
      type: Number,
    },
  },
  {
    timestamps: false, // We use our own timestamp
  }
);

// Create indexes
EventSchema.index({ sessionId: 1 });
EventSchema.index({ pageUrl: 1 });
EventSchema.index({ timestamp: 1 });
EventSchema.index({ eventType: 1, pageUrl: 1 });

// Ensure we don't compile model multiple times in next.js hot reload
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
