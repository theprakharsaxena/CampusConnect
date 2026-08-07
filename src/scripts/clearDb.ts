import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Post, Event, Opportunity, Connection, Conversation, Message, Challenge, Notification } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

async function clear() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for clean-up...');

    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Event.deleteMany({}),
      Opportunity.deleteMany({}),
      Connection.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Challenge.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Successfully deleted all collections and cleared all data.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to clear database:', error);
    process.exit(1);
  }
}

clear();
