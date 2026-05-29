import express from 'express';
import productRoutes from '../src/routes/productRoutes';
import outfitRoutes from '../src/routes/outfitRoutes';
import calendarRoutes from '../src/routes/calendarRoutes';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use('/api/outfits', outfitRoutes);
  app.use('/api/calendar', calendarRoutes);
  return app;
}
