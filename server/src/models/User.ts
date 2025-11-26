import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  avatar: string;
}

const UserSchema = new Schema<IUser>({
  googleId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  avatar: String,
});

export const User = mongoose.model<IUser>("User", UserSchema);
