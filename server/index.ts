import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://mongo:27017/mydb';

app.use(express.json());

// serve client static build if present
// app.use('/client', express.static(path.join(__dirname, '../client/dist')));

app.get('/health', (_req, res) => res.json({ ok: true }));

// example route
app.get('/', (_req, res) => {
  res.send('Hello from server');
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB', MONGO_URI);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
}

start();
