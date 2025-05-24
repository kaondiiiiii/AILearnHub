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
import { ArrowLeft, Loader2, Mic, Volume2, Download, Copy } from "lucide-react";

interface ToolDetailPageProps {
  toolId: string;
}

export default function ToolDetailPage() {
  const [location, navigate] = useLocation();
  const toolId = new URLSearchParams(location.split('?')[1] || '').get('tool') || '';
  const { toast } = useToast();
  
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
      const res = await apiRequest("POST", "/api/ai/generate-lesson-plan", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Lesson plan generated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to generate lesson plan", variant: "destructive" });
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/chat", {
        message: data.content,
        context: { tool: toolId }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setResult({ response: data.response });
      toast({ title: "AI response generated!" });
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
      case 'ai-study-buddy':
      case 'homework-assistant':
      case 'concept-rewriter':
      case 'voice-tutor':
        chatMutation.mutate(data);
        break;
      default:
        toast({ title: "Tool functionality coming soon!", description: "This tool is being implemented." });
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
                   chatMutation.isPending;

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
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Generated Flashcards</h3>
                    {result.flashcards.map((card: any, index: number) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="font-medium text-blue-900 mb-2">Q: {card.question}</div>
                        <div className="text-gray-700">A: {card.answer}</div>
                        <Badge className="mt-2 bg-blue-100 text-blue-800">{card.difficulty}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz Results */}
                {result.questions && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Generated Quiz</h3>
                    {result.questions.map((question: any, index: number) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="font-medium text-blue-900 mb-2">{index + 1}. {question.question}</div>
                        {question.options && (
                          <div className="ml-4 space-y-1 text-gray-700">
                            {question.options.map((option: string, i: number) => (
                              <div key={i}>• {option}</div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-green-700 font-medium">Answer: {question.correctAnswer}</div>
                      </div>
                    ))}
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