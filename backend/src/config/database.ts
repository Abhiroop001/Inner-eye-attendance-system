import mongoose from 'mongoose';
import { env } from './env.js';

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    const db = mongoose.connection.db;
    if (db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'supporting_documents_vault',
      });
    }

    console.log(`✅ MongoDB Connected to database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected. Cannot initialize GridFSBucket.');
    }
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'supporting_documents_vault',
    });
  }
  return gridFSBucket;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
