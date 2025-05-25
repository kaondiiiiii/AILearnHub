import { 
  users, flashcardDecks, flashcards, quizzes, quizAttempts, lessons, 
  studyProgress, aiInteractions, mindMaps,
  type User, type InsertUser, type FlashcardDeck, type InsertFlashcardDeck,
  type Flashcard, type InsertFlashcard, type Quiz, type InsertQuiz,
  type Lesson, type InsertLesson,
  type StudyProgress, type InsertStudyProgress, type AiInteraction, type InsertAiInteraction,
  type MindMap, type InsertMindMap
} from "@shared/schema";
import session from "express-session";

// Define QuizAttempt interface
export interface QuizAttempt {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  totalQuestions: number;
  timeSpent?: number | null;
  answers?: { [questionId: number]: string[] } | null;
  completedAt?: string | null;
}
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Flashcard methods
  getFlashcardDecks(userId?: number): Promise<FlashcardDeck[]>;
  getFlashcardDeck(id: number): Promise<FlashcardDeck | undefined>;
  createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck>;
  getFlashcards(deckId: number): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;

  // Quiz methods
  getQuizzes(userId?: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizAttempts(userId: number): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuizId(quizId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt>;
  updateQuizAttempt(id: number, updateData: Partial<Omit<QuizAttempt, 'id'>>): Promise<QuizAttempt | null>;

  // Lesson methods
  getLessons(userId?: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;

  // Study progress methods
  getStudyProgress(userId: number): Promise<StudyProgress[]>;
  updateStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress>;

  // AI interaction methods
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getAiInteractions(userId: number, limit?: number): Promise<AiInteraction[]>;

  // Mind map methods
  getMindMaps(userId?: number): Promise<MindMap[]>;
  getMindMap(id: number): Promise<MindMap | undefined>;
  createMindMap(mindMap: InsertMindMap): Promise<MindMap>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  // Private method to save data (used internally)
  private saveData(): void {
    // This method would typically save data to disk or database
    // In this in-memory implementation, it's a placeholder for persistence
    console.log('Data saved');
  }
  private users: Map<number, User>;
  private flashcardDecks: Map<number, FlashcardDeck>;
  private flashcards: Map<number, Flashcard>;
  private quizzes: Map<number, Quiz>;
  private quizAttempts: Map<number, QuizAttempt>;
  private lessons: Map<number, Lesson>;
  private studyProgress: Map<number, StudyProgress>;
  private aiInteractions: Map<number, AiInteraction>;
  private mindMaps: Map<number, MindMap>;
  private currentId: number;
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.flashcardDecks = new Map();
    this.flashcards = new Map();
    this.quizzes = new Map();
    this.quizAttempts = new Map();
    this.lessons = new Map();
    this.studyProgress = new Map();
    this.aiInteractions = new Map();
    this.mindMaps = new Map();
    this.currentId = 1;
    
    // Create a demo user with teacher role
    this.users.set(1, {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password: 'password-hash',
      firstName: 'Demo',
      lastName: 'User',
      role: 'teacher', // Set role to teacher
      grade: null,
      subjects: ['Mathematics', 'Science', 'English'],
      createdAt: new Date()
    });
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    
    // Ensure required fields have proper values
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || 'student',
      grade: insertUser.grade || null,
      subjects: insertUser.subjects ? [...insertUser.subjects] : null,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    // Ensure proper type handling for arrays and optional fields
    const updatedUser = {
      ...user,
      ...updates,
      role: updates.role || user.role || 'student',
      grade: updates.grade !== undefined ? updates.grade : user.grade,
      subjects: updates.subjects ? [...updates.subjects] : user.subjects
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Flashcard methods
  async getFlashcardDecks(userId?: number): Promise<FlashcardDeck[]> {
    const decks = Array.from(this.flashcardDecks.values());
    if (userId) {
      return decks.filter(deck => deck.userId === userId || deck.isPublic);
    }
    return decks.filter(deck => deck.isPublic);
  }

  async getFlashcardDeck(id: number): Promise<FlashcardDeck | undefined> {
    return this.flashcardDecks.get(id);
  }

  async createFlashcardDeck(insertDeck: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const id = this.currentId++;
    const deck: FlashcardDeck = {
      ...insertDeck,
      id,
      createdAt: new Date(),
      description: insertDeck.description || null,
      isPublic: insertDeck.isPublic || false
    };
    this.flashcardDecks.set(id, deck);
    return deck;
  }

  async getFlashcards(deckId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.deckId === deckId);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentId++;
    const flashcard: Flashcard = {
      ...insertFlashcard,
      id,
      createdAt: new Date(),
      difficulty: insertFlashcard.difficulty || null
    };
    this.flashcards.set(id, flashcard);
    this.saveData();
    return flashcard;
  }

  // Quiz methods
  async getQuizzes(userId?: number): Promise<Quiz[]> {
    const quizzes = Array.from(this.quizzes.values());
    if (userId) {
      return quizzes.filter(quiz => quiz.userId === userId || quiz.isPublic);
    }
    return quizzes.filter(quiz => quiz.isPublic);
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date(),
      description: insertQuiz.description || null,
      isPublic: insertQuiz.isPublic || false,
      questions: insertQuiz.questions || null,
      timeLimit: insertQuiz.timeLimit || null
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(attempt => attempt.userId === userId);
  }

  async getQuizAttemptsByQuizId(quizId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(attempt => attempt.quizId === quizId);
  }

  async createQuizAttempt(insertAttempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    const id = this.currentId++;
    
    // Ensure all properties have proper types
    const attempt: QuizAttempt = {
      id,
      userId: insertAttempt.userId,
      quizId: insertAttempt.quizId,
      score: insertAttempt.score,
      totalQuestions: insertAttempt.totalQuestions,
      answers: insertAttempt.answers ? {...insertAttempt.answers} : null,
      timeSpent: insertAttempt.timeSpent || null,
      completedAt: new Date().toISOString()
    };
    
    this.quizAttempts.set(id, attempt);
    this.saveData();
    return attempt;
  }

  async updateQuizAttempt(id: number, updateData: Partial<Omit<QuizAttempt, 'id'>>): Promise<QuizAttempt | null> {
    const attempt = this.quizAttempts.get(id);
    if (!attempt) return null;

    Object.assign(attempt, updateData);
    if (updateData.answers) {
      attempt.answers = {...updateData.answers};
    }
    this.saveData();
    return attempt;
  }

  // Lesson methods
  async getLessons(userId?: number): Promise<Lesson[]> {
    const lessons = Array.from(this.lessons.values());
    if (userId) {
      return lessons.filter(lesson => lesson.userId === userId || lesson.isPublic);
    }
    return lessons.filter(lesson => lesson.isPublic);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.currentId++;
    const lesson: Lesson = {
      ...insertLesson,
      id,
      createdAt: new Date(),
      description: insertLesson.description || null,
      isPublic: insertLesson.isPublic || false,
      objectives: Array.isArray(insertLesson.objectives) ? [...insertLesson.objectives] : null,
      content: insertLesson.content || null,
      duration: insertLesson.duration || null
    };
    this.lessons.set(id, lesson);
    this.saveData();
    return lesson;
  }

  // Study progress methods
  async getStudyProgress(userId: number): Promise<StudyProgress[]> {
    return Array.from(this.studyProgress.values()).filter(progress => progress.userId === userId);
  }

  async updateStudyProgress(insertProgress: InsertStudyProgress): Promise<StudyProgress> {
    // Find existing progress or create new
    const existing = Array.from(this.studyProgress.values()).find(
      p => p.userId === insertProgress.userId && 
           p.subject === insertProgress.subject && 
           p.topic === insertProgress.topic
    );

    if (existing) {
      const updated = { ...existing, ...insertProgress, lastStudied: new Date() };
      this.studyProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentId++;
      const progress: StudyProgress = {
        ...insertProgress,
        id,
        lastStudied: new Date(),
        timeSpent: insertProgress.timeSpent || null,
        masteryLevel: insertProgress.masteryLevel || null
      };
      this.studyProgress.set(id, progress);
      return progress;
    }
  }

  // AI interaction methods
  async createAiInteraction(insertInteraction: InsertAiInteraction): Promise<AiInteraction> {
    const id = this.currentId++;
    const interaction: AiInteraction = {
      ...insertInteraction,
      id,
      createdAt: new Date(),
      context: insertInteraction.context || {}
    };
    this.aiInteractions.set(id, interaction);
    return interaction;
  }

  async getAiInteractions(userId: number, limit = 50): Promise<AiInteraction[]> {
    return Array.from(this.aiInteractions.values())
      .filter(interaction => interaction.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  // Mind map methods
  async getMindMaps(userId?: number): Promise<MindMap[]> {
    const maps = Array.from(this.mindMaps.values());
    if (userId) {
      return maps.filter(map => map.userId === userId || map.isPublic);
    }
    return maps.filter(map => map.isPublic);
  }

  async getMindMap(id: number): Promise<MindMap | undefined> {
    return this.mindMaps.get(id);
  }

  async createMindMap(insertMindMap: InsertMindMap): Promise<MindMap> {
    const id = this.currentId++;
    const mindMap: MindMap = {
      ...insertMindMap,
      id,
      createdAt: new Date(),
      data: insertMindMap.data || {},
      isPublic: insertMindMap.isPublic || false
    };
    this.mindMaps.set(id, mindMap);
    this.saveData();
    return mindMap;
  }
}

export const storage = new MemStorage();
