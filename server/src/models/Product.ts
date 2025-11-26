import mongoose, { Schema, Document } from 'mongoose';
import { clothingCategories } from '../data/clothingData';
import { clothingPatterns } from '../data/clothingData';
import { clothingWeather } from '../data/clothingData';
import { clothingColors } from '../data/clothingData';
import { clothingStyles } from '../data/clothingData';
import { clothingFits } from '../data/clothingData';



const allTypes = Object.values(clothingCategories).flat();
const allCategories = Object.keys(clothingCategories);

export interface IProduct extends Document {
  user: mongoose.Types.ObjectId;  
  name: string;
  imageKey: string;
  category: string;    // e.g., "tops"
  type: string;        // e.g., "tshirt"
  color: string;
  pattern: string;
  style: [String];
  fit: string;
  temperature: [String];
  
}

const ProductSchema = new Schema<IProduct>(
{
      user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: { type: String, required: true },

    imageKey: { type: String, required: true },


    category: {
      type: String,
      required: true,
      enum: allCategories,
    },

    type: {
      type: String,
      required: true,
      enum: allTypes,
    },

    color: {
      type: String,
      required: true,
      enum: clothingColors
    },

    style: {
      type: [String],        // array of strings
      required: true,
      enum: clothingStyles   // each must be part of the style list
    },

    temperature: 
    {
      type: [String],
      required: true,
      enum: clothingWeather
    },
    
    fit: {
      type: String,
      required: true,
      enum: clothingFits
    },

    pattern: {
      type: String,
      required: true,
      enum: clothingPatterns
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
