export interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  averagePerformance?: number;
  studentsNeedingAttention?: number;
  flashcardsMastered?: number;
  quizAverage?: number;
  studyTimeToday?: number;
  currentLevel?: number;
}

export interface RecentActivity {
  id: string;
  type: 'quiz' | 'flashcard' | 'lesson' | 'mindmap';
  title: string;
  subject: string;
  timeAgo: string;
  score?: number;
  status?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  type: 'review' | 'practice' | 'explore';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface GradeLevel {
  id: string;
  name: string;
  value: string;
}

export interface UserRole {
  id: string;
  name: string;
  value: string;
  icon: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

export interface FlashcardStudySession {
  deckId: number;
  currentCardIndex: number;
  totalCards: number;
  correctAnswers: number;
  timeSpent: number;
  isFlipped: boolean;
}

export interface QuizSession {
  quizId: number;
  currentQuestionIndex: number;
  answers: any[];
  timeSpent: number;
  startTime: Date;
}
