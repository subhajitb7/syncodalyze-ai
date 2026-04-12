import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const generateNodeId = () => `SYN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const migrate = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');
    
    await mongoose.connect(uri);
    console.log('--- IDENTITY SYNCHRONIZATION INITIALIZED ---');

    const usersWithoutNodeId = await User.find({ nodeId: { $exists: false } });
    console.log(`Found ${usersWithoutNodeId.length} Identity Nodes requiring synchronization.`);

    for (const user of usersWithoutNodeId) {
      // Ensure uniqueness check for extra safety
      let isUnique = false;
      let newNodeId = '';
      while (!isUnique) {
        newNodeId = generateNodeId();
        const existing = await User.findOne({ nodeId: newNodeId });
        if (!existing) isUnique = true;
      }
      
      user.nodeId = newNodeId;
      await user.save();
      console.log(`[SYNCHRONIZED] Node: ${user.email} -> ${newNodeId}`);
    }

    console.log('--- ALL IDENTITY NODES FULLY SYNCHRONIZED ---');
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL SYNC FAILURE:', error);
    process.exit(1);
  }
};

migrate();
