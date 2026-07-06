import { Challenge, IChallenge } from '../models/Challenge.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/response';
import { getDSAHint, getDSAExplanation } from '../utils/novita';

/** Returns today's date as YYYY-MM-DD in UTC */
const todayUTC = (): string => new Date().toISOString().slice(0, 10);

export class ChallengeService {
  /** Get today's challenges (without revealing correctOption) */
  async getToday(userId: string): Promise<{
    challenges: Array<{
      challenge: Partial<IChallenge>;
      alreadySubmitted: boolean;
      userAnswer?: string;
    }>;
    streak: number;
    longestStreak: number;
  }> {
    const date = todayUTC();
    const challenges = await Challenge.find({ date });
    if (!challenges || challenges.length === 0) {
      throw new AppError('No challenges available for today', 404);
    }

    const user = await User.findById(userId).select('streak longestStreak');

    const mapped = challenges.map((c) => {
      const existing = c.submissions.find(
        (s) => s.userId.toString() === userId
      );

      const safe: Partial<IChallenge> = {
        _id: c._id,
        date: c.date,
        topic: c.topic,
        difficulty: c.difficulty,
        title: c.title,
        question: c.question,
        code: c.code,
        options: c.options,
        totalAttempts: c.totalAttempts,
        totalCorrect: c.totalCorrect,
        ...(existing && {
          correctOption: c.correctOption,
          explanation: c.explanation,
        }),
      };

      return {
        challenge: safe,
        alreadySubmitted: !!existing,
        userAnswer: existing?.selectedOption,
      };
    });

    return {
      challenges: mapped,
      streak: user?.streak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
    };
  }

  /** Submit an answer — returns result + AI explanation */
  async submitAnswer(
    userId: string,
    challengeId: string,
    selectedOption: string
  ): Promise<{
    isCorrect: boolean;
    correctOption: string;
    explanation: string;
    aiExplanation: string;
    streak: number;
    longestStreak: number;
    streakUpdated: boolean;
  }> {
    const date = todayUTC();
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new AppError('Challenge not found', 404);

    // Prevent double submission
    const existing = challenge.submissions.find(
      (s) => s.userId.toString() === userId
    );
    if (existing) throw new AppError('You already submitted this challenge', 400);

    const isCorrect = selectedOption.toUpperCase() === challenge.correctOption.toUpperCase();

    // Save submission
    challenge.submissions.push({
      userId: userId as unknown as IChallenge['submissions'][0]['userId'],
      selectedOption: selectedOption.toUpperCase(),
      isCorrect,
      submittedAt: new Date(),
    });
    challenge.totalAttempts += 1;
    if (isCorrect) challenge.totalCorrect += 1;
    await challenge.save();

    // Update streak
    const user = await User.findById(userId).select('streak longestStreak lastChallengeDate');
    if (!user) throw new AppError('User not found', 404);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let streakUpdated = false;
    let newStreak = user.streak ?? 0;

    if (user.lastChallengeDate === yesterdayStr) {
      // Consecutive day
      newStreak += 1;
      streakUpdated = true;
    } else if (user.lastChallengeDate !== date) {
      // Either first ever or streak broken
      newStreak = 1;
      streakUpdated = true;
    }

    const newLongest = Math.max(user.longestStreak ?? 0, newStreak);

    await User.findByIdAndUpdate(userId, {
      streak: newStreak,
      longestStreak: newLongest,
      lastChallengeDate: date,
    });

    // Get AI explanation
    const correctOpt = challenge.options.find(
      (o) => o.label === challenge.correctOption
    );
    let aiExplanation = challenge.explanation;
    try {
      aiExplanation = await getDSAExplanation(
        challenge.question,
        challenge.code,
        challenge.options,
        challenge.correctOption,
        correctOpt?.text ?? '',
        selectedOption.toUpperCase(),
        isCorrect
      );
    } catch (_) {
      // Fallback to stored explanation if AI fails
    }

    return {
      isCorrect,
      correctOption: challenge.correctOption,
      explanation: challenge.explanation,
      aiExplanation,
      streak: newStreak,
      longestStreak: newLongest,
      streakUpdated,
    };
  }

  /** Get a progressive hint (1, 2, or 3) */
  async getHint(userId: string, challengeId: string, hintLevel: 1 | 2 | 3): Promise<{ hint: string }> {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new AppError('Challenge not found', 404);

    const alreadySubmitted = challenge.submissions.some(
      (s) => s.userId.toString() === userId
    );
    if (alreadySubmitted) throw new AppError('You already submitted — check the explanation instead', 400);

    const hint = await getDSAHint(
      challenge.question,
      challenge.code,
      challenge.correctOption,
      challenge.options,
      hintLevel
    );

    return { hint };
  }

  /** Get all past challenges the user has attempted */
  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const challenges = await Challenge.find({
      'submissions.userId': userId,
    })
      .select('date topic difficulty title correctOption submissions')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Challenge.countDocuments({ 'submissions.userId': userId });

    const items = challenges.map((c) => {
      const sub = c.submissions.find((s) => s.userId.toString() === userId);
      return {
        _id: c._id,
        date: c.date,
        topic: c.topic,
        difficulty: c.difficulty,
        title: c.title,
        selectedOption: sub?.selectedOption,
        isCorrect: sub?.isCorrect,
        correctOption: c.correctOption,
      };
    });

    return { items, total };
  }

  /** DSA learning path — structured topic list with progress */
  async getLearningPath(userId: string) {
    const topics = [
      { id: 'arrays', name: 'Arrays', icon: '📚', order: 1, description: 'Foundation of DSA — indexing, traversal, two pointers' },
      { id: 'strings', name: 'Strings', icon: '🔤', order: 2, description: 'Manipulation, pattern matching, sliding window' },
      { id: 'hashing', name: 'Hashing', icon: '🗂️', order: 3, description: 'HashMaps, HashSets, frequency counting' },
      { id: 'sorting', name: 'Sorting', icon: '🔢', order: 4, description: 'Bubble, merge, quick, counting sort' },
      { id: 'searching', name: 'Searching', icon: '🔍', order: 5, description: 'Binary search, ternary search patterns' },
      { id: 'recursion', name: 'Recursion', icon: '🌀', order: 6, description: 'Base cases, call stack, backtracking intro' },
      { id: 'linked-lists', name: 'Linked Lists', icon: '🔗', order: 7, description: 'Singly, doubly, fast/slow pointers' },
      { id: 'stacks-queues', name: 'Stacks & Queues', icon: '📦', order: 8, description: 'LIFO, FIFO, monotonic stack' },
      { id: 'trees', name: 'Trees', icon: '🌳', order: 9, description: 'BST, BFS, DFS, height, balance' },
      { id: 'graphs', name: 'Graphs', icon: '🕸️', order: 10, description: 'BFS, DFS, Dijkstra, cycle detection' },
      { id: 'greedy', name: 'Greedy', icon: '💡', order: 11, description: 'Activity selection, interval scheduling' },
      { id: 'dynamic-programming', name: 'Dynamic Programming', icon: '🧩', order: 12, description: 'Memoization, tabulation, classic patterns' },
      { id: 'bit-manipulation', name: 'Bit Manipulation', icon: '⚙️', order: 13, description: 'AND/OR/XOR, bit shifts, tricks' },
      { id: 'math', name: 'Math', icon: '🔢', order: 14, description: 'GCD, primes, modular arithmetic' },
    ];

    // Count how many challenges per topic the user solved correctly
    const challenges = await Challenge.find({ 'submissions.userId': userId }).select(
      'topic submissions'
    );

    const topicProgress: Record<string, { attempted: number; correct: number }> = {};
    for (const c of challenges) {
      const sub = c.submissions.find((s) => s.userId.toString() === userId);
      if (!sub) continue;
      if (!topicProgress[c.topic]) topicProgress[c.topic] = { attempted: 0, correct: 0 };
      topicProgress[c.topic].attempted += 1;
      if (sub.isCorrect) topicProgress[c.topic].correct += 1;
    }

    return topics.map((t) => ({
      ...t,
      attempted: topicProgress[t.id]?.attempted ?? 0,
      correct: topicProgress[t.id]?.correct ?? 0,
    }));
  }

  /** Get all challenges for study/practice */
  async getAll(): Promise<IChallenge[]> {
    return Challenge.find({}).sort({ date: 1 });
  }
}

export const challengeService = new ChallengeService();
