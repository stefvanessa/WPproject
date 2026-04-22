import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEntry extends Document {
  user: mongoose.Types.ObjectId;
  date: string;
  outfit?: mongoose.Types.ObjectId;
}

const CalendarEntrySchema = new Schema<ICalendarEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    outfit: { type: Schema.Types.ObjectId, ref: 'Outfit' },
  },
  { timestamps: true }
);

CalendarEntrySchema.index({ user: 1, date: 1 }, { unique: true });

export const CalendarEntry = mongoose.model<ICalendarEntry>('CalendarEntry', CalendarEntrySchema);
