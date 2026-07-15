import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Post, Opportunity, Event, Connection } from '../models';
import { hashPassword } from '../utils/password';
import { getDefaultIsActiveForRole } from '../utils/permissions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

const demoUsers = [
  {
    name: 'Developer User',
    email: 'prakharsaxena5125@gmail.com',
    password: 'Developer@12345',
    role: 'developer' as const,
    department: 'Developeristration',
    bio: 'Platform developer',
    isVerified: true,
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'romasaxena1234@gmail.com',
    password: 'Teacher@123',
    role: 'hod' as const,
    department: 'Computer Science',
    designation: 'Head of Department',
    bio: 'HOD of Computer Science Department',
    skills: ['Leadership', 'Research', 'Machine Learning'],
    isVerified: true,
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@campusconnect.edu',
    password: 'Teacher@123',
    role: 'teacher' as const,
    department: 'Computer Science',
    designation: 'Associate Professor',
    bio: 'Teaching Data Structures and Algorithms',
    skills: ['Algorithms', 'Data Structures', 'Python'],
    isVerified: true,
  },
  {
    name: 'Alice Williams',
    email: 'alice.williams@student.campusconnect.edu',
    password: 'Student@123',
    role: 'student' as const,
    department: 'Computer Science',
    batch: '2024',
    bio: 'CS student passionate about web development',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    githubUrl: 'https://github.com/alicewilliams',
    isVerified: true,
  },
  {
    name: 'Bob Martinez',
    email: 'bob.martinez@student.campusconnect.edu',
    password: 'Student@123',
    role: 'student' as const,
    department: 'Computer Science',
    batch: '2023',
    bio: 'Final year student looking for internships',
    skills: ['Python', 'Machine Learning', 'TensorFlow'],
    isVerified: true,
  },
  {
    name: 'Carol Davis',
    email: 'carol.davis@alumni.campusconnect.edu',
    password: 'Alumni@123',
    role: 'alumni' as const,
    department: 'Computer Science',
    batch: '2020',
    company: 'Google',
    designation: 'Software Engineer',
    bio: 'CS alum working at Google, happy to help juniors',
    skills: ['System Design', 'Go', 'Kubernetes'],
    linkedinUrl: 'https://linkedin.com/in/caroldavis',
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

    const hashedUsers = await Promise.all(
      demoUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
        isActive: getDefaultIsActiveForRole(user.role),
      }))
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);

    const [developer, hod, teacher, alice, bob, carol] = createdUsers;

    await Post.insertMany([
      {
        author: alice._id,
        content: 'Just finished my final year project on campus networking! Excited to share it with everyone. #webdev #college',
        tags: ['webdev', 'college', 'project'],
        likesCount: 5,
        commentsCount: 2,
        status: 'approved',
        reviewedBy: hod._id,
        reviewedAt: new Date(),
      },
      {
        author: bob._id,
        content: 'Looking for study partners for the upcoming ML exam. Anyone interested?',
        tags: ['study', 'machinelearning'],
        likesCount: 3,
        commentsCount: 1,
        status: 'approved',
        reviewedBy: teacher._id,
        reviewedAt: new Date(),
      },
      {
        author: carol._id,
        content: 'Happy to announce I can refer CS students for internships at Google! DM me your resume.',
        tags: ['internship', 'referral', 'google'],
        likesCount: 15,
        commentsCount: 8,
        status: 'approved',
        reviewedBy: developer._id,
        reviewedAt: new Date(),
      },
      {
        author: alice._id,
        content: 'Has anyone tried the new React 19 features? Would love to discuss!',
        tags: ['react', 'frontend'],
        likesCount: 0,
        commentsCount: 0,
        status: 'pending',
      },
      {
        author: bob._id,
        content: 'Sharing my notes on system design patterns - link in comments',
        tags: ['systemdesign', 'notes'],
        likesCount: 0,
        commentsCount: 0,
        status: 'rejected',
        reviewedBy: teacher._id,
        reviewedAt: new Date(),
        rejectionReason: 'Please add the actual link in the post content instead of comments',
      },
    ]);
    console.log('Created demo posts');

    await Opportunity.insertMany([
      {
        title: 'Software Engineering Intern',
        description: 'Summer internship program for CS students. Work on real products with mentorship.',
        company: 'Google',
        type: 'internship',
        skills: ['Java', 'Python', 'Algorithms'],
        applyLink: 'https://careers.google.com',
        deadline: new Date('2026-08-01'),
        postedBy: carol._id,
        status: 'approved',
        reviewedBy: developer._id,
        reviewedAt: new Date(),
      },
      {
        title: 'Full Stack Developer',
        description: 'Join our startup as a full stack developer. Remote-friendly.',
        company: 'TechStartup Inc',
        type: 'job',
        skills: ['React', 'Node.js', 'MongoDB'],
        applyLink: 'https://techstartup.com/careers',
        deadline: new Date('2026-07-15'),
        postedBy: developer._id,
        status: 'approved',
      },
      {
        title: 'Hackathon 2026',
        description: 'Annual campus hackathon. 48 hours, amazing prizes!',
        company: 'CampusConnect',
        type: 'hackathon',
        skills: ['Any'],
        applyLink: 'https://campusconnect.edu/hackathon',
        deadline: new Date('2026-09-01'),
        postedBy: hod._id,
        status: 'approved',
      },
      {
        title: 'Data Science Intern - Pending Review',
        description: 'Exciting opportunity for students interested in data science.',
        company: 'DataCorp',
        type: 'internship',
        skills: ['Python', 'SQL', 'Pandas'],
        applyLink: 'https://datacorp.com/intern',
        deadline: new Date('2026-09-15'),
        postedBy: alice._id,
        status: 'pending',
      },
    ]);
    console.log('Created demo opportunities');

    await Event.insertMany([
      {
        title: 'Tech Talk: Future of AI',
        description: 'Industry expert talk on AI trends and career opportunities.',
        location: 'Auditorium A, Main Building',
        eventDate: new Date('2026-07-20T14:00:00Z'),
        organizer: teacher._id,
        interestedCount: 25,
        goingCount: 40,
        status: 'approved',
      },
      {
        title: 'Alumni Meetup 2026',
        description: 'Annual alumni reunion and networking event.',
        location: 'Campus Grounds',
        eventDate: new Date('2026-08-15T10:00:00Z'),
        organizer: hod._id,
        interestedCount: 50,
        goingCount: 30,
        status: 'approved',
      },
      {
        title: 'Study Group Meetup',
        description: 'Weekly study group for ML enthusiasts. Bring your laptops!',
        location: 'Library Room 3B',
        eventDate: new Date('2026-07-25T16:00:00Z'),
        organizer: bob._id,
        interestedCount: 0,
        goingCount: 0,
        status: 'pending',
      },
    ]);
    console.log('Created demo events');

    await Connection.insertMany([
      {
        sender: alice._id,
        receiver: bob._id,
        status: 'accepted',
      },
      {
        sender: bob._id,
        receiver: carol._id,
        status: 'pending',
      },
    ]);
    console.log('Created demo connections');

    console.log('\n--- Seed completed successfully ---');
    console.log('\nDemo credentials:');
    demoUsers.forEach((u) => {
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
