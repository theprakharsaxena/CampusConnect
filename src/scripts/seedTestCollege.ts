import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { getDefaultIsActiveForRole } from '../utils/permissions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

const testCollegeUsers = [
  {
    name: 'Alice Student',
    email: 'alice.test@student.testcollege.edu',
    password: 'Student@123',
    role: 'student' as const,
    college: 'Test College',
    department: 'Computer Science',
    batch: '2024',
    semester: 4,
    rollNumber: '111111',
    bio: 'Test college student 1',
    isVerified: true,
  },
  {
    name: 'Bob Student',
    email: 'bob.test@student.testcollege.edu',
    password: 'Student@123',
    role: 'student' as const,
    college: 'Test College',
    department: 'Computer Science',
    batch: '2024',
    semester: 4,
    rollNumber: '222222',
    bio: 'Test college student 2',
    isVerified: true,
  },
  {
    name: 'Carol Alumni',
    email: 'carol.test@alumni.testcollege.edu',
    password: 'Alumni@123',
    role: 'alumni' as const,
    college: 'Test College',
    department: 'Computer Science',
    batch: '2020',
    rollNumber: '333333',
    bio: 'Test college alumni',
    isVerified: true,
  },
  {
    name: 'Sarah HOD',
    email: 'sarah.test@hod.testcollege.edu',
    password: 'Teacher@123',
    role: 'hod' as const,
    college: 'Test College',
    department: 'Computer Science',
    bio: 'HOD of Test College',
    isVerified: true,
  },
  {
    name: 'Michael Teacher',
    email: 'michael.test@teacher.testcollege.edu',
    password: 'Teacher@123',
    role: 'teacher' as const,
    college: 'Test College',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    bio: 'Test college teacher',
    isVerified: true,
  },
  {
    name: 'Developer Test',
    email: 'developer.test@testcollege.edu',
    password: 'Developer@12345',
    role: 'developer' as const,
    college: 'Test College',
    department: 'Administration',
    bio: 'Developer for Test College',
    isVerified: true,
  },
];

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const u of testCollegeUsers) {
      // Delete existing test user if present
      await User.deleteOne({ email: u.email.toLowerCase(), college: u.college });
      
      const hashedPassword = await hashPassword(u.password);
      await User.create({
        ...u,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        isActive: getDefaultIsActiveForRole(u.role),
      });
      console.log(`Created user: ${u.name} (${u.role})`);
    }

    console.log('Test College accounts seeded successfully.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
