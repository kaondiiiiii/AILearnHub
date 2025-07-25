import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Loader2, Mic, Volume2, Download, Copy, RotateCcw } from "lucide-react";

// Animated Flashcard Component
function FlashcardComponent({ card, index }: { card: any; index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="text-center">
            <div className="text-sm font-bold mb-2 opacity-90">Question {index + 1}</div>
            <div className="text-lg font-semibold leading-tight">{card.question}</div>
            <div className="mt-4 text-sm opacity-75">Click to reveal answer</div>
          </div>
        </div>
        <div className="flashcard-back">
          <div className="text-center">
            <div className="text-sm font-bold mb-2 opacity-90">Answer</div>
            <div className="text-lg font-semibold leading-tight">{card.answer}</div>
            <div className="mt-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {card.difficulty || 'Medium'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kahoot-style Quiz Component
function KahootQuizComponent({ questions }: { questions: any[] }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
    
    setTimeout(() => {
      if (answer === questions[currentQuestion].correctAnswer) {
        setScore(score + 1);
      }
      
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
      } else {
        setQuizComplete(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl text-white">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <div className="text-xl mb-4">Your Score: {score}/{questions.length}</div>
        <div className="text-lg mb-6">
          {score === questions.length ? "Perfect! Outstanding work! 🌟" :
           score >= questions.length * 0.8 ? "Excellent job! 👏" :
           score >= questions.length * 0.6 ? "Good work! Keep it up! 💪" :
           "Keep practicing! You're learning! 📚"}
        </div>
        <Button onClick={resetQuiz} className="bg-white text-blue-600 hover:bg-gray-100">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-600 mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-3 border-blue-800 shadow-lg">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {question.question}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options?.map((option: string, index: number) => {
            const optionLetter = options[index];
            const isCorrect = option === question.correctAnswer;
            const isSelected = selectedAnswer === option;
            
            let optionClass = `quiz-option quiz-option-${optionLetter.toLowerCase()} p-6 rounded-xl text-center font-bold text-lg cursor-pointer`;
            
            if (showAnswer) {
              if (isCorrect) {
                optionClass += ' correct';
              } else if (isSelected && !isCorrect) {
                optionClass += ' incorrect';
              }
            } else if (isSelected) {
              optionClass += ' selected';
            }

            return (
              <div
                key={index}
                className={optionClass}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="font-black text-2xl mb-2">{optionLetter}</div>
                <div>{option}</div>
              </div>
            );
          })}
        </div>

        {showAnswer && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="font-semibold text-gray-700 mb-2">Explanation:</div>
              <div className="text-gray-600">{question.explanation}</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-gray-600">
        Score: {score}/{currentQuestion + (showAnswer ? 1 : 0)}
      </div>
    </div>
  );
}

interface ToolDetailPageProps {
  toolId: string;
}

export default function ToolDetailPage() {
  const [location, navigate] = useLocation();
  const toolId = new URLSearchParams(location.split('?')[1] || '').get('tool') || '';
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Role-based access validation
  const validateToolAccess = (toolId: string, userRole: string) => {
    const studentTools = ['ai-study-buddy', 'explain-text', 'homework-assistant', 'concept-rewriter', 
                         'voice-tutor', 'story-generator', 'poetry-maker', 'daily-plan', 'ai-journal', 
                         'speech-coach', 'memory-booster', 'language-translator', 'multilingual-assistant', 
                         'emoji-summarizer', 'ai-flashcard-generator', 'flashcard-generator', 'quiz-generator', 'ai-summarizer'];
    
    const teacherTools = ['grading-assistant', 'worksheet-generator', 'progress-analyzer', 'test-generator',
                         'essay-evaluator', 'slide-builder', 'class-summary', 'feedback-generator', 'research-assistant',
                         'lesson-plan-generator', 'image-creator'];
    
    const adminTools = ['school-insights', 'teacher-activity', 'risk-predictor', 'curriculum-scanner',
                       'intervention-suggestions', 'meeting-notes', 'parent-communication', 'report-generator',
                       'policy-assistant', 'schedule-optimizer'];
    
    const parentTools = ['parent-summary', 'home-support', 'behavior-translator', 'progress-qa', 'lesson-playback'];
    
    if (userRole === 'admin') return true;
    if (userRole === 'teacher' && (teacherTools.includes(toolId) || studentTools.includes(toolId))) return true;
    if (userRole === 'student' && studentTools.includes(toolId)) return true;
    if (userRole === 'parent' && parentTools.includes(toolId)) return true;
    
    return false;
  };
  
  // Check access on component mount
  if (!validateToolAccess(toolId, user?.role || 'student')) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            This tool is not available for your user role. Please contact your administrator if you need access.
          </p>
          <Button onClick={() => navigate('/tools')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Available Tools
          </Button>
        </div>
      </div>
    );
  }
  
  // Form states
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("");
  const [result, setResult] = useState<any>(null);

  // AI Generation Mutations
  const flashcardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/generate-flashcards", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Flashcards generated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to generate flashcards", variant: "destructive" });
    }
  });

  const quizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/generate-quiz", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Quiz generated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to generate quiz", variant: "destructive" });
    }
  });

  const summarizerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/explain-text", {
        text: data.content,
        level: "teen",
        context: "summarize this content"
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ summary: data.explanation });
      toast({ title: "Content summarized successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to summarize content", variant: "destructive" });
    }
  });

  const lessonPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/generate-lesson-plan", {
        topic: data.topic || data.content,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        duration: 45,
        learningStyle: "mixed",
        includeVisuals: true
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Lesson plan generated successfully!", description: "Ready for your classroom!" });
    },
    onError: () => {
      toast({ title: "Failed to generate lesson plan", variant: "destructive" });
    }
  });

  // Teacher-specific tools
  const teacherToolMutation = useMutation({
    mutationFn: async (data: any) => {
      let specializedPrompt = data.content;
      
      switch (toolId) {
        case 'grading-assistant':
          specializedPrompt = `As a grading assistant, evaluate this student work: "${data.content}". Provide constructive feedback, identify strengths and areas for improvement, and suggest a grade with detailed reasoning. Be encouraging but honest.`;
          break;
        case 'worksheet-generator':
          specializedPrompt = `Create a comprehensive worksheet for ${data.subject} at ${data.gradeLevel} level on the topic: ${data.content}. Include various question types, clear instructions, and an answer key.`;
          break;
        case 'progress-analyzer':
          specializedPrompt = `Analyze this student progress data: ${data.content}. Identify patterns, strengths, weaknesses, and provide specific recommendations for improvement and next steps.`;
          break;
        case 'test-generator':
          specializedPrompt = `Create a comprehensive test for ${data.subject} at ${data.gradeLevel} level covering: ${data.content}. Include multiple question types, clear rubrics, and varying difficulty levels.`;
          break;
        case 'essay-evaluator':
          specializedPrompt = `Evaluate this essay: "${data.content}". Assess logic, grammar, coherence, argument structure, and provide detailed feedback with specific suggestions for improvement.`;
          break;
        case 'slide-builder':
          specializedPrompt = `Create presentation slides for this lesson content: ${data.content}. Suggest slide titles, key points, visual elements, and interactive activities for ${data.gradeLevel} students.`;
          break;
        case 'class-summary':
          specializedPrompt = `Write a comprehensive class summary for today's lesson on: ${data.content}. Include key concepts covered, student participation, learning objectives met, and homework assignments.`;
          break;
        case 'feedback-generator':
          specializedPrompt = `Generate constructive feedback comments for report cards based on this student information: ${data.content}. Be specific, encouraging, and provide actionable suggestions for improvement.`;
          break;
        case 'research-assistant':
          specializedPrompt = `Find and summarize recent educational research and resources related to: ${data.content}. Provide credible sources, key findings, and practical applications for teaching.`;
          break;
        default:
          specializedPrompt = `As an educational professional, help with: ${data.content}`;
      }

      const res = await apiRequest("POST", "/api/ai/chat", {
        message: specializedPrompt,
        context: { 
          tool: toolId,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          userRole: 'teacher'
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ response: data.response });
      toast({ title: "Professional content generated!", description: "Tailored for educators!" });
    },
    onError: () => {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  });

  // Admin-specific tools
  const adminToolMutation = useMutation({
    mutationFn: async (data: any) => {
      let specializedPrompt = data.content;
      
      switch (toolId) {
        case 'school-insights':
          specializedPrompt = `Generate comprehensive school-wide insights from this data: ${data.content}. Provide trends, performance analysis, recommendations for improvement, and actionable strategies for administration.`;
          break;
        case 'teacher-activity':
          specializedPrompt = `Analyze teacher activity and engagement data: ${data.content}. Identify top performers, areas needing support, and provide recommendations for professional development.`;
          break;
        case 'risk-predictor':
          specializedPrompt = `Analyze student data to identify at-risk students: ${data.content}. Flag potential issues, suggest intervention strategies, and provide early warning indicators.`;
          break;
        case 'curriculum-scanner':
          specializedPrompt = `Scan curriculum coverage data: ${data.content}. Identify gaps, overlaps, alignment issues, and suggest improvements to ensure comprehensive coverage.`;
          break;
        case 'intervention-suggestions':
          specializedPrompt = `Based on this performance data: ${data.content}, suggest specific interventions and strategies to improve student outcomes. Include timelines and success metrics.`;
          break;
        case 'meeting-notes':
          specializedPrompt = `Summarize these meeting points: ${data.content}. Create professional meeting notes with action items, decisions made, and follow-up requirements.`;
          break;
        case 'parent-communication':
          specializedPrompt = `Create parent communication content about: ${data.content}. Make it clear, informative, and engaging for school newsletters and notices.`;
          break;
        case 'report-generator':
          specializedPrompt = `Generate a comprehensive report on: ${data.content}. Include executive summary, detailed analysis, recommendations, and next steps formatted professionally.`;
          break;
        case 'policy-assistant':
          specializedPrompt = `Draft a school policy regarding: ${data.content}. Include purpose, scope, procedures, responsibilities, and compliance requirements.`;
          break;
        case 'schedule-optimizer':
          specializedPrompt = `Optimize school scheduling for: ${data.content}. Consider student needs, teacher availability, resource allocation, and suggest optimal time blocks.`;
          break;
        default:
          specializedPrompt = `As a school administrator, help with: ${data.content}`;
      }

      const res = await apiRequest("POST", "/api/ai/chat", {
        message: specializedPrompt,
        context: { 
          tool: toolId,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          userRole: 'admin'
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ response: data.response });
      toast({ title: "Administrative content generated!", description: "Professional insights ready!" });
    },
    onError: () => {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  });

  // Parent-specific tools
  const parentToolMutation = useMutation({
    mutationFn: async (data: any) => {
      let specializedPrompt = data.content;
      
      switch (toolId) {
        case 'parent-summary':
          specializedPrompt = `Explain in simple, parent-friendly terms how this child is doing: ${data.content}. Focus on progress, achievements, and areas where parents can help at home.`;
          break;
        case 'home-support':
          specializedPrompt = `Provide specific, practical tips for parents to help their child with: ${data.content}. Include activities, resources, and strategies that work at home.`;
          break;
        case 'behavior-translator':
          specializedPrompt = `Translate this school behavior report into plain English for parents: ${data.content}. Explain what it means and suggest positive next steps.`;
          break;
        case 'progress-qa':
          specializedPrompt = `Answer this parent's question about their child's progress: ${data.content}. Be reassuring, informative, and provide actionable guidance.`;
          break;
        case 'lesson-playback':
          specializedPrompt = `Summarize what was covered in class for a parent whose child missed this lesson: ${data.content}. Include key concepts and suggested review activities.`;
          break;
        default:
          specializedPrompt = `Help this parent understand: ${data.content}`;
      }

      const res = await apiRequest("POST", "/api/ai/chat", {
        message: specializedPrompt,
        context: { 
          tool: toolId,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          userRole: 'parent'
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ response: data.response });
      toast({ title: "Parent-friendly content ready!", description: "Clear, helpful guidance provided!" });
    },
    onError: () => {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (data: any) => {
      let specializedPrompt = data.content;
      
      // Add subject specialization and strict boundaries
      const subjectConstraint = data.subject ? `You are specialized in ${data.subject} education. Only provide answers related to ${data.subject}. If the question is outside ${data.subject}, politely redirect to the subject.` : '';
      const gradeConstraint = data.gradeLevel ? `Adapt your response for ${data.gradeLevel} level students.` : '';
      
      // Customize prompts based on tool type with strict specialization
      switch (toolId) {
        case 'ai-study-buddy':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a friendly AI study buddy specialized in ${data.subject || 'academics'}, help the student with this ${data.subject || 'academic'} question: ${data.content}. ONLY answer if this relates to ${data.subject || 'academics'}. If not, say "I can only help with ${data.subject || 'academic'} questions. Please ask about ${data.subject || 'your studies'}." Provide encouraging, clear explanations and ask follow-up questions to ensure understanding.`;
          break;
        case 'homework-assistant':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a ${data.subject || 'academic'} homework assistant, guide the student through this ${data.subject || 'academic'} problem step-by-step WITHOUT giving direct answers: ${data.content}. ONLY help with ${data.subject || 'academic'} questions. If this isn't ${data.subject || 'academic'}-related, say "I specialize in ${data.subject || 'academic'} homework only." Ask leading questions and provide hints to help them discover the solution themselves.`;
          break;
        case 'concept-rewriter':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a ${data.subject || 'academic'} concept simplifier, take this ${data.subject || 'academic'} concept and explain it in much simpler terms that a ${data.gradeLevel || 'student'} can easily understand: ${data.content}. ONLY work with ${data.subject || 'academic'} concepts. Use analogies, examples, and simple language appropriate for ${data.subject || 'academic'} learning.`;
          break;
        case 'voice-tutor':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a patient ${data.subject || 'academic'} voice tutor, answer this ${data.subject || 'academic'} question clearly: ${data.content}. ONLY answer ${data.subject || 'academic'} questions. If this isn't about ${data.subject || 'academics'}, redirect to ${data.subject || 'academic'} topics. Provide additional context for better understanding.`;
          break;
        case 'explain-text':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a ${data.subject || 'academic'} text explainer, explain this ${data.subject || 'academic'} text in simple, clear terms for a ${data.gradeLevel || 'student'}: ${data.content}. ONLY explain ${data.subject || 'academic'} content. Break down difficult ${data.subject || 'academic'} concepts and provide context.`;
          break;
        case 'story-generator':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a ${data.subject || 'educational'} story generator, continue this ${data.subject || 'educational'} story in an engaging way: "${data.content}". ONLY create stories related to ${data.subject || 'educational'} topics. Make it creative but incorporate ${data.subject || 'educational'} learning elements appropriate for ${data.gradeLevel || 'students'}.`;
          break;
        case 'poetry-maker':
          specializedPrompt = `${subjectConstraint} ${gradeConstraint} As a ${data.subject || 'educational'} poetry creator, create a beautiful poem based on these ${data.subject || 'educational'} facts or concepts: ${data.content}. ONLY create poems about ${data.subject || 'educational'} topics. Make it educational and inspiring for ${data.gradeLevel || 'students'} studying ${data.subject || 'academics'}.`;
          break;
        case 'image-creator':
          specializedPrompt = `As an educational image creator specialized in ${data.subject || 'academic'} content, I need to generate a ${data.subject || 'educational'} illustration for: ${data.content}. IMPORTANT: Only generate images that are directly related to ${data.subject || 'educational'} learning, appropriate for ${data.gradeLevel || 'students'}, and suitable for classroom use. The image should help students understand ${data.subject || 'academic'} concepts better.`;
          break;
        case 'daily-plan':
          specializedPrompt = `Create a personalized daily learning plan based on these subjects/topics: ${data.content}. Include study times, breaks, and specific activities for a ${gradeLevel || 'student'}.`;
          break;
        case 'ai-journal':
          specializedPrompt = `Provide thoughtful reflection prompts and feedback for this journal entry: ${data.content}. Help the student think deeper about their learning experience.`;
          break;
        case 'speech-coach':
          specializedPrompt = `As a speech coach, provide feedback and improvement tips for this speech content: ${data.content}. Focus on clarity, structure, and engagement techniques.`;
          break;
        case 'memory-booster':
          specializedPrompt = `Create memory techniques and mnemonics to help remember this content: ${data.content}. Provide spaced repetition strategies and memory tips.`;
          break;
        case 'language-translator':
          specializedPrompt = `Translate and simplify this content for easier understanding: ${data.content}. Provide the translation and then explain it in simple terms.`;
          break;
        case 'multilingual-assistant':
          specializedPrompt = `Help with this multilingual learning request: ${data.content}. Provide translations, explanations, and cultural context as needed.`;
          break;
        case 'emoji-summarizer':
          specializedPrompt = `Create a fun emoji-based summary of this lesson content for younger students: ${data.content}. Use emojis and simple language to make learning engaging.`;
          break;
        default:
          specializedPrompt = `Help with this educational request: ${data.content}`;
      }

      const res = await apiRequest("POST", "/api/ai/chat", {
        message: specializedPrompt,
        context: { 
          tool: toolId,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          userRole: 'student'
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ response: data.response });
      toast({ title: "AI response generated!", description: "Personalized content ready!" });
    },
    onError: () => {
      toast({ title: "Failed to get AI response", variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    const data = {
      content,
      topic,
      subject,
      gradeLevel,
      numberOfCards: parseInt(count),
      numberOfQuestions: parseInt(count),
      duration: 45,
      learningStyle: "mixed",
      includeVisuals: true,
      questionTypes: ["multiple-choice", "true-false"]
    };

    // Student tools - specialized AI responses
    const studentTools = ['ai-study-buddy', 'explain-text', 'homework-assistant', 'concept-rewriter', 
                         'voice-tutor', 'story-generator', 'poetry-maker', 'daily-plan', 'ai-journal', 
                         'speech-coach', 'memory-booster', 'language-translator', 'multilingual-assistant', 
                         'emoji-summarizer'];

    // Teacher tools - professional educational content
    const teacherTools = ['grading-assistant', 'worksheet-generator', 'progress-analyzer', 'test-generator',
                         'essay-evaluator', 'slide-builder', 'class-summary', 'feedback-generator', 'research-assistant'];

    // Admin tools - administrative and management content
    const adminTools = ['school-insights', 'teacher-activity', 'risk-predictor', 'curriculum-scanner',
                       'intervention-suggestions', 'meeting-notes', 'parent-communication', 'report-generator',
                       'policy-assistant', 'schedule-optimizer'];

    // Parent tools - parent-friendly explanations
    const parentTools = ['parent-summary', 'home-support', 'behavior-translator', 'progress-qa', 'lesson-playback'];

    switch (toolId) {
      case 'ai-flashcard-generator':
      case 'flashcard-generator':
        flashcardMutation.mutate(data);
        break;
      case 'quiz-generator':
        quizMutation.mutate(data);
        break;
      case 'ai-summarizer':
        summarizerMutation.mutate(data);
        break;
      case 'lesson-plan-generator':
        lessonPlanMutation.mutate(data);
        break;
      default:
        // Route to appropriate specialized mutation based on tool category
        if (studentTools.includes(toolId)) {
          chatMutation.mutate(data);
        } else if (teacherTools.includes(toolId)) {
          teacherToolMutation.mutate(data);
        } else if (adminTools.includes(toolId)) {
          adminToolMutation.mutate(data);
        } else if (parentTools.includes(toolId)) {
          parentToolMutation.mutate(data);
        } else {
          // Fallback to general chat for any unspecified tools
          chatMutation.mutate(data);
        }
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const getToolInfo = () => {
    const tools: Record<string, any> = {
      'ai-study-buddy': {
        title: 'AI Study Buddy',
        description: 'Chat-style learning assistant for personalized help',
        placeholder: 'Ask me anything about your studies...',
        buttonText: 'Ask AI'
      },
      'explain-text': {
        title: 'Explain This Text',
        description: 'Highlight any content and AI explains it simply',
        placeholder: 'Paste the text you want explained...',
        buttonText: 'Explain This'
      },
      'ai-flashcard-generator': {
        title: 'AI Flashcard Generator',
        description: 'Creates Q&A cards from your notes automatically',
        placeholder: 'Paste your study notes here...',
        buttonText: 'Generate Flashcards'
      },
      'flashcard-generator': {
        title: 'AI Flashcard Generator',
        description: 'Creates Q&A cards from your notes automatically',
        placeholder: 'Paste your study notes here...',
        buttonText: 'Generate Flashcards'
      },
      'quiz-generator': {
        title: 'Quiz Generator',
        description: 'Creates MCQs, True/False, and Matching questions',
        placeholder: 'Enter the topic for your quiz...',
        buttonText: 'Generate Quiz'
      },
      'ai-summarizer': {
        title: 'AI Summarizer',
        description: 'Summarizes books, lessons, or articles instantly',
        placeholder: 'Paste the content you want summarized...',
        buttonText: 'Summarize'
      },
      'concept-rewriter': {
        title: 'Concept Rewriter',
        description: 'Explains complex concepts in simpler words',
        placeholder: 'Enter the complex concept you want simplified...',
        buttonText: 'Simplify Concept'
      },
      'homework-assistant': {
        title: 'Homework Assistant',
        description: 'Step-by-step guidance without giving direct answers',
        placeholder: 'Describe your homework problem...',
        buttonText: 'Get Help'
      },
      'lesson-plan-generator': {
        title: 'Lesson Plan Generator',
        description: 'Creates complete lessons from learning objectives',
        placeholder: 'Enter the lesson topic...',
        buttonText: 'Generate Lesson Plan'
      },
      'voice-tutor': {
        title: 'Voice Tutor',
        description: 'Ask questions by voice, get AI answers',
        placeholder: 'Type your question or use voice input...',
        buttonText: 'Ask Tutor'
      }
    };

    return tools[toolId] || {
      title: 'AI Tool',
      description: 'Powered by advanced AI technology',
      placeholder: 'Enter your input...',
      buttonText: 'Generate'
    };
  };

  const toolInfo = getToolInfo();
  const isLoading = flashcardMutation.isPending || quizMutation.isPending || 
                   summarizerMutation.isPending || lessonPlanMutation.isPending || 
                   chatMutation.isPending || teacherToolMutation.isPending || 
                   adminToolMutation.isPending || parentToolMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/tools')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{toolInfo.title}</h1>
          <p className="text-gray-600">{toolInfo.description}</p>
          <Badge className="bg-blue-100 text-blue-800">AI-Powered</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Input</CardTitle>
            <CardDescription>Provide the information needed for AI generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content" className="text-gray-700">Content/Topic</Label>
              <Textarea
                id="content"
                placeholder={toolInfo.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 bg-white border-blue-200 text-gray-900 placeholder:text-gray-500"
                rows={4}
              />
            </div>

            {(toolId.includes('flashcard') || toolId.includes('quiz') || toolId.includes('lesson')) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject" className="text-gray-700">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="bg-white border-blue-200 text-gray-900">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="geography">Geography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="grade" className="text-gray-700">Grade Level</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger className="bg-white border-blue-200 text-gray-900">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="grade-6">Grade 6</SelectItem>
                        <SelectItem value="grade-7">Grade 7</SelectItem>
                        <SelectItem value="grade-8">Grade 8</SelectItem>
                        <SelectItem value="grade-9">Grade 9</SelectItem>
                        <SelectItem value="grade-10">Grade 10</SelectItem>
                        <SelectItem value="grade-11">Grade 11</SelectItem>
                        <SelectItem value="grade-12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="count" className="text-gray-700">
                    {toolId.includes('flashcard') ? 'Number of Cards' : 'Number of Questions'}
                  </Label>
                  <Input
                    id="count"
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min="5"
                    max="50"
                    className="bg-white border-blue-200 text-gray-900"
                  />
                </div>
              </>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={!content.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                toolInfo.buttonText
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Results</CardTitle>
            <CardDescription>AI-generated content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Flashcards Results */}
                {result.flashcards && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-xl">🎯 Your AI-Generated Flashcards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.flashcards.map((card: any, index: number) => (
                        <FlashcardComponent key={index} card={card} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quiz Results */}
                {result.questions && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-xl">🎮 Interactive Kahoot-Style Quiz</h3>
                    <KahootQuizComponent questions={result.questions} />
                  </div>
                )}

                {/* Summary Results */}
                {result.summary && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{result.summary}</p>
                  </div>
                )}

                {/* Chat/AI Response */}
                {result.response && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-2">AI Response</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{result.response}</p>
                  </div>
                )}

                {/* Lesson Plan Results */}
                {result.lessonPlan && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Generated Lesson Plan</h3>
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900">{result.lessonPlan.title}</h4>
                      <p className="text-gray-700 mt-2">{result.lessonPlan.summary}</p>
                      {result.lessonPlan.objectives && (
                        <div className="mt-3">
                          <div className="font-medium text-blue-900">Learning Objectives:</div>
                          <ul className="list-disc list-inside text-gray-700">
                            {result.lessonPlan.objectives.map((obj: string, i: number) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Results
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results yet. Fill in the form and click generate to see AI-powered results!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}