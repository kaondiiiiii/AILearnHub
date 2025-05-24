import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

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
}

export interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
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
  try {
    const prompt = `Create ${request.numberOfCards} educational flashcards for ${request.subject} at ${request.gradeLevel} level from the following content:

${request.content}

Generate flashcards that:
- Test key concepts and facts
- Are appropriate for ${request.gradeLevel} students
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who creates engaging and effective flashcards for students. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{"flashcards": []}');
    return result.flashcards || [];
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards');
  }
}

// Generate quiz questions
export async function generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
  try {
    const prompt = `Create ${request.numberOfQuestions} quiz questions about "${request.topic}" for ${request.subject} at ${request.gradeLevel} level.

Question types to include: ${request.questionTypes.join(', ')}

Generate questions that:
- Test understanding of key concepts
- Are appropriate for the grade level
- Include clear explanations for answers
- Vary in difficulty

Return as JSON array with this format:
{
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer",
      "question": "Question text",
      "options": ["A", "B", "C", "D"] (only for multiple-choice),
      "correctAnswer": "Correct answer",
      "explanation": "Why this is correct"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who creates fair and educational quiz questions. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
    return result.questions || [];
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz questions');
  }
}

// Generate lesson plan
export async function generateLessonPlan(request: LessonPlanRequest): Promise<LessonPlan> {
  try {
    const prompt = `Create a comprehensive ${request.duration}-minute lesson plan for "${request.topic}" in ${request.subject} for ${request.gradeLevel} students.

Requirements:
- Learning style focus: ${request.learningStyle}
- Include visuals: ${request.includeVisuals ? 'Yes' : 'No'}
- Age-appropriate content and activities
- Clear learning objectives
- Structured timeline
- Assessment methods

Return as JSON with this format:
{
  "title": "Lesson title",
  "summary": "Brief lesson overview",
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "structure": [
    {
      "section": "Introduction",
      "duration": 5,
      "content": "What will be covered",
      "activities": ["Activity 1", "Activity 2"]
    }
  ],
  "materials": ["Material 1", "Material 2"],
  "assessment": ["Assessment method 1", "Assessment method 2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer who creates engaging and effective lesson plans. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as LessonPlan;
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw new Error('Failed to generate lesson plan');
  }
}

// Explain text at different levels
export async function explainText(request: ExplanationRequest): Promise<string> {
  try {
    const levelPrompts = {
      kid: "Explain this in very simple terms that a young child (ages 6-10) would understand. Use simple words and fun examples.",
      teen: "Explain this for a teenager (ages 13-17). Use relatable examples and clear explanations.",
      parent: "Explain this for a parent who wants to understand their child's schoolwork. Include context and practical applications.",
      teacher: "Provide a detailed pedagogical explanation suitable for an educator, including teaching strategies and common misconceptions."
    };

    const prompt = `${levelPrompts[request.level]}

Text to explain: "${request.text}"
${request.context ? `Context: ${request.context}` : ''}

Provide a clear, engaging explanation appropriate for the target audience.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a skilled educator who can explain complex concepts at different levels. Tailor your explanations to the specific audience."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || "I couldn't generate an explanation for that text.";
  } catch (error) {
    console.error('Error explaining text:', error);
    throw new Error('Failed to explain text');
  }
}

// Generate mind map structure
export async function generateMindMap(request: MindMapRequest): Promise<MindMapNode> {
  try {
    const prompt = `Create a hierarchical mind map for "${request.topic}" in ${request.subject} with ${request.depth} levels of depth.

The mind map should:
- Have the main topic as the root
- Branch into major subtopics
- Include relevant details and concepts
- Be educationally structured

Return as JSON with this format:
{
  "id": "root",
  "label": "Main Topic",
  "children": [
    {
      "id": "subtopic1",
      "label": "Subtopic 1",
      "children": [
        {
          "id": "detail1",
          "label": "Detail 1"
        }
      ]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who creates well-structured mind maps for learning. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{"id": "root", "label": "Topic", "children": []}');
    return result as MindMapNode;
  } catch (error) {
    console.error('Error generating mind map:', error);
    throw new Error('Failed to generate mind map');
  }
}

// AI Tutor chat response
export async function generateTutorResponse(
  message: string, 
  userId: number, 
  context: any[] = [],
  userLevel: string = "middle school"
): Promise<string> {
  try {
    const systemPrompt = `You are EduMind AI, a helpful and encouraging AI tutor for ${userLevel} students. You:

- Explain concepts clearly and age-appropriately
- Ask follow-up questions to check understanding
- Provide examples and analogies
- Encourage students when they struggle
- Break down complex problems into steps
- Adapt your teaching style to the student's needs

Keep responses conversational and supportive. If asked about homework, guide the student through the thinking process rather than giving direct answers.`;

    const contextString = context.length > 0 
      ? `Previous conversation context:\n${context.map(c => `${c.role}: ${c.content}`).join('\n')}\n\n`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${contextString}Student message: ${message}`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that. Could you try asking in a different way?";
  } catch (error) {
    console.error('Error generating tutor response:', error);
    throw new Error('Failed to generate tutor response');
  }
}

// Generate educational image prompt
export async function generateEducationalImage(topic: string, subject: string): Promise<{ url: string }> {
  try {
    const prompt = `Create an educational illustration for "${topic}" in ${subject}. The image should be:
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

    return { url: response.data[0].url || '' };
  } catch (error) {
    console.error('Error generating educational image:', error);
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
