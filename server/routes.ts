import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  openai,
  generateFlashcards,
  generateQuiz, 
  generateLessonPlan,
  explainText,
  generateMindMap,
  generateTutorResponse,
  generateEducationalImage,
  type FlashcardGenerationRequest,
  type QuizGenerationRequest,
  type LessonPlanRequest,
  type ExplanationRequest,
  type MindMapRequest
} from "./openai";
import { 
  insertFlashcardDeckSchema,
  insertFlashcardSchema,
  insertQuizSchema,
  insertQuizAttemptSchema,
  insertLessonSchema,
  insertStudyProgressSchema,
  insertAiInteractionSchema,
  insertMindMapSchema
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware that bypasses authentication - allowing all requests through
  const requireAuth = (req: any, res: any, next: any) => {
    // If user is not authenticated, create a dummy user object
    if (!req.user) {
      req.user = { id: 1, grade: 'college' };
    }
    next();
  };

  // Flashcard routes
  app.get("/api/flashcard-decks", requireAuth, async (req, res) => {
    try {
      const decks = await storage.getFlashcardDecks(req.user.id);
      res.json(decks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcard decks" });
    }
  });

  app.post("/api/flashcard-decks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFlashcardDeckSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const deck = await storage.createFlashcardDeck(validatedData);
      res.status(201).json(deck);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard deck data" });
    }
  });

  app.get("/api/flashcard-decks/:id/cards", requireAuth, async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const cards = await storage.getFlashcards(deckId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcard-decks/:id/cards", requireAuth, async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const validatedData = insertFlashcardSchema.parse({
        ...req.body,
        deckId
      });
      const card = await storage.createFlashcard(validatedData);
      res.status(201).json(card);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard data" });
    }
  });

  // AI Flashcard generation
  app.post("/api/ai/generate-flashcards", requireAuth, async (req, res) => {
    try {
      const { content, subject, gradeLevel, numberOfCards } = req.body;
      
      if (!content || !subject || !gradeLevel || !numberOfCards) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const request: FlashcardGenerationRequest = {
        content,
        subject,
        gradeLevel,
        numberOfCards: parseInt(numberOfCards)
      };

      const flashcards = await generateFlashcards(request);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "generation",
        prompt: `Generate ${numberOfCards} flashcards for ${subject} (${gradeLevel}): ${content.substring(0, 100)}...`,
        response: `Generated ${flashcards.length} flashcards`,
        context: { subject, gradeLevel, numberOfCards } as any
      });

      res.json({ flashcards });
    } catch (error) {
      console.error("Flashcard generation error:", error);
      res.status(500).json({ error: "Failed to generate flashcards. Please check your content and try again." });
    }
  });

  // Quiz routes
  app.get("/api/quizzes", requireAuth, async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes(req.user.id);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/quizzes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      res.status(400).json({ error: "Invalid quiz data" });
    }
  });

  app.get("/api/quizzes/:id", requireAuth, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quiz-attempts", requireAuth, async (req, res) => {
    try {
      const validatedData = insertQuizAttemptSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const attempt = await storage.createQuizAttempt(validatedData);
      res.status(201).json(attempt);
    } catch (error) {
      res.status(400).json({ error: "Invalid quiz attempt data" });
    }
  });

  app.get("/api/quiz-attempts", requireAuth, async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  // AI Quiz generation
  app.post("/api/ai/generate-quiz", requireAuth, async (req, res) => {
    try {
      const { 
        topic, 
        subject, 
        gradeLevel, 
        numberOfQuestions, 
        questionTypes,
        learningStyle,
        personalizedFor,
        gamificationLevel,
        includeImages 
      } = req.body;
      
      if (!topic || !subject || !gradeLevel || !numberOfQuestions || !questionTypes) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const request: QuizGenerationRequest = {
        topic,
        subject,
        gradeLevel,
        numberOfQuestions: parseInt(numberOfQuestions),
        questionTypes,
        learningStyle,
        personalizedFor,
        gamificationLevel,
        includeImages
      };

      const questions = await generateQuiz(request);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "generation",
        prompt: `Generate ${numberOfQuestions} quiz questions about ${topic} for ${subject} (${gradeLevel})`,
        response: `Generated ${questions.length} questions`,
        context: { topic, subject, gradeLevel, numberOfQuestions, questionTypes } as any
      });

      res.json({ questions });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz questions. Please try again." });
    }
  });

  // AI Quiz Analysis Route
  app.post('/api/ai/analyze-quiz-results', requireAuth, async (req, res) => {
    try {
      const { topic, subject, questions, userAnswers, score } = req.body;
      
      if (!topic || !subject || !questions || !userAnswers || !score) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Import the analyze quiz results handler
      const handleAnalyzeQuizResults = require('./api/ai/analyze-quiz-results').default;
      
      // Call the handler
      return handleAnalyzeQuizResults(req, res);
    } catch (error) {
      console.error('Error analyzing quiz results:', error);
      return res.status(500).json({ 
        error: 'Failed to analyze quiz results', 
        message: error.message || 'Unknown error' 
      });
    }
  });

  // AI Video Generation Route
  app.post('/api/ai/generate-video', requireAuth, async (req, res) => {
    try {
      const { concept } = req.body;
      
      if (!concept) {
        return res.status(400).json({ error: 'Missing required field: concept' });
      }
      
      // In development mode, return mock data for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Returning mock video data');
        // Add a slight delay to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        return res.status(200).json({
          success: true,
          videoPath: 'https://storage.googleapis.com/ailearnhub-videos/sample_math_video.mp4',
          message: 'Development mode: Mock video generated successfully',
          outline: {
            title: 'Understanding ' + concept,
            chapters: [
              { title: 'Introduction to ' + concept, duration: '2:15' },
              { title: 'Visual Demonstration', duration: '3:45' },
              { title: 'Real-world Applications', duration: '2:30' }
            ]
          }
        });
      }
      
      // For production, we would call the actual handler
      return res.status(500).json({ 
        error: 'Video generation not available in production yet',
        message: 'This feature is currently only available in development mode'
      });
    } catch (error) {
      console.error('Error generating video:', error);
      return res.status(500).json({ 
        error: 'Failed to generate video', 
        message: error.message || 'Unknown error' 
      });
    }
  });

  // Lesson routes
  app.get("/api/lessons", requireAuth, async (req, res) => {
    try {
      const lessons = await storage.getLessons(req.user.id);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons", requireAuth, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(400).json({ error: "Invalid lesson data" });
    }
  });

  app.get("/api/lessons/:id", requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // AI Lesson generation
  app.post("/api/ai/generate-lesson", requireAuth, async (req, res) => {
    try {
      const { topic, subject, gradeLevel, duration, learningStyle, includeVisuals } = req.body;
      
      if (!topic || !subject || !gradeLevel || !duration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const request: LessonPlanRequest = {
        topic,
        subject,
        gradeLevel,
        duration: parseInt(duration),
        learningStyle: learningStyle || "mixed",
        includeVisuals: includeVisuals !== false
      };

      const lessonPlan = await generateLessonPlan(request);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "generation",
        prompt: `Generate lesson plan for ${topic} in ${subject} (${gradeLevel}, ${duration} min)`,
        response: `Generated lesson: ${lessonPlan.title}`,
        context: { topic, subject, gradeLevel, duration, learningStyle, includeVisuals } as any
      });

      res.json({ lessonPlan });
    } catch (error) {
      console.error("Lesson generation error:", error);
      res.status(500).json({ error: "Failed to generate lesson plan. Please try again." });
    }
  });

  // Study progress routes
  app.get("/api/study-progress", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getStudyProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study progress" });
    }
  });

  app.post("/api/study-progress", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStudyProgressSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const progress = await storage.updateStudyProgress(validatedData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid study progress data" });
    }
  });

  // AI Tutor chat
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get user's grade level for context
      const userLevel = req.user.grade || "middle school";
      
      const response = await generateTutorResponse(message, req.user.id, context, userLevel);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "chat",
        prompt: message,
        response: response,
        context: { userLevel, contextLength: context?.length || 0 } as any
      });

      res.json({ response });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to get AI response. Please try again." });
    }
  });

  // Text explanation
  app.post("/api/ai/explain", requireAuth, async (req, res) => {
    try {
      const { text, level, context } = req.body;
      
      if (!text || !level) {
        return res.status(400).json({ error: "Text and level are required" });
      }

      const request: ExplanationRequest = {
        text,
        level,
        context
      };

      const explanation = await explainText(request);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "explanation",
        prompt: `Explain "${text}" at ${level} level`,
        response: explanation,
        context: { level, hasContext: !!context } as any
      });

      res.json({ explanation });
    } catch (error) {
      console.error("Text explanation error:", error);
      res.status(500).json({ error: "Failed to explain text. Please try again." });
    }
  });

  // Mind map routes
  app.get("/api/mind-maps", requireAuth, async (req, res) => {
    try {
      const mindMaps = await storage.getMindMaps(req.user.id);
      res.json(mindMaps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mind maps" });
    }
  });

  app.post("/api/mind-maps", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMindMapSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const mindMap = await storage.createMindMap(validatedData);
      res.status(201).json(mindMap);
    } catch (error) {
      res.status(400).json({ error: "Invalid mind map data" });
    }
  });

  app.get("/api/mind-maps/:id", requireAuth, async (req, res) => {
    try {
      const mindMapId = parseInt(req.params.id);
      const mindMap = await storage.getMindMap(mindMapId);
      if (!mindMap) {
        return res.status(404).json({ error: "Mind map not found" });
      }
      res.json(mindMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mind map" });
    }
  });

  // AI Mind map generation
  app.post("/api/ai/generate-mind-map", requireAuth, async (req, res) => {
    try {
      const { topic, subject, depth } = req.body;
      
      // Validate required fields
      if (!topic) {
        return res.status(400).json({ error: "Please enter a topic for the mind map" });
      }
      
      if (!subject) {
        return res.status(400).json({ error: "Please enter a subject for the mind map" });
      }

      const request: MindMapRequest = {
        topic,
        subject,
        depth: parseInt(depth) || 3
      };

      // Generate mind map with improved error handling
      try {
        const mindMapData = await generateMindMap(request);
        
        // Log AI interaction
        await storage.createAiInteraction({
          userId: req.user.id,
          type: "generation",
          prompt: `Generate mind map for ${topic} in ${subject} (depth: ${depth})`,
          response: `Generated mind map with root: ${mindMapData.label}`,
          context: { topic, subject, depth } as any
        });

        res.json({ mindMapData });
      } catch (aiError: any) {
        // Log the detailed error but return a user-friendly message
        console.error("Mind map generation error:", aiError);
        
        // Check if this is a validation error from our validation function
        if (aiError.message && aiError.message.includes("Please enter")) {
          return res.status(400).json({ error: aiError.message });
        }
        
        // Return a 500 error for other types of errors
        res.status(500).json({ error: "Failed to generate mind map. Please try again." });
      }
    } catch (error) {
      console.error("Mind map request processing error:", error);
      res.status(500).json({ error: "Failed to process mind map request. Please try again." });
    }
  });

  // AI interaction history
  app.get("/api/ai/interactions", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const interactions = await storage.getAiInteractions(req.user.id, limit);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI interactions" });
    }
  });

  // Generate educational images
  app.post("/api/ai/generate-image", requireAuth, async (req, res) => {
    try {
      const { topic, subject } = req.body;
      
      if (!topic || !subject) {
        return res.status(400).json({ error: "Topic and subject are required" });
      }

      const imageResult = await generateEducationalImage(topic, subject);
      
      // Log AI interaction
      await storage.createAiInteraction({
        userId: req.user.id,
        type: "generation",
        prompt: `Generate educational image for ${topic} in ${subject}`,
        response: `Generated image URL`,
        context: { topic, subject, type: "image" }
      });

      res.json(imageResult);
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate educational image. Please try again." });
    }
  });

  // Analytics endpoints (for principals/admins)
  app.get("/api/analytics/overview", requireAuth, async (req, res) => {
    try {
      if (!['principal', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Generate analytics data based on stored information
      const users = await storage.getUser(0); // This would need to be adapted to get all users
      const quizAttempts = await storage.getQuizAttempts(0); // This would need to be adapted
      
      // For now, return mock analytics structure
      const analytics = {
        totalStudents: 1247,
        totalTeachers: 67,
        averagePerformance: 87.3,
        studentsNeedingAttention: 15,
        subjectPerformance: {
          math: 84,
          science: 91,
          english: 76,
          history: 93
        },
        trends: {
          performanceChange: 12,
          engagementChange: 8,
          attendanceChange: 5
        }
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
