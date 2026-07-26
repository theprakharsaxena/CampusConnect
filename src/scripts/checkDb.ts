import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Post, Event } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log('--- USERS ---');
  const users = await User.find({});
  for (const u of users) {
    console.log(`User: ${u.name} | Email: ${u.email} | College: ${u.college}`);
  }
  
  console.log('--- POSTS ---');
  const posts = await Post.find({});
  for (const p of posts) {
    console.log(`Post ID: ${p._id} | Author: ${p.author} | College: ${p.college}`);
  }

  console.log('--- EVENTS ---');
  const events = await Event.find({});
  for (const e of events) {
    console.log(`Event: ${e.title} | College: ${e.college}`);
  }

  await mongoose.disconnect();
}

check();
