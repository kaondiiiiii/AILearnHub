import { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Get API key directly for this specific request
const getOpenAIKey = (): string => {
  // For development with Vite
  const viteKey = process.env.VITE_OPENAI_API_KEY;
  // For production
  const prodKey = process.env.OPENAI_API_KEY;
  
  const apiKey = viteKey || prodKey;
  
  if (!apiKey) {
    console.error("Missing OpenAI API key. Please check your environment variables.");
    throw new Error("Missing OpenAI API key. Please check your environment variables.");
  }
  
  // Validate API key format (basic check)
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.error("Invalid OpenAI API key format. Please check your API key.");
    throw new Error("Invalid OpenAI API key format. Please check your API key.");
  }
  
  return apiKey;
};

// Create a dedicated OpenAI client for quiz analysis
const createOpenAIClient = () => {
  return new OpenAI({ 
    apiKey: getOpenAIKey(),
    timeout: 30000, // 30 second timeout for requests
    maxRetries: 2 // Allow up to 2 retries for failed requests
  });
};

export default async function handleAnalyzeQuizResults(req: Request, res: Response) {
  try {
    console.log('Analyzing quiz results with body:', JSON.stringify(req.body));
    const { topic, subject, questions, userAnswers, score } = req.body;
    
    if (!topic || !subject || !questions || !userAnswers || !score) {
      console.error('Missing required fields:', { topic, subject, questions: !!questions, userAnswers: !!userAnswers, score });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Format the user's answers and results for the AI
    const formattedQuestions = questions.map((q: any, index: number) => {
      const questionNumber = index + 1;
      const userAnswer = userAnswers[index] || 'No answer provided';
      const isCorrect = userAnswer === q.correctAnswer;
      
      return `
Question ${questionNumber}: ${q.question}
User's Answer: ${userAnswer}
Correct Answer: ${q.correctAnswer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
Explanation: ${q.explanation || 'No explanation provided'}
      `;
    }).join('\n');
    
    // Format the prompt for OpenAI with a conversational, chatbot-like personalized response
    const prompt = `
Analyze the following quiz results for a student studying ${topic} in ${subject}:

Questions and Answers:
${formattedQuestions}

Overall Score: ${score}

I need you to respond as if you're a friendly, supportive AI tutor having a one-on-one conversation with this student. Your response should feel like a personalized chat message that addresses their specific performance on this quiz.

Your response should include:

1. A warm, personalized greeting that acknowledges their effort and mentions their score in an encouraging way

2. A brief discussion of each question they got RIGHT:
   - Acknowledge what they understood correctly
   - Briefly explain why this concept is important

3. A more detailed discussion of each question they got WRONG:
   - Explain why their answer wasn't correct in a supportive way
   - Provide a clear, conversational explanation of the correct answer
   - Connect this concept to the broader topic

4. A personalized improvement plan:
   - Identify 2-3 specific concepts they should focus on learning next
   - Suggest how they might approach learning these concepts
   - Explain how improving in these areas will help them master ${topic}

5. End with an encouraging message that motivates them to continue learning

Use a warm, conversational tone throughout. Address the student directly as "you" and write as if you're having a real-time chat conversation. Include some encouraging phrases and maybe even a touch of appropriate humor. Make your response feel like it was written specifically for this student based on their unique quiz performance.

Avoid formal academic language or structured sections with headings. Instead, make your response flow naturally like a chat message from a supportive tutor who knows them well.
    `;
    
    console.log('Sending enhanced prompt to OpenAI for personalized analysis');
    
    try {
      // Create a dedicated OpenAI client with proper API key
      const openaiClient = createOpenAIClient();
      console.log('OpenAI client created with API key');
      
      // Call OpenAI API for analysis with enhanced parameters
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // Ensuring we use GPT-4o for best analysis
        messages: [
          {
            role: "system",
            content: "You are EduBuddy, a friendly and supportive AI tutor with a conversational, chatbot-like personality. You excel at creating personalized, encouraging feedback that feels like a one-on-one chat. Your tone is warm, supportive, and occasionally includes appropriate humor. You address students directly using 'you' language and write as if you're having a real-time conversation. You avoid formal academic language and structured sections with headings. Instead, your responses flow naturally like chat messages from a supportive friend who happens to be an expert tutor. While being encouraging, you're also honest about areas needing improvement and provide clear, specific guidance on how to improve."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7, // Slightly higher temperature for more conversational, natural responses
        max_tokens: 2000 // Increased token limit for detailed personalized feedback
      });
      
      // Extract the analysis from the response
      const analysis = response.choices[0]?.message?.content || "Unable to generate analysis.";
      console.log('Analysis generated successfully');
      
      // Return the analysis
      return res.status(200).json({ analysis });
    } catch (openAiError: any) {
      console.error('OpenAI API error:', openAiError);
      
      // Create a more personalized fallback analysis if OpenAI API fails
      console.log('Creating personalized fallback analysis due to error');
      
      // Try one more time with a simpler prompt
      try {
        console.log('Attempting simplified analysis with new client');
        const openaiClientRetry = createOpenAIClient();
        
        const simplePrompt = `
Provide a friendly, conversational analysis of these quiz results:
- Topic: ${topic} in ${subject}
- Score: ${score}
- The student got ${questions.filter((q: any, idx: number) => userAnswers[idx] === q.correctAnswer).length} questions correct out of ${questions.length}.

Give a brief, encouraging response that mentions what they did well and 1-2 areas to improve.
`;
        
        const retryResponse = await openaiClientRetry.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a friendly tutor providing a brief, encouraging quiz analysis. Keep it conversational and personal."
            },
            {
              role: "user",
              content: simplePrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        if (retryResponse.choices[0].message.content) {
          return res.json({ analysis: retryResponse.choices[0].message.content });
        }
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
      
      // If all else fails, use a static fallback
      const correctCount = questions.filter((q: any, idx: number) => userAnswers[idx] === q.correctAnswer).length;
      const scorePercent = Math.round((correctCount / questions.length) * 100);
      
      const fallbackAnalysis = `
Hey there! 👋

I've looked at your ${topic} quiz results, and you scored ${score} (${scorePercent}%).

You showed good understanding in some areas! For the questions you missed, I'd recommend focusing on the core concepts and maybe creating some flashcards to help reinforce those ideas.

Keep practicing - you're doing great! Learning ${topic} takes time, and every quiz helps you improve.

Let me know if you want more specific help with any of the concepts!
      `;
      
      return res.status(200).json({ analysis: fallbackAnalysis });
    }
    
  } catch (error: any) {
    console.error('Error analyzing quiz results:', error);
    
    // Handle different types of errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to analyze quiz results', 
      message: error.message || 'Unknown error' 
    });
  }
}
