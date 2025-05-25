import { Subject, GradeLevel, UserRole, NavigationItem } from './types';

export const SUBJECTS: Subject[] = [
  { id: 'mathematics', name: 'Mathematics', color: 'text-blue-600', icon: 'fas fa-calculator' },
  { id: 'science', name: 'Science', color: 'text-green-600', icon: 'fas fa-flask' },
  { id: 'english', name: 'English', color: 'text-purple-600', icon: 'fas fa-book' },
  { id: 'history', name: 'History', color: 'text-orange-600', icon: 'fas fa-landmark' },
  { id: 'geography', name: 'Geography', color: 'text-teal-600', icon: 'fas fa-globe' },
  { id: 'physics', name: 'Physics', color: 'text-indigo-600', icon: 'fas fa-atom' },
  { id: 'chemistry', name: 'Chemistry', color: 'text-red-600', icon: 'fas fa-vial' },
  { id: 'biology', name: 'Biology', color: 'text-emerald-600', icon: 'fas fa-dna' },
];

export const GRADE_LEVELS: GradeLevel[] = [
  { id: 'elementary', name: 'Elementary', value: 'elementary' },
  { id: 'grade6', name: 'Grade 6', value: 'grade-6' },
  { id: 'grade7', name: 'Grade 7', value: 'grade-7' },
  { id: 'grade8', name: 'Grade 8', value: 'grade-8' },
  { id: 'grade9', name: 'Grade 9', value: 'grade-9' },
  { id: 'grade10', name: 'Grade 10', value: 'grade-10' },
  { id: 'grade11', name: 'Grade 11', value: 'grade-11' },
  { id: 'grade12', name: 'Grade 12', value: 'grade-12' },
];

export const USER_ROLES: UserRole[] = [
  { id: 'student', name: 'Student', value: 'student', icon: '👨‍🎓' },
  { id: 'teacher', name: 'Teacher', value: 'teacher', icon: '👨‍🏫' },
  { id: 'parent', name: 'Parent', value: 'parent', icon: '👨‍👩‍👧‍👦' },
  { id: 'principal', name: 'Principal', value: 'principal', icon: '👨‍💼' },
  { id: 'admin', name: 'Admin', value: 'admin', icon: '⚙️' },
];

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: 'fas fa-home',
    roles: ['all']
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    href: '/flashcards',
    icon: 'fas fa-layer-group',
    roles: ['student', 'teacher']
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    href: '/quizzes',
    icon: 'fas fa-question-circle',
    roles: ['student', 'teacher']
  },
  {
    id: 'lessons',
    label: 'Lesson Builder',
    href: '/lessons',
    icon: 'fas fa-chalkboard-teacher',
    roles: ['teacher']
  },
  {
    id: 'mind-map',
    label: 'Mind Maps',
    href: '/mind-map',
    icon: 'fas fa-project-diagram',
    roles: ['student', 'teacher']
  },
  {
    id: 'ai-tutor',
    label: 'AI Tutor',
    href: '/ai-tutor',
    icon: 'fas fa-robot',
    roles: ['student', 'teacher']
  },
  {
    id: 'tools',
    label: 'AI Tools',
    href: '/tools',
    icon: 'fas fa-magic',
    roles: ['student', 'teacher', 'parent', 'admin']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: 'fas fa-chart-line',
    roles: ['principal', 'admin']
  },
  {
    id: 'progress',
    label: 'Child Progress',
    href: '/progress',
    icon: 'fas fa-chart-bar',
    roles: ['parent']
  }
];

export const EXPLANATION_LEVELS = [
  { id: 'kid', name: 'Kid-level', description: 'Simple explanation for young children' },
  { id: 'teen', name: 'Teen', description: 'Explanation for teenagers' },
  { id: 'parent', name: 'Parent', description: 'Explanation for parents' },
  { id: 'teacher', name: 'Teacher', description: 'Detailed pedagogical explanation' },
];

export const LEARNING_STYLES = [
  { id: 'visual', name: 'Visual Learner', description: 'Learns best with images and diagrams' },
  { id: 'auditory', name: 'Auditory Learner', description: 'Learns best by listening' },
  { id: 'kinesthetic', name: 'Kinesthetic Learner', description: 'Learns best through hands-on activities' },
  { id: 'mixed', name: 'Mixed Learning', description: 'Combination of all learning styles' },
];

export const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'medium', name: 'Medium', color: 'text-blue-800 bg-blue-100 border-blue-300' },
  { id: 'hard', name: 'Hard', color: 'text-red-600 bg-red-50 border-red-200' },
];

export const QUESTION_TYPES = [
  { id: 'multiple-choice', name: 'Multiple Choice', description: 'Questions with 4 answer options' },
  { id: 'true-false', name: 'True/False', description: 'Yes or no questions' },
  { id: 'short-answer', name: 'Short Answer', description: 'Brief written responses' },
];

export const DEFAULT_LESSON_DURATION = 45; // minutes
export const DEFAULT_QUIZ_TIME_LIMIT = 30; // minutes
export const DEFAULT_FLASHCARD_COUNT = 10;
export const DEFAULT_QUIZ_QUESTION_COUNT = 10;
export const MAX_CHAT_HISTORY = 20; // number of messages to keep in context
