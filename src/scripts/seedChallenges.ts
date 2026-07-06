import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Challenge } from '../models/Challenge.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

// 30 hand-crafted DSA challenges covering all topics
// Starting from today and going forward 30 days
const challengeData = [
  {
    topic: 'arrays',
    difficulty: 'easy',
    title: 'Find Maximum Element',
    question: 'What is the time complexity of finding the maximum element in an unsorted array of n elements?',
    options: [
      { label: 'A', text: 'O(1)' },
      { label: 'B', text: 'O(log n)' },
      { label: 'C', text: 'O(n)' },
      { label: 'D', text: 'O(n²)' },
    ],
    correctOption: 'C',
    explanation: 'We must visit every element at least once to determine the maximum, making it O(n). There is no shortcut for an unsorted array.',
  },
  {
    topic: 'arrays',
    difficulty: 'easy',
    title: 'Two Sum Approach',
    question: 'What is the most efficient approach to solve the Two Sum problem (find two indices that add up to a target)?',
    options: [
      { label: 'A', text: 'Brute force O(n²)' },
      { label: 'B', text: 'Sort and binary search O(n log n)' },
      { label: 'C', text: 'HashMap — store complement O(n)' },
      { label: 'D', text: 'Two pointers on unsorted array O(n)' },
    ],
    correctOption: 'C',
    explanation: 'Using a HashMap to store each element\'s complement (target - current) as we iterate gives O(n) time and O(n) space — the most efficient approach.',
  },
  {
    topic: 'strings',
    difficulty: 'easy',
    title: 'Palindrome Check',
    question: 'What is the time complexity of checking if a string of length n is a palindrome?',
    options: [
      { label: 'A', text: 'O(1)' },
      { label: 'B', text: 'O(log n)' },
      { label: 'C', text: 'O(n)' },
      { label: 'D', text: 'O(n²)' },
    ],
    correctOption: 'C',
    explanation: 'Using two pointers (left and right) we compare n/2 character pairs at most, giving O(n) time complexity.',
  },
  {
    topic: 'hashing',
    difficulty: 'easy',
    title: 'HashMap Lookup',
    question: 'What is the average time complexity of a lookup operation in a HashMap?',
    options: [
      { label: 'A', text: 'O(1)' },
      { label: 'B', text: 'O(log n)' },
      { label: 'C', text: 'O(n)' },
      { label: 'D', text: 'O(n log n)' },
    ],
    correctOption: 'A',
    explanation: 'HashMap uses a hash function to directly compute the bucket index, giving O(1) average time. Worst case is O(n) due to hash collisions.',
  },
  {
    topic: 'sorting',
    difficulty: 'easy',
    title: 'Merge Sort Complexity',
    question: 'What is the time complexity of Merge Sort in the worst case?',
    options: [
      { label: 'A', text: 'O(n)' },
      { label: 'B', text: 'O(n log n)' },
      { label: 'C', text: 'O(n²)' },
      { label: 'D', text: 'O(log n)' },
    ],
    correctOption: 'B',
    explanation: 'Merge Sort divides the array in half recursively (log n levels) and merges in O(n) at each level, giving O(n log n) in all cases — best, average, and worst.',
  },
  {
    topic: 'searching',
    difficulty: 'easy',
    title: 'Binary Search Precondition',
    question: 'Which condition MUST be satisfied before applying Binary Search?',
    options: [
      { label: 'A', text: 'Array must be of even length' },
      { label: 'B', text: 'Array must be sorted' },
      { label: 'C', text: 'Array must contain unique elements' },
      { label: 'D', text: 'Array must be stored in heap memory' },
    ],
    correctOption: 'B',
    explanation: 'Binary Search works by comparing the middle element and eliminating half the search space. This only works correctly if the array is sorted.',
  },
  {
    topic: 'linked-lists',
    difficulty: 'easy',
    title: 'Linked List vs Array',
    question: 'What is the time complexity of inserting an element at the beginning of a Singly Linked List?',
    options: [
      { label: 'A', text: 'O(n)' },
      { label: 'B', text: 'O(log n)' },
      { label: 'C', text: 'O(1)' },
      { label: 'D', text: 'O(n²)' },
    ],
    correctOption: 'C',
    explanation: 'We just create a new node, point its next to the current head, and update the head pointer — all O(1) operations.',
  },
  {
    topic: 'stacks-queues',
    difficulty: 'easy',
    title: 'Stack LIFO',
    question: 'Which real-world scenario best represents a Stack (LIFO)?',
    options: [
      { label: 'A', text: 'Customers waiting in a bank queue' },
      { label: 'B', text: 'Browser back button history' },
      { label: 'C', text: 'Print job spooler' },
      { label: 'D', text: 'CPU scheduling (Round Robin)' },
    ],
    correctOption: 'B',
    explanation: 'The browser back button pops the last visited page — Last In, First Out. Queue (FIFO) examples are bank queue, print spooler, and CPU scheduling.',
  },
  {
    topic: 'trees',
    difficulty: 'medium',
    title: 'BST Search Complexity',
    question: 'What is the time complexity of searching in a balanced Binary Search Tree with n nodes?',
    options: [
      { label: 'A', text: 'O(1)' },
      { label: 'B', text: 'O(log n)' },
      { label: 'C', text: 'O(n)' },
      { label: 'D', text: 'O(n log n)' },
    ],
    correctOption: 'B',
    explanation: 'In a balanced BST, each comparison eliminates half the remaining nodes. The height of a balanced BST is log n, so search takes O(log n).',
  },
  {
    topic: 'recursion',
    difficulty: 'easy',
    title: 'Factorial Base Case',
    question: 'What is the base case for computing factorial(n) recursively?',
    options: [
      { label: 'A', text: 'n == 1 only' },
      { label: 'B', text: 'n == 0 returns 1' },
      { label: 'C', text: 'n > 0 returns n' },
      { label: 'D', text: 'n == 2 returns 2' },
    ],
    correctOption: 'B',
    explanation: 'factorial(0) = 1 by mathematical definition. Without this base case the recursion would run infinitely. n == 1 also works but n == 0 is the universal standard.',
  },
  {
    topic: 'arrays',
    difficulty: 'medium',
    title: 'Kadane\'s Algorithm',
    question: 'Kadane\'s algorithm solves which classic problem in O(n) time?',
    options: [
      { label: 'A', text: 'Finding all pairs with a given sum' },
      { label: 'B', text: 'Maximum subarray sum' },
      { label: 'C', text: 'Sorting an array of 0s, 1s, and 2s' },
      { label: 'D', text: 'Finding the missing number' },
    ],
    correctOption: 'B',
    explanation: 'Kadane\'s algorithm maintains a running max subarray sum: currentMax = max(nums[i], currentMax + nums[i]). It solves the Maximum Subarray problem in O(n) with O(1) space.',
  },
  {
    topic: 'graphs',
    difficulty: 'medium',
    title: 'BFS vs DFS',
    question: 'Which algorithm is best suited for finding the SHORTEST PATH in an unweighted graph?',
    options: [
      { label: 'A', text: 'DFS (Depth First Search)' },
      { label: 'B', text: 'BFS (Breadth First Search)' },
      { label: 'C', text: 'Dijkstra\'s Algorithm' },
      { label: 'D', text: 'Prim\'s Algorithm' },
    ],
    correctOption: 'B',
    explanation: 'BFS explores level by level, so the first time it reaches the destination it guarantees the shortest path in an unweighted graph. DFS does not guarantee shortest path.',
  },
  {
    topic: 'dynamic-programming',
    difficulty: 'medium',
    title: 'Fibonacci Memoization',
    question: 'What is the time complexity of computing the nth Fibonacci number using memoization (top-down DP)?',
    options: [
      { label: 'A', text: 'O(2ⁿ)' },
      { label: 'B', text: 'O(n²)' },
      { label: 'C', text: 'O(n)' },
      { label: 'D', text: 'O(log n)' },
    ],
    correctOption: 'C',
    explanation: 'Memoization stores already-computed results. Each subproblem (fib(0) to fib(n)) is computed exactly once, giving O(n) time vs the naive O(2ⁿ) recursive approach.',
  },
  {
    topic: 'sorting',
    difficulty: 'medium',
    title: 'Quick Sort Worst Case',
    question: 'When does Quick Sort exhibit O(n²) worst-case time complexity?',
    options: [
      { label: 'A', text: 'When the array has all duplicate elements' },
      { label: 'B', text: 'When the pivot is always the median element' },
      { label: 'C', text: 'When the pivot is always the smallest or largest element' },
      { label: 'D', text: 'When the array is randomly shuffled' },
    ],
    correctOption: 'C',
    explanation: 'If the pivot is always the min or max (e.g., picking first element on a sorted array), one partition gets n-1 elements and the other 0, leading to O(n²). Random pivot or median-of-three avoids this.',
  },
  {
    topic: 'trees',
    difficulty: 'medium',
    title: 'Tree Traversal Output',
    question: 'For a BST with values [4, 2, 6, 1, 3, 5, 7], what does In-Order traversal produce?',
    options: [
      { label: 'A', text: '4, 2, 6, 1, 3, 5, 7' },
      { label: 'B', text: '1, 2, 3, 4, 5, 6, 7' },
      { label: 'C', text: '1, 3, 2, 5, 7, 6, 4' },
      { label: 'D', text: '4, 6, 7, 5, 2, 3, 1' },
    ],
    correctOption: 'B',
    explanation: 'In-Order traversal (Left → Root → Right) of a BST always produces elements in sorted ascending order. This is a key property of BSTs.',
  },
  {
    topic: 'hashing',
    difficulty: 'medium',
    title: 'Hash Collision',
    question: 'Which technique resolves hash collisions by storing multiple elements in the same bucket using a linked list?',
    options: [
      { label: 'A', text: 'Open Addressing' },
      { label: 'B', text: 'Linear Probing' },
      { label: 'C', text: 'Chaining (Separate Chaining)' },
      { label: 'D', text: 'Double Hashing' },
    ],
    correctOption: 'C',
    explanation: 'Chaining stores colliding elements in a linked list at each bucket. Open addressing, linear probing, and double hashing store colliding elements in other empty slots within the same table.',
  },
  {
    topic: 'strings',
    difficulty: 'medium',
    title: 'Anagram Detection',
    question: 'What is the most efficient way to check if two strings are anagrams of each other?',
    options: [
      { label: 'A', text: 'Sort both strings and compare — O(n log n)' },
      { label: 'B', text: 'Use frequency count array — O(n)' },
      { label: 'C', text: 'Compare all permutations — O(n!)' },
      { label: 'D', text: 'Sliding window — O(n)' },
    ],
    correctOption: 'B',
    explanation: 'Count character frequencies in both strings using a 26-length array. Compare counts in O(1). Total: O(n). Sorting also works but O(n log n) is slower.',
  },
  {
    topic: 'linked-lists',
    difficulty: 'medium',
    title: 'Detect Cycle',
    question: 'Which algorithm detects a cycle in a linked list using O(1) extra space?',
    options: [
      { label: 'A', text: 'Storing all visited nodes in a HashSet' },
      { label: 'B', text: 'Floyd\'s Tortoise and Hare algorithm' },
      { label: 'C', text: 'Reversing the linked list' },
      { label: 'D', text: 'Counting total nodes twice' },
    ],
    correctOption: 'B',
    explanation: 'Floyd\'s algorithm uses two pointers: slow (1 step) and fast (2 steps). If there\'s a cycle, fast will eventually lap slow. O(n) time, O(1) space.',
  },
  {
    topic: 'stacks-queues',
    difficulty: 'medium',
    title: 'Valid Parentheses',
    question: 'Which data structure is ideal for solving the Valid Parentheses problem (checking balanced brackets)?',
    options: [
      { label: 'A', text: 'Queue' },
      { label: 'B', text: 'Heap' },
      { label: 'C', text: 'Stack' },
      { label: 'D', text: 'Array with two pointers' },
    ],
    correctOption: 'C',
    explanation: 'Push opening brackets onto a stack. When a closing bracket is encountered, pop and check if it matches. Stack\'s LIFO property perfectly mirrors the nesting structure of brackets.',
  },
  {
    topic: 'recursion',
    difficulty: 'medium',
    title: 'Tower of Hanoi',
    question: 'How many moves does it take to solve Tower of Hanoi with n disks?',
    options: [
      { label: 'A', text: 'n²' },
      { label: 'B', text: '2n' },
      { label: 'C', text: '2ⁿ - 1' },
      { label: 'D', text: 'n log n' },
    ],
    correctOption: 'C',
    explanation: 'T(n) = 2T(n-1) + 1. Solving gives T(n) = 2ⁿ - 1. For 3 disks: 7 moves. For 4 disks: 15 moves. This is exponential, making it infeasible for large n.',
  },
  {
    topic: 'graphs',
    difficulty: 'hard',
    title: 'Dijkstra\'s Algorithm',
    question: 'What data structure makes Dijkstra\'s shortest path algorithm most efficient?',
    options: [
      { label: 'A', text: 'Stack' },
      { label: 'B', text: 'Simple Queue' },
      { label: 'C', text: 'Min-Heap (Priority Queue)' },
      { label: 'D', text: 'Adjacency Matrix only' },
    ],
    correctOption: 'C',
    explanation: 'A Min-Heap (Priority Queue) always gives the unvisited vertex with the smallest tentative distance in O(log V). Without it, extracting the minimum is O(V), making the total O(V²) instead of O((V+E) log V).',
  },
  {
    topic: 'dynamic-programming',
    difficulty: 'hard',
    title: 'Longest Common Subsequence',
    question: 'What is the time complexity of finding the Longest Common Subsequence (LCS) of two strings of lengths m and n using DP?',
    options: [
      { label: 'A', text: 'O(m + n)' },
      { label: 'B', text: 'O(m × n)' },
      { label: 'C', text: 'O(2^(m+n))' },
      { label: 'D', text: 'O(m log n)' },
    ],
    correctOption: 'B',
    explanation: 'The DP table has m×n cells. Each cell is computed in O(1) using: dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j], dp[i][j-1]). Total: O(m×n) time and space.',
  },
  {
    topic: 'bit-manipulation',
    difficulty: 'medium',
    title: 'Check Power of Two',
    question: 'What is the most efficient way to check if a number n is a power of 2?',
    code: 'return n > 0 && ???;',
    options: [
      { label: 'A', text: 'n % 2 == 0' },
      { label: 'B', text: '(n & (n-1)) == 0' },
      { label: 'C', text: 'n >> 1 == 0' },
      { label: 'D', text: 'n ^ 2 == 0' },
    ],
    correctOption: 'B',
    explanation: 'Powers of 2 have exactly one set bit (e.g., 8 = 1000). n-1 flips all bits up to and including the set bit (7 = 0111). So n & (n-1) = 0 for powers of 2. O(1) time, O(1) space.',
  },
  {
    topic: 'math',
    difficulty: 'easy',
    title: 'GCD Algorithm',
    question: 'What algorithm efficiently computes the GCD (Greatest Common Divisor) of two numbers?',
    options: [
      { label: 'A', text: 'Trial division up to min(a, b)' },
      { label: 'B', text: 'Euclidean Algorithm: gcd(a, b) = gcd(b, a % b)' },
      { label: 'C', text: 'Prime factorization' },
      { label: 'D', text: 'Binary search on divisors' },
    ],
    correctOption: 'B',
    explanation: 'The Euclidean Algorithm runs in O(log(min(a,b))) — much faster than trial division O(min(a,b)). It repeatedly applies gcd(a,b) = gcd(b, a mod b) until b = 0.',
  },
  {
    topic: 'greedy',
    difficulty: 'medium',
    title: 'Activity Selection',
    question: 'In the Activity Selection Problem (maximize non-overlapping activities), what greedy choice gives the optimal solution?',
    options: [
      { label: 'A', text: 'Always pick the activity with the earliest start time' },
      { label: 'B', text: 'Always pick the shortest duration activity' },
      { label: 'C', text: 'Always pick the activity with the earliest finish time' },
      { label: 'D', text: 'Always pick the activity with the latest start time' },
    ],
    correctOption: 'C',
    explanation: 'Picking the activity with the earliest finish time maximizes the remaining time for other activities. This greedy choice leads to the globally optimal solution.',
  },
  {
    topic: 'arrays',
    difficulty: 'hard',
    title: 'Dutch National Flag',
    question: 'The Dutch National Flag algorithm sorts an array of 0s, 1s, and 2s in O(n) time and O(1) space. What technique does it use?',
    options: [
      { label: 'A', text: 'Two pointers from both ends' },
      { label: 'B', text: 'Three pointers (low, mid, high)' },
      { label: 'C', text: 'Counting sort with 3 buckets' },
      { label: 'D', text: 'Merge sort with 3-way partition' },
    ],
    correctOption: 'B',
    explanation: 'Three pointers divide the array into 4 sections: [0..low-1]=0s, [low..mid-1]=1s, [mid..high]=unknown, [high+1..n-1]=2s. Swap based on nums[mid] value. Single pass O(n).',
  },
  {
    topic: 'trees',
    difficulty: 'hard',
    title: 'Lowest Common Ancestor',
    question: 'In a Binary Search Tree, what is the time complexity of finding the Lowest Common Ancestor (LCA) of two nodes?',
    options: [
      { label: 'A', text: 'O(1)' },
      { label: 'B', text: 'O(log n) for balanced BST' },
      { label: 'C', text: 'O(n) always' },
      { label: 'D', text: 'O(n²)' },
    ],
    correctOption: 'B',
    explanation: 'In a BST, we traverse from root: if both nodes are smaller, go left; if both are larger, go right; otherwise current node is LCA. For a balanced BST this is O(log n). For skewed BST, O(n).',
  },
  {
    topic: 'dynamic-programming',
    difficulty: 'medium',
    title: '0/1 Knapsack',
    question: 'In the 0/1 Knapsack problem with n items and capacity W, what is the space-optimized DP complexity?',
    options: [
      { label: 'A', text: 'O(n × W) time, O(n × W) space' },
      { label: 'B', text: 'O(n × W) time, O(W) space' },
      { label: 'C', text: 'O(n²) time, O(n) space' },
      { label: 'D', text: 'O(2ⁿ) time, O(1) space' },
    ],
    correctOption: 'B',
    explanation: 'The standard DP table is O(n×W) time. Space can be optimized to O(W) by using a 1D array and iterating capacity from W down to weight[i] for each item.',
  },
  {
    topic: 'searching',
    difficulty: 'medium',
    title: 'Binary Search on Answer',
    question: 'Binary Search on Answer is a technique where you binary search on the ___ rather than the array index.',
    options: [
      { label: 'A', text: 'Input size' },
      { label: 'B', text: 'Answer/result value' },
      { label: 'C', text: 'Number of comparisons' },
      { label: 'D', text: 'Memory address' },
    ],
    correctOption: 'B',
    explanation: 'Instead of searching for an element, you binary search on the answer space (e.g., "minimum largest sum", "kth smallest"). You verify if an answer is feasible with a check function.',
  },
  {
    topic: 'strings',
    difficulty: 'hard',
    title: 'KMP Algorithm',
    question: 'What is the time complexity of the KMP (Knuth-Morris-Pratt) string pattern matching algorithm?',
    options: [
      { label: 'A', text: 'O(n × m) where n = text length, m = pattern length' },
      { label: 'B', text: 'O(n + m)' },
      { label: 'C', text: 'O(n log n)' },
      { label: 'D', text: 'O(m²)' },
    ],
    correctOption: 'B',
    explanation: 'KMP preprocesses the pattern in O(m) to build a failure function (LPS array), then searches in O(n). Total: O(n + m). The naive approach is O(n×m). KMP never re-examines matched characters.',
  },
  {
    topic: 'graphs',
    difficulty: 'medium',
    title: 'Detect Cycle in Directed Graph',
    question: 'Which technique detects a cycle in a DIRECTED graph?',
    options: [
      { label: 'A', text: 'BFS with visited array' },
      { label: 'B', text: 'DFS with visited + recursion stack (DFS coloring)' },
      { label: 'C', text: 'Union-Find (Disjoint Set)' },
      { label: 'D', text: 'Topological sort only' },
    ],
    correctOption: 'B',
    explanation: 'DFS with a recursion stack tracks nodes in the current DFS path. If we encounter a node already in the stack, it\'s a back edge → cycle. Union-Find works for undirected graphs.',
  },
];

async function seedChallenges() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing challenges and drop the unique index
  console.log('Clearing old challenges...');
  await Challenge.deleteMany({});
  try {
    await Challenge.collection.dropIndex('date_1');
    console.log('Dropped unique date index');
  } catch (_) {
    // Index might not exist yet
  }

  // Start dates from today
  const today = new Date();

  let created = 0;

  for (let i = 0; i < challengeData.length; i++) {
    const d = new Date(today);
    // Assign 3 challenges per day
    d.setDate(d.getDate() + Math.floor(i / 3));
    const dateStr = d.toISOString().slice(0, 10);

    await Challenge.create({
      ...challengeData[i],
      date: dateStr,
    });
    created++;
    console.log(`Created challenge for ${dateStr}: ${challengeData[i].title}`);
  }

  console.log(`\nDone. Created: ${created} challenges.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedChallenges().catch((e) => {
  console.error(e);
  process.exit(1);
});
