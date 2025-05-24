import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Plus, Play, Clock, CheckCircle, Award, 
  Sparkles, Save, BarChart3, Timer, Trophy 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Quiz, QuizAttempt } from "@shared/schema";
import { SUBJECTS, GRADE_LEVELS, QUESTION_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QuizzesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  // Quiz creation form state
  const [createForm, setCreateForm] = useState({
    topic: "",
    subject: "",
    gradeLevel: "",
    numberOfQuestions: 10,
    questionTypes: ["multiple-choice"],
    timeLimit: 30,
  });

  // Generated questions state
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);

  // Fetch quizzes
  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });

  // Fetch quiz attempts
  const { data: attempts, isLoading: attemptsLoading } = useQuery<QuizAttempt[]>({
    queryKey: ['/api/quiz-attempts'],
  });

  // Generate quiz questions mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuestions(data.questions || []);
      toast({
        title: "Quiz Generated!",
        description: `Successfully generated ${data.questions?.length || 0} questions.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate quiz questions.",
        variant: "destructive",
      });
    },
  });

  // Save quiz mutation
  const saveQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const response = await apiRequest('POST', '/api/quizzes', quizData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Quiz Saved!",
        description: "Your quiz has been saved successfully.",
      });
      // Reset form
      setGeneratedQuestions([]);
      setCreateForm({
        topic: "",
        subject: "",
        gradeLevel: "",
        numberOfQuestions: 10,
        questionTypes: ["multiple-choice"],
        timeLimit: 30,
      });
    },
  });

  // Submit quiz attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      const response = await apiRequest('POST', '/api/quiz-attempts', attemptData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-attempts'] });
      setShowResults(true);
    },
  });

  const handleGenerateQuiz = () => {
    if (!createForm.topic || !createForm.subject || !createForm.gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateQuizMutation.mutate(createForm);
  };

  const handleSaveQuiz = () => {
    if (!createForm.topic || generatedQuestions.length === 0) {
      toast({
        title: "Cannot Save Quiz",
        description: "Please generate questions first.",
        variant: "destructive",
      });
      return;
    }

    saveQuizMutation.mutate({
      title: createForm.topic,
      subject: createForm.subject,
      grade: createForm.gradeLevel,
      description: `AI-generated quiz for ${createForm.subject}`,
      questions: generatedQuestions,
      timeLimit: createForm.timeLimit,
      isPublic: false,
    });
  };

  const handleStartQuiz = (quizId: number) => {
    setSelectedQuizId(quizId);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setQuizStartTime(new Date());
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    const currentQuiz = quizzes?.find(q => q.id === selectedQuizId);
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const currentQuiz = quizzes?.find(q => q.id === selectedQuizId);
    if (!currentQuiz || !quizStartTime) return;

    let correctAnswers = 0;
    currentQuiz.questions.forEach((question: QuizQuestion, index: number) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const timeSpent = Math.floor((Date.now() - quizStartTime.getTime()) / 1000);

    submitAttemptMutation.mutate({
      quizId: selectedQuizId,
      score: correctAnswers,
      totalQuestions: currentQuiz.questions.length,
      answers: Object.values(userAnswers),
      timeSpent,
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quiz taking interface
  if (selectedQuizId && !showResults) {
    const currentQuiz = quizzes?.find(q => q.id === selectedQuizId);
    if (!currentQuiz) return null;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex] as QuizQuestion;
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;

    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <TopBar />
          <main className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Quiz Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
                  <p className="text-gray-600">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    <Timer className="h-4 w-4 mr-1" />
                    {currentQuiz.timeLimit} min limit
                  </Badge>
                  <Button variant="outline" onClick={() => setSelectedQuizId(null)}>
                    Exit Quiz
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <Progress value={progress} className="h-2" />

              {/* Question Card */}
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuestion.type === 'multiple-choice' && (
                    <RadioGroup
                      value={userAnswers[currentQuestionIndex] || ""}
                      onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, value)}
                    >
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === 'true-false' && (
                    <RadioGroup
                      value={userAnswers[currentQuestionIndex] || ""}
                      onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="True" id="true" />
                        <Label htmlFor="true" className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="False" id="false" />
                        <Label htmlFor="false" className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {currentQuestion.type === 'short-answer' && (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={userAnswers[currentQuestionIndex] || ""}
                      onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitAttemptMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitAttemptMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Results interface
  if (showResults && selectedQuizId) {
    const currentQuiz = quizzes?.find(q => q.id === selectedQuizId);
    const latestAttempt = attempts?.filter(a => a.quizId === selectedQuizId)?.[0];
    
    if (!currentQuiz || !latestAttempt) return null;

    const percentage = Math.round((latestAttempt.score / latestAttempt.totalQuestions) * 100);

    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <TopBar />
          <main className="p-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="space-y-4">
                <Trophy className={`h-20 w-20 mx-auto ${getScoreColor(percentage)}`} />
                <h1 className="text-3xl font-bold text-gray-900">Quiz Complete!</h1>
                <p className="text-xl text-gray-600">
                  You scored {latestAttempt.score} out of {latestAttempt.totalQuestions}
                </p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </p>
                      <p className="text-gray-500">Final Score</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{latestAttempt.score}</p>
                        <p className="text-gray-500">Correct</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{formatTime(latestAttempt.timeSpent || 0)}</p>
                        <p className="text-gray-500">Time Taken</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-x-4">
                <Button onClick={() => setSelectedQuizId(null)}>
                  Back to Quizzes
                </Button>
                <Button variant="outline" onClick={() => handleStartQuiz(selectedQuizId)}>
                  Retake Quiz
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              AI Quizzes
            </h1>
            <p className="text-gray-600">Create and take AI-generated quizzes</p>
          </div>

          <Tabs defaultValue="take" className="space-y-6">
            <TabsList>
              <TabsTrigger value="take">Take Quiz</TabsTrigger>
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <TabsTrigger value="create">Create Quiz</TabsTrigger>
              )}
              <TabsTrigger value="results">My Results</TabsTrigger>
            </TabsList>

            {/* Take Quiz Tab */}
            <TabsContent value="take" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {quizzesLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                              <Skeleton className="w-12 h-12 rounded-lg" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                              <Skeleton className="h-8 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : quizzes && quizzes.length > 0 ? (
                        <div className="space-y-3">
                          {quizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                  <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                                  <p className="text-sm text-gray-500">
                                    {quiz.subject} • {quiz.grade} • {quiz.questions?.length || 0} questions
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {quiz.timeLimit && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {quiz.timeLimit}m
                                  </Badge>
                                )}
                                <Button onClick={() => handleStartQuiz(quiz.id)}>
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quizzes Available</h3>
                          <p className="text-gray-500 mb-4">Create your first AI-generated quiz to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quiz Stats */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quizzes Taken</span>
                          <span className="font-semibold">{attempts?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Score</span>
                          <span className="font-semibold text-green-600">
                            {attempts?.length ? 
                              Math.round(attempts.reduce((acc, att) => acc + (att.score / att.totalQuestions * 100), 0) / attempts.length) 
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Best Score</span>
                          <span className="font-semibold text-blue-600">
                            {attempts?.length ? 
                              Math.max(...attempts.map(att => Math.round(att.score / att.totalQuestions * 100)))
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Create Quiz Tab */}
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <TabsContent value="create" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quiz Generation Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Generate AI Quiz
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="topic">Quiz Topic *</Label>
                        <Input
                          id="topic"
                          placeholder="e.g., Photosynthesis, World War II, Algebra"
                          value={createForm.topic}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, topic: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Select 
                            value={createForm.subject} 
                            onValueChange={(value) => setCreateForm(prev => ({ ...prev, subject: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="grade">Grade Level *</Label>
                          <Select 
                            value={createForm.gradeLevel} 
                            onValueChange={(value) => setCreateForm(prev => ({ ...prev, gradeLevel: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_LEVELS.map((grade) => (
                                <SelectItem key={grade.id} value={grade.value}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                          <Input
                            id="numberOfQuestions"
                            type="number"
                            min="5"
                            max="25"
                            value={createForm.numberOfQuestions}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              numberOfQuestions: parseInt(e.target.value) || 10 
                            }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                          <Input
                            id="timeLimit"
                            type="number"
                            min="10"
                            max="120"
                            value={createForm.timeLimit}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              timeLimit: parseInt(e.target.value) || 30 
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Question Types</Label>
                        <div className="space-y-2 mt-2">
                          {QUESTION_TYPES.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.id}
                                checked={createForm.questionTypes.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCreateForm(prev => ({
                                      ...prev,
                                      questionTypes: [...prev.questionTypes, type.id]
                                    }));
                                  } else {
                                    setCreateForm(prev => ({
                                      ...prev,
                                      questionTypes: prev.questionTypes.filter(t => t !== type.id)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={type.id} className="text-sm">
                                {type.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerateQuiz}
                        disabled={generateQuizMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        {generateQuizMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Quiz
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated Questions Preview */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Generated Questions</CardTitle>
                        {generatedQuestions.length > 0 && (
                          <Badge variant="secondary">{generatedQuestions.length} questions</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {generateQuizMutation.isPending ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          ))}
                        </div>
                      ) : generatedQuestions.length > 0 ? (
                        <div className="space-y-4">
                          <div className="max-h-96 overflow-y-auto space-y-3">
                            {generatedQuestions.slice(0, 5).map((question, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium text-sm text-gray-900 mb-2">
                                  {index + 1}. {question.question}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Type: {question.type} | Answer: {question.correctAnswer}
                                </p>
                              </div>
                            ))}
                            {generatedQuestions.length > 5 && (
                              <p className="text-sm text-gray-500 text-center">
                                ... and {generatedQuestions.length - 5} more questions
                              </p>
                            )}
                          </div>
                          
                          <Button
                            onClick={handleSaveQuiz}
                            disabled={saveQuizMutation.isPending}
                            className="w-full"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Quiz
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            Generate questions to see them here
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Quiz Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attemptsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-6 w-12" />
                        </div>
                      ))}
                    </div>
                  ) : attempts && attempts.length > 0 ? (
                    <div className="space-y-3">
                      {attempts.map((attempt) => {
                        const quiz = quizzes?.find(q => q.id === attempt.quizId);
                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        
                        return (
                          <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-lg ${
                                percentage >= 90 ? 'bg-green-100' :
                                percentage >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                <Award className={`h-6 w-6 ${
                                  percentage >= 90 ? 'text-green-600' :
                                  percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{quiz?.title || 'Unknown Quiz'}</h3>
                                <p className="text-sm text-gray-500">
                                  {attempt.score}/{attempt.totalQuestions} correct • {formatTime(attempt.timeSpent || 0)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                {percentage}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quiz Results Yet</h3>
                      <p className="text-gray-500 mb-4">Take your first quiz to see results here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
