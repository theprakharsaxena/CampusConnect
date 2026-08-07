import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { getDefaultIsActiveForRole } from '../utils/permissions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

async function addBob() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    const email = 'bob.test@student.testcollege.edu';
    const exists = await User.findOne({ email });

    if (exists) {
      console.log('User Bob already exists.');
    } else {
      const hashedPassword = await hashPassword('Student@123');
      await User.create({
        name: 'Bob Student (TC)',
        email: email,
        password: hashedPassword,
        role: 'student',
        college: 'Test College',
        department: 'Computer Science',
        batch: '2024',
        semester: 4,
        rollNumber: '222222',
        bio: 'Test college student 2',
        isVerified: true,
        isActive: getDefaultIsActiveForRole('student'),
      });
      console.log('Successfully re-added Bob Student.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to add user:', error);
    process.exit(1);
  }
}

addBob();
