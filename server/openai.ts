import OpenAI from "openai";
import { validateAndTrimPrompt, createFallbackMindMap, createFallbackQuiz, createFallbackFlashcards } from "./utils/validation";

// Get API key from environment variables with improved error handling
const getApiKey = (): string => {
  // For development with Vite
  const viteKey = process.env.VITE_OPENAI_API_KEY;
  // For production
  const prodKey = process.env.OPENAI_API_KEY;
  
  const apiKey = viteKey || prodKey;
  
  if (!apiKey) {
    console.error("Missing OpenAI API key. Please check your environment variables.");
    console.error("Make sure OPENAI_API_KEY is set in your .env file or environment variables.");
    throw new Error("Missing OpenAI API key. Please check your environment variables.");
  }
  
  // Validate API key format (basic check)
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.error("Invalid OpenAI API key format. Please check your API key.");
    throw new Error("Invalid OpenAI API key format. Please check your API key.");
  }
  
  return apiKey;
};

// Initialize OpenAI client with proper error handling
export const openai = new OpenAI({ 
  apiKey: getApiKey(),
  timeout: 30000, // 30 second timeout for requests
  maxRetries: 2 // Allow up to 2 retries for failed requests
});

// Default model to use for all OpenAI calls
const DEFAULT_MODEL = "gpt-4o";

// Centralized error handling for OpenAI API calls
const handleOpenAIError = (error: any, fallbackMessage: string): never => {
  // Log detailed error information
  console.error('OpenAI API Error:', error.response?.data || error.message);
  console.error('Error Details:', {
    status: error.response?.status,
    headers: error.response?.headers,
    path: error.response?.config?.url
  });
  
  // For rate limiting errors, provide specific guidance
  if (error.response?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // For authentication errors
  if (error.response?.status === 401) {
    throw new Error('Authentication error. Please check your OpenAI API key.');
  }
  
  // For server errors, we could implement retry logic
  if (error.response?.status >= 500 && error.response?.status < 600) {
    console.log('Server error detected, could implement retry here');
    // Retry logic could be implemented here
  }
  
  // Throw a user-friendly error message
  throw new Error(fallbackMessage);
};

export interface FlashcardGenerationRequest {
  content: string;
  subject: string;
  gradeLevel: string;
  numberOfCards: number;
}

export interface FlashcardData {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizGenerationRequest {
  topic: string;
  subject: string;
  gradeLevel: string;
  numberOfQuestions: number;
  questionTypes: string[];
  learningStyle?: string; // visual, auditory, kinesthetic, reading/writing
  personalizedFor?: string; // general, specific user needs or preferences
  gamificationLevel?: string; // low, medium, high
  includeImages?: boolean; // whether to include image descriptions
}

export interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // seconds to answer
  points?: number; // points awarded for correct answer
  imageUrl?: string | null; // URL to an image for the question
  imageDescription?: string; // description of an ideal image for the question
}

export interface LessonPlanRequest {
  topic: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  learningStyle: string;
  includeVisuals: boolean;
}

export interface LessonPlan {
  title: string;
  summary: string;
  objectives: string[];
  structure: {
    section: string;
    duration: number;
    content: string;
    activities: string[];
  }[];
  materials: string[];
  assessment: string[];
}

export interface ExplanationRequest {
  text: string;
  level: 'kid' | 'teen' | 'parent' | 'teacher';
  context?: string;
}

export interface MindMapRequest {
  topic: string;
  subject: string;
  depth: number;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

// Generate flashcards from content
export async function generateFlashcards(request: FlashcardGenerationRequest): Promise<FlashcardData[]> {
  // Validate inputs before making API call
  const contentText = validateAndTrimPrompt(request.content);
  const subject = validateAndTrimPrompt(request.subject);
  const gradeLevel = validateAndTrimPrompt(request.gradeLevel);
  
  if (!contentText) {
    console.error('Missing content for flashcard generation');
    throw new Error('Please enter content for the flashcards');
  }
  
  if (!subject || !gradeLevel) {
    console.error('Missing subject or grade level for flashcard generation');
    throw new Error('Please enter both subject and grade level');
  }
  
  // Ensure number of cards is a valid number
  const numberOfCards = Math.max(1, Math.min(20, request.numberOfCards || 5));
  
  try {
    const promptText = `Create ${numberOfCards} educational flashcards for ${subject} at ${gradeLevel} level from the following content:

${contentText}

Generate flashcards that:
- Test key concepts and facts
- Are appropriate for ${gradeLevel} students
- Have clear, concise questions and comprehensive answers
- Include a mix of difficulty levels (easy, medium, hard)

Return the flashcards as a JSON array with this format:
{
  "flashcards": [
    {
      "question": "Clear, specific question",
      "answer": "Comprehensive answer with explanation",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    // Try with retries for rate limiting
    let retryCount = 0;
    const maxRetries = 2;
    let apiResponse: any = null;
    
    while (retryCount <= maxRetries) {
      try {
        apiResponse = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator specializing in creating effective flashcards for learning."
            },
            {
              role: "user",
              content: promptText
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });
        break; // If successful, exit the retry loop
      } catch (apiError: any) {
        retryCount++;
        if (apiError.response?.status === 429) {
          // Rate limit error - wait and retry
          console.log(`Rate limit hit, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        } else if (retryCount >= maxRetries) {
          // If we've exhausted retries or it's not a rate limit error, rethrow
          throw apiError;
        } else {
          // For other errors, wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If we get here without a response, it means all retries failed
    if (!apiResponse) {
      throw new Error('Failed to get response from OpenAI after retries');
    }

    // Extract and parse the response content
    const responseContent = apiResponse.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
        throw new Error('Invalid response format');
      }
      
      // Validate and transform each flashcard
      const flashcards = parsedResponse.flashcards.map((card: any) => {
        // Ensure all required fields are present
        if (!card.question || !card.answer) {
          throw new Error('Missing required fields in flashcard');
        }
        
        // Ensure difficulty is valid
        if (!['easy', 'medium', 'hard'].includes(card.difficulty)) {
          card.difficulty = 'medium'; // Default to medium if invalid
        }
        
        return card as FlashcardData;
      });
      
      return flashcards;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse flashcards from API response');
    }
  } catch (error: any) {
    console.error('Error generating flashcards:', error.response?.data || error.message);
    
    // Handle different types of errors
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded, using fallback flashcards');
    } else if (error.response?.status === 401) {
      console.error('Authentication error with OpenAI API key');
    } else if (error.response?.status >= 500 && error.response?.status < 600) {
      console.log('OpenAI server error, using fallback flashcards');
    }
    
    // Return fallback content if available
    return createFallbackFlashcards(contentText, subject, numberOfCards);
  }
}

// Generate quiz questions with gamification features
export async function generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
  // Validate inputs before making API call
  const topic = validateAndTrimPrompt(request.topic);
  const subject = validateAndTrimPrompt(request.subject);
  const gradeLevel = validateAndTrimPrompt(request.gradeLevel);
  
  if (!topic || !subject || !gradeLevel) {
    console.error('Missing required fields for quiz generation');
    throw new Error('Please provide topic, subject, and grade level for the quiz');
  }
  
  // Ensure number of questions is a valid number
  const numberOfQuestions = Math.max(1, Math.min(20, request.numberOfQuestions || 5));
  
  // Validate question types
  const validQuestionTypes = request.questionTypes?.filter(type => 
    ['multiple-choice', 'true-false', 'short-answer'].includes(type)
  ) || ['multiple-choice'];
  
  // Validate learning style
  const learningStyle = request.learningStyle || 'balanced';
  
  // Validate gamification level
  const gamificationLevel = request.gamificationLevel || 'medium';
  
  try {
    const prompt = `Create ${numberOfQuestions} educational quiz questions about "${topic}" for ${subject} at ${gradeLevel} level.

Question types to include: ${validQuestionTypes.join(', ')}
Learning style focus: ${learningStyle}
Gamification level: ${gamificationLevel}

For each question:
- Create appropriate difficulty (easy, medium, hard)
- Include a clear explanation for the correct answer
- For multiple-choice, provide 4 options with one correct answer
- For true-false, ensure statement is clearly true or false
- Add a suggested time limit in seconds for each question
- Assign point values (easy: 10 points, medium: 20 points, hard: 30 points)

${request.includeImages ? 'Include a brief description of an educational image that would complement each question.' : ''}

Return the questions as a JSON array with this format:
{
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"], // For multiple-choice only
      "correctAnswer": "Correct answer or option",
      "explanation": "Explanation of the correct answer",
      "difficulty": "easy|medium|hard",
      "timeLimit": 30, // seconds
      "points": 10,
      "imageDescription": "Description of an ideal image" // Only if includeImages is true
    }
  ]
}`;

    // Try with retries for rate limiting
    let retryCount = 0;
    const maxRetries = 2;
    let response;
    
    while (retryCount <= maxRetries) {
      try {
        response = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator specializing in creating engaging, accurate quiz questions tailored to specific educational needs."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });
        break; // If successful, exit the retry loop
      } catch (apiError: any) {
        retryCount++;
        if (apiError.response?.status === 429) {
          // Rate limit error - wait and retry
          console.log(`Rate limit hit, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        } else if (retryCount >= maxRetries) {
          // If we've exhausted retries or it's not a rate limit error, rethrow
          throw apiError;
        } else {
          // For other errors, wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If we get here without a response, it means all retries failed
    if (!response) {
      throw new Error('Failed to get response from OpenAI after retries');
    }

    // Extract and parse the response content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const parsedResponse = JSON.parse(content);
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format');
      }
      
      // Validate and transform each question
      const questions = parsedResponse.questions.map((q: any) => {
        // Ensure all required fields are present
        if (!q.type || !q.question || !q.correctAnswer || !q.explanation) {
          throw new Error('Missing required fields in question');
        }
        
        // Validate question type
        if (!['multiple-choice', 'true-false', 'short-answer'].includes(q.type)) {
          q.type = 'multiple-choice'; // Default to multiple-choice if invalid
        }
        
        // Ensure multiple-choice questions have options
        if (q.type === 'multiple-choice' && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
          throw new Error('Multiple-choice questions must have at least 2 options');
        }
        
        // Ensure difficulty is valid
        if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
          q.difficulty = 'medium'; // Default to medium if invalid
        }
        
        // Ensure timeLimit is a positive number
        q.timeLimit = typeof q.timeLimit === 'number' && q.timeLimit > 0 ? q.timeLimit : 30;
        
        // Ensure points is a positive number
        q.points = typeof q.points === 'number' && q.points > 0 ? q.points : 10;
        
        return q as QuizQuestion;
      });
      
      return questions;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse quiz questions from API response');
    }
  } catch (error: any) {
    console.error('Error generating quiz questions:', error.response?.data || error.message);
    
    // Handle different types of errors
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded, using fallback quiz');
    } else if (error.response?.status === 401) {
      console.error('Authentication error with OpenAI API key');
    } else if (error.response?.status >= 500 && error.response?.status < 600) {
      console.log('Server error detected, falling back to local generation');
    }
    
    // Return fallback quiz questions
    return createFallbackQuiz(topic, subject, numberOfQuestions, validQuestionTypes);
  }
}

// Generate lesson plan
export async function generateLessonPlan(request: LessonPlanRequest): Promise<LessonPlan> {
  // Validate inputs before making API call
  const topic = validateAndTrimPrompt(request.topic);
  const subject = validateAndTrimPrompt(request.subject);
  const gradeLevel = validateAndTrimPrompt(request.gradeLevel);
  
  if (!topic || !subject || !gradeLevel) {
    console.error('Missing required fields for lesson plan generation');
    throw new Error('Please provide topic, subject, and grade level for the lesson plan');
  }
  
  // Ensure duration is a valid number
  const duration = Math.max(30, Math.min(180, request.duration || 60));
  
  // Validate learning style
  const learningStyle = request.learningStyle || 'balanced';
  
  try {
    const prompt = `Create a detailed lesson plan about "${topic}" for ${subject} at ${gradeLevel} level.

Duration: ${duration} minutes
Learning style focus: ${learningStyle}
Include visuals: ${request.includeVisuals ? 'Yes' : 'No'}

The lesson plan should include:
- A clear title and summary
- 3-5 specific learning objectives
- A structured timeline with sections, durations, content, and activities
- Required materials
- Assessment strategies

Return the lesson plan as a JSON object with this format:
{
  "title": "Engaging title for the lesson",
  "summary": "Brief overview of the lesson",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "structure": [
    {
      "section": "Introduction/Warm-up",
      "duration": 10,
      "content": "Description of what will be covered",
      "activities": ["Activity 1", "Activity 2"]
    },
    {
      "section": "Main Content",
      "duration": 30,
      "content": "Description of main lesson content",
      "activities": ["Activity 1", "Activity 2"]
    },
    {
      "section": "Practice/Application",
      "duration": 15,
      "content": "Description of practice activities",
      "activities": ["Activity 1", "Activity 2"]
    },
    {
      "section": "Conclusion/Assessment",
      "duration": 5,
      "content": "Description of wrap-up",
      "activities": ["Activity 1", "Activity 2"]
    }
  ],
  "materials": ["Material 1", "Material 2", "Material 3"],
  "assessment": ["Assessment strategy 1", "Assessment strategy 2"]
}`;

    // Attempt to make the API call with retries
    let retryCount = 0;
    const maxRetries = 2;
    let response: any = null;
    
    while (retryCount <= maxRetries) {
      try {
        response = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert educator specializing in creating effective, engaging lesson plans tailored to specific educational needs."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });
        break; // If successful, exit the retry loop
      } catch (apiError: any) {
        retryCount++;
        if (apiError.response?.status === 429) {
          // Rate limit error - wait and retry
          console.log(`Rate limit hit, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        } else if (retryCount >= maxRetries) {
          // If we've exhausted retries or it's not a rate limit error, rethrow
          throw apiError;
        } else {
          // For other errors, wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If we get here without a response, it means all retries failed
    if (!response) {
      throw new Error('Failed to get response from OpenAI after retries');
    }

    // Extract and parse the response content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const lessonPlan = JSON.parse(content) as LessonPlan;
      
      // Validate required fields
      if (!lessonPlan.title || !lessonPlan.summary || !Array.isArray(lessonPlan.objectives) || 
          !Array.isArray(lessonPlan.structure) || !Array.isArray(lessonPlan.materials) || 
          !Array.isArray(lessonPlan.assessment)) {
        throw new Error('Missing required fields in lesson plan');
      }
      
      return lessonPlan;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse lesson plan from API response');
    }
  } catch (error: any) {
    console.error('Error generating lesson plan:', error.response?.data || error.message);
    
    // Handle different types of errors
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded, using fallback lesson plan');
    } else if (error.response?.status === 401) {
      console.error('Authentication error with OpenAI API key');
    } else if (error.response?.status >= 500 && error.response?.status < 600) {
      console.log('OpenAI server error, using fallback lesson plan');
    }
    
    // Return a basic fallback lesson plan
    return {
      title: `Lesson Plan: ${topic} for ${gradeLevel}`,
      summary: `A basic lesson on ${topic} for ${subject} at ${gradeLevel} level.`,
      objectives: [
        `Understand the basic concepts of ${topic}`,
        `Apply knowledge of ${topic} to solve problems`,
        `Evaluate and analyze information related to ${topic}`
      ],
      structure: [
        {
          section: "Introduction",
          duration: Math.round(duration * 0.2),
          content: `Introduction to ${topic}`,
          activities: ["Class discussion", "Brainstorming session"]
        },
        {
          section: "Main Content",
          duration: Math.round(duration * 0.5),
          content: `Detailed exploration of ${topic}`,
          activities: ["Lecture", "Guided practice"]
        },
        {
          section: "Conclusion",
          duration: Math.round(duration * 0.3),
          content: `Review and assessment of ${topic}`,
          activities: ["Group activity", "Individual assessment"]
        }
      ],
      materials: ["Textbook", "Worksheets", "Digital resources"],
      assessment: ["Quiz", "Group project", "Individual assignment"]
    };
  }
}

// Generate mind map structure
export async function generateMindMap(request: MindMapRequest): Promise<MindMapNode> {
  // Validate inputs before making API call
  const topic = validateAndTrimPrompt(request.topic);
  const subject = validateAndTrimPrompt(request.subject);
  
  if (!topic || !subject) {
    console.error('Missing topic or subject for mind map generation');
    throw new Error('Please enter both topic and subject for the mind map');
  }
  
  // Ensure depth is a valid number
  const depth = Math.max(1, Math.min(3, request.depth || 2));
  
  try {
    const prompt = `Create a hierarchical mind map about "${topic}" for ${subject} with a depth of ${depth} levels.

The mind map should:
- Start with the main topic as the central node
- Branch out to key subtopics
- Further branch to specific concepts, examples, or details
- Include clear, concise labels for each node
- Be logically organized and comprehensive

Return the mind map as a JSON object with this format:
{
  "id": "1",
  "label": "Main Topic",
  "children": [
    {
      "id": "1.1",
      "label": "Subtopic 1",
      "children": [
        {
          "id": "1.1.1",
          "label": "Concept 1"
        },
        {
          "id": "1.1.2",
          "label": "Concept 2"
        }
      ]
    },
    {
      "id": "1.2",
      "label": "Subtopic 2",
      "children": [
        {
          "id": "1.2.1",
          "label": "Concept 3"
        },
        {
          "id": "1.2.2",
          "label": "Concept 4"
        }
      ]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert in creating educational mind maps that organize information in a clear, hierarchical structure."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Extract and parse the response content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const mindMap = JSON.parse(content) as MindMapNode;
      
      // Validate required fields
      if (!mindMap.id || !mindMap.label) {
        throw new Error('Missing required fields in mind map');
      }
      
      return mindMap;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse mind map from API response');
    }
  } catch (error: any) {
    console.error('Error generating mind map:', error.response?.data || error.message);
    
    // Return fallback content if available
    return createFallbackMindMap(topic || 'Learning Topic');
  }
}

// Explain text at different levels
export async function explainText(request: ExplanationRequest): Promise<string> {
  // Validate inputs before making API call
  const text = validateAndTrimPrompt(request.text);
  
  if (!text) {
    console.error('Missing text for explanation');
    throw new Error('Please enter text to explain');
  }
  
  // Validate level
  const level = ['kid', 'teen', 'parent', 'teacher'].includes(request.level) ? request.level : 'teen';
  
  // Optional context
  const context = validateAndTrimPrompt(request.context) || '';
  
  try {
    const levelDescriptions = {
      kid: "elementary school student (ages 6-10)",
      teen: "middle or high school student (ages 11-17)",
      parent: "parent with basic subject knowledge",
      teacher: "education professional with subject expertise"
    };
    
    const prompt = `Explain the following text in a way that's appropriate for a ${levelDescriptions[level]}:

TEXT TO EXPLAIN:
${text}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Your explanation should:
- Use vocabulary and concepts appropriate for the audience
- Break down complex ideas into understandable components
- Use analogies or examples when helpful
- Be accurate and educational
- Be engaging and clear`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert educator skilled at explaining complex concepts at different levels of understanding."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Extract the response content
    const explanation = response.choices[0].message.content;
    if (!explanation) {
      throw new Error('Empty response from OpenAI');
    }
    
    return explanation;
  } catch (error: any) {
    console.error('Error generating explanation:', error.response?.data || error.message);
    
    // Return a simple fallback explanation
    return `Here's a simple explanation of "${text.substring(0, 50)}...": This is a concept related to ${request.context || 'the subject'}. To understand it better, try breaking it down into smaller parts and researching each one.`;
  }
}

// AI Tutor chat response
export async function generateTutorResponse(
  message: string, 
  userId: number, 
  context: any[] = [],
  userLevel: string = "middle school"
): Promise<string> {
  // Validate inputs before making API call
  const sanitizedMessage = validateAndTrimPrompt(message);
  // Ensure userLevel is a string before passing to validateAndTrimPrompt
  const sanitizedUserLevel = validateAndTrimPrompt(userLevel || "middle school");
  
  if (!sanitizedMessage) {
    console.error('Missing message for tutor response');
    return "I need a question or topic to help you with. Could you please provide more details?";
  }
  
  // Validate context array
  const validContext = Array.isArray(context) ? context : [];
  
  try {
    const systemPrompt = `You are EduMind AI, a helpful and encouraging AI tutor for ${sanitizedUserLevel} students. You:

- Explain concepts clearly and age-appropriately
- Ask follow-up questions to check understanding
- Provide examples and analogies
- Encourage students when they struggle
- Break down complex problems into steps
- Adapt your teaching style to the student's needs

Keep responses conversational and supportive. If asked about homework, guide the student through the thinking process rather than giving direct answers.`;

    const contextString = validContext.length > 0 
      ? `Previous conversation context:\n${validContext.map(c => `${c.role}: ${c.content}`).join('\n')}\n\n`
      : '';

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${contextString}Student message: ${sanitizedMessage}`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    if (!response.choices[0].message.content) {
      throw new Error('Empty response from OpenAI');
    }
    
    return response.choices[0].message.content;
  } catch (error: any) {
    console.error('Error generating tutor response:', error.response?.data || error.message);
    
    // For 5xx errors, we could implement retry logic
    if (error.response?.status >= 500 && error.response?.status < 600) {
      console.log('Server error detected, could implement retry here');
      // Retry logic could be implemented here
    }
    
    // Return a friendly error message
    return "I'm sorry, I'm having trouble processing your request right now. Could you try asking in a different way, or try again in a moment?";
  }
}

// Generate educational image prompt
export async function generateEducationalImage(topic: string, subject: string): Promise<{ url: string }> {
  // Validate inputs before making API call
  const sanitizedTopic = validateAndTrimPrompt(topic);
  const sanitizedSubject = validateAndTrimPrompt(subject);
  
  if (!sanitizedTopic || !sanitizedSubject) {
    console.error('Missing topic or subject for image generation');
    throw new Error('Please enter both topic and subject for the image');
  }
  
  try {
    const prompt = `Create an educational illustration for "${sanitizedTopic}" in ${sanitizedSubject}. The image should be:
- Clear and informative
- Appropriate for students
- Visually engaging
- Scientifically/academically accurate
- Suitable for classroom use`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    // Safely handle the response data
    if (!response.data || response.data.length === 0 || !response.data[0].url) {
      throw new Error('Invalid response from image generation API');
    }
    
    return { url: response.data[0].url };
  } catch (error: any) {
    console.error('Error generating educational image:', error.response?.data || error.message);
    throw new Error('Failed to generate educational image');
  }
}

// Transcribe audio using Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<{ text: string }> {
  try {
    // Note: In a real implementation, you'd save the buffer as a file or use a stream
    // For now, we'll return a placeholder since we can't easily handle file uploads in this setup
    throw new Error('Audio transcription requires file upload implementation');
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}
