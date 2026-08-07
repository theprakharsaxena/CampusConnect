import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Post, Opportunity, Event, Connection } from '../models';
import { hashPassword } from '../utils/password';
import { getDefaultIsActiveForRole } from '../utils/permissions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

// --- BAREILLY COLLEGE DATA (Only the two specific accounts) ---
const bcUsers = [
  {
    name: 'Developer BC',
    email: 'prakharsaxena5125@gmail.com',
    password: 'Developer@12345',
    role: 'developer' as const,
    college: 'Bareilly College',
    department: 'Administration',
    bio: 'Platform developer for Bareilly College',
    isVerified: true,
  },
  {
    name: 'Dr. Sarah Johnson (BC)',
    email: 'romasaxena1234@gmail.com',
    password: 'Teacher@123',
    role: 'hod' as const,
    college: 'Bareilly College',
    department: 'Computer Science',
    designation: 'Head of Department',
    bio: 'HOD of Computer Science Department at Bareilly College',
    skills: ['Leadership', 'Research', 'Machine Learning'],
    isVerified: true,
  },
];

// --- TEST COLLEGE DATA (Contains all demo/raw accounts) ---
const tcUsers = [
  {
    name: 'Developer TC',
    email: 'developer.test@testcollege.edu',
    password: 'Developer@12345',
    role: 'developer' as const,
    college: 'Test College',
    department: 'Administration',
    bio: 'Developer for Test College',
    isVerified: true,
  },
  {
    name: 'Sarah HOD (TC)',
    email: 'sarah.test@hod.testcollege.edu',
    password: 'Teacher@123',
    role: 'hod' as const,
    college: 'Test College',
    department: 'Computer Science',
    bio: 'HOD of Test College Computer Science',
    isVerified: true,
  },
  {
    name: 'Michael Teacher (TC)',
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
    name: 'Alice Student (TC)',
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
    name: 'Bob Student (TC)',
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
    name: 'Carol Alumni (TC)',
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
];

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Opportunity.deleteMany({}),
      Event.deleteMany({}),
      Connection.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // 1. Seed Bareilly College Users (Only 2)
    const hashedBcUsers = await Promise.all(
      bcUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
        isActive: getDefaultIsActiveForRole(user.role),
      }))
    );
    const createdBcUsers = await User.insertMany(hashedBcUsers);
    console.log(`Created ${createdBcUsers.length} Bareilly College users`);

    // 2. Seed Test College Users
    const hashedTcUsers = await Promise.all(
      tcUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
        isActive: getDefaultIsActiveForRole(user.role),
      }))
    );
    const createdTcUsers = await User.insertMany(hashedTcUsers);
    console.log(`Created ${createdTcUsers.length} Test College users`);

    const [tcDeveloper, tcHod, tcTeacher, tcAlice, tcBob, tcCarol] = createdTcUsers;

    // 3. Seed demo Posts strictly in Test College
    await Post.insertMany([
      {
        author: tcAlice._id,
        content: 'Hello Test College community! Exploring new React 19 architecture features. #react19 #testcollege',
        tags: ['react19', 'testcollege'],
        likesCount: 2,
        commentsCount: 0,
        status: 'approved',
        reviewedBy: tcHod._id,
        reviewedAt: new Date(),
        college: 'Test College',
      },
      {
        author: tcBob._id,
        content: 'Anyone preparing for the coding challenges in Test College?',
        tags: ['challenges', 'testcollege'],
        likesCount: 1,
        commentsCount: 0,
        status: 'approved',
        reviewedBy: tcTeacher._id,
        reviewedAt: new Date(),
        college: 'Test College',
      },
    ]);

    // 4. Seed demo Opportunities strictly in Test College
    await Opportunity.insertMany([
      {
        title: 'Product Design Intern',
        description: 'Internship opportunity for Test College students to work on mobile UI/UX.',
        company: 'Figma (TC Branch)',
        type: 'internship',
        skills: ['UI/UX', 'Figma', 'Prototyping'],
        applyLink: 'https://careers.figma.com',
        deadline: new Date('2026-08-15'),
        postedBy: tcCarol._id,
        status: 'approved',
        reviewedBy: tcDeveloper._id,
        reviewedAt: new Date(),
        college: 'Test College',
      },
    ]);

    // 5. Seed demo Events strictly in Test College
    await Event.insertMany([
      {
        title: 'Mobile App Workshop at Test College',
        description: 'Hands-on Flutter and mobile development workshop organized at Test College.',
        location: 'Lab 4, Computer Science Block',
        eventDate: new Date('2026-08-10T09:00:00Z'),
        organizer: tcTeacher._id,
        interestedCount: 15,
        goingCount: 20,
        status: 'approved',
        college: 'Test College',
      },
    ]);

    // 6. Seed connections for Test College
    await Connection.insertMany([
      {
        sender: tcAlice._id,
        receiver: tcBob._id,
        status: 'accepted',
      },
    ]);

    console.log('Created raw demo posts, opportunities, events, and connections for Test College.');
    console.log('Bareilly College remains clean and empty (only contains the 2 specific accounts).');

    console.log('\n--- Seed completed successfully ---');
    console.log('\nBareilly College Credentials:');
    bcUsers.forEach((u) => {
      console.log(`  ${u.role.padEnd(8)} | ${u.email} | ${u.password}`);
    });
    console.log('\nTest College Credentials:');
    tcUsers.forEach((u) => {
      console.log(`  ${u.role.padEnd(8)} | ${u.email} | ${u.password}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
