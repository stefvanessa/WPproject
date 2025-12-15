import mongoose, { Schema, Document } from 'mongoose';

export interface IOutfit extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  top?: mongoose.Types.ObjectId;
  bottom?: mongoose.Types.ObjectId;
  dress?: mongoose.Types.ObjectId;
  outerwear?: mongoose.Types.ObjectId;
  shoes?: mongoose.Types.ObjectId;
}

const OutfitSchema = new Schema<IOutfit>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: '' },
    top: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    bottom: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    dress: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    outerwear: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    shoes: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  },
  { timestamps: true }
);

export const Outfit = mongoose.model<IOutfit>('Outfit', OutfitSchema);
