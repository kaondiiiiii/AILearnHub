import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { openai } from '../openai';

const router = Router();

// Define user interface with role property
interface UserRequest extends Request {
  user?: {
    id: number;
    role: string;
    [key: string]: any;
  };
}

// Middleware to check if user is a teacher
const isTeacher = (req: UserRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'teacher') {
    res.status(403).json({ error: 'Access denied. Teacher role required.' });
    return;
  }
  next();
};

// Endpoint for teachers to analyze student quiz performance
router.post('/analyze-student-performance', isTeacher, async (req: UserRequest, res: Response) => {
  try {
    const { quizId } = req.body;
    
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }
    
    // Get the quiz
    const quiz = await storage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Get all attempts for this quiz
    const attempts = await storage.getQuizAttemptsByQuizId(quizId);
    if (!attempts || attempts.length === 0) {
      return res.status(404).json({ error: 'No attempts found for this quiz' });
    }
    
    // Get student data for the attempts
    const studentData = [];
    for (const attempt of attempts) {
      const student = await storage.getUser(attempt.userId);
      if (student && student.role === 'student') {
        studentData.push({
          name: `${student.firstName} ${student.lastName}`,
          id: student.id,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          averageScore: Math.round((attempt.score / attempt.totalQuestions) * 100),
          timeSpent: attempt.timeSpent
        });
      }
    }
    
    // Use OpenAI to analyze the quiz results
    const analysisPrompt = `
      Analyze the following quiz results:
      
      Quiz: ${quiz.title}
      Subject: ${quiz.subject}
      Grade: ${quiz.grade}
      
      Student Performance:
      ${studentData.map(s => `- ${s.name}: ${s.averageScore}% (${s.score}/${s.totalQuestions})`).join('\n')}
      
      Provide a brief analysis of student performance, focusing on:
      1. Overall class performance
      2. Areas where students might need additional help
      3. Recommendations for teaching strategies
      
      Keep the analysis concise and focused only on quiz performance.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an educational analytics assistant. Provide concise, actionable insights based on quiz performance data." },
        { role: "user", content: analysisPrompt }
      ],
      max_tokens: 500,
    });
    
    const analysis = completion.choices[0].message.content;
    
    res.json({
      analysis,
      studentData,
      quizTitle: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade
    });
    
  } catch (error) {
    console.error('Error analyzing student performance:', error);
    res.status(500).json({ error: 'Failed to analyze student performance' });
  }
});

export default router;
