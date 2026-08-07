import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Post, Opportunity, Event, Connection } from '../models';
import { hashPassword } from '../utils/password';
import { getDefaultIsActiveForRole } from '../utils/permissions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

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

async function seedTestCollegeOnly() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Test College reset...');

    // 1. Delete all Test College records
    // Get all user IDs of Test College first so we can remove their connections
    const testCollegeUsers = await User.find({ college: 'Test College' });
    const tcUserIds = testCollegeUsers.map(u => u._id);

    await Promise.all([
      User.deleteMany({ college: 'Test College' }),
      Post.deleteMany({ college: 'Test College' }),
      Opportunity.deleteMany({ college: 'Test College' }),
      Event.deleteMany({ college: 'Test College' }),
      Connection.deleteMany({
        $or: [
          { sender: { $in: tcUserIds } },
          { receiver: { $in: tcUserIds } }
        ]
      }),
    ]);
    console.log('Successfully cleared all existing Test College data.');

    // 2. Re-seed Test College Users
    const hashedTcUsers = await Promise.all(
      tcUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
        isActive: getDefaultIsActiveForRole(user.role),
      }))
    );
    const createdTcUsers = await User.insertMany(hashedTcUsers);
    console.log(`Re-created ${createdTcUsers.length} Test College users.`);

    const [tcDeveloper, tcHod, tcTeacher, tcAlice, tcBob, tcCarol] = createdTcUsers;

    // 3. Re-seed demo Posts strictly in Test College
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

    // 4. Re-seed demo Opportunities strictly in Test College
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

    // 5. Re-seed demo Events strictly in Test College
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

    // 6. Re-seed connections for Test College
    await Connection.insertMany([
      {
        sender: tcAlice._id,
        receiver: tcBob._id,
        status: 'accepted',
      },
    ]);

    console.log('Successfully re-created all Test College data.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to reset Test College data:', error);
    process.exit(1);
  }
}

seedTestCollegeOnly();
