import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import Review from '../models/Review.model.js';
import CodeFile from '../models/CodeFile.model.js';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const syncOrigins = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-review-db';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const files = await CodeFile.find({});
    console.log('Scanning ' + files.length + ' files for review links...');
    
    let updatedCount = 0;
    for (const file of files) {
      if (!file.versions) continue;
      const reviewIds = file.versions.map(v => v.reviewId).filter(id => id);
      
      if (reviewIds.length > 0) {
        // Find reviews that don't have a fileId yet but ARE linked to this file
        const result = await Review.updateMany(
          { _id: { $in: reviewIds }, fileId: { $exists: false } },
          { $set: { fileId: file._id } }
        );
        updatedCount += result.modifiedCount;
      }
    }

    console.log('SUCCESS: Retroactively tagged ' + updatedCount + ' project reviews.');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL_FAILURE:', err);
    process.exit(1);
  }
};

syncOrigins();
