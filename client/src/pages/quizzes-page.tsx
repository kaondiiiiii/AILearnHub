import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Constants
const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Art",
  "Music",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
];

const GRADE_LEVELS = [
  "Elementary School",
  "Middle School",
  "High School",
  "College",
  "Professional",
];

const QUESTION_TYPES = [
  "multiple-choice",
  "true-false",
  "short-answer",
];

const LEARNING_STYLES = [
  "visual",
  "auditory",
  "reading/writing",
  "kinesthetic",
  "balanced"
];

const GAMIFICATION_LEVELS = [
  "low",
  "medium",
  "high"
];

const PERSONALIZATION_OPTIONS = [
  "general",
  "beginner",
  "intermediate",
  "advanced",
  "special needs"
];

export default function QuizzesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("take");
  
  // Quiz creation form state
  const [createForm, setCreateForm] = useState({
    topic: "",
    subject: "",
    gradeLevel: "",
    numberOfQuestions: 10,
    questionTypes: ["multiple-choice"],
    timeLimit: 30,
    learningStyle: "visual",
    personalizedFor: "general",
    gamificationLevel: "medium",
    includeImages: true
  });
  
  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', data);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Quiz Generated",
        description: "Quiz generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz.",
        variant: "destructive",
      });
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Quizzes</h1>
              {user?.role === 'teacher' && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setActiveTab("create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="take">Take Quiz</TabsTrigger>
                {user?.role === 'teacher' && (
                  <TabsTrigger value="create">Create Quiz</TabsTrigger>
                )}
                <TabsTrigger value="results">My Results</TabsTrigger>
              </TabsList>
              
              {/* Take Quiz Tab Content */}
              <TabsContent value="take">
                <div className="p-4 text-center">
                  <p>No quizzes available. Create a quiz first.</p>
                </div>
              </TabsContent>
              
              {/* Create Quiz Tab Content */}
              {user?.role === 'teacher' && (
                <TabsContent value="create" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Generate AI Quiz
                      </CardTitle>
                      <CardDescription>
                        Fill in the details below to create a quiz with AI-generated questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic</Label>
                        <Input
                          id="topic"
                          placeholder="Enter quiz topic"
                          value={createForm.topic}
                          onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select 
                          value={createForm.subject}
                          onValueChange={(value) => setCreateForm({ ...createForm, subject: value })}
                        >
                          <SelectTrigger id="subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select 
                          value={createForm.gradeLevel}
                          onValueChange={(value) => setCreateForm({ ...createForm, gradeLevel: value })}
                        >
                          <SelectTrigger id="gradeLevel">
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_LEVELS.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                        <Select 
                          value={createForm.numberOfQuestions.toString()}
                          onValueChange={(value) => setCreateForm({ ...createForm, numberOfQuestions: parseInt(value) })}
                        >
                          <SelectTrigger id="numberOfQuestions">
                            <SelectValue placeholder="Select number of questions" />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} questions
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="questionTypes">Question Types</Label>
                        <Select 
                          value={createForm.questionTypes[0]}
                          onValueChange={(value) => setCreateForm({ ...createForm, questionTypes: [value] })}
                        >
                          <SelectTrigger id="questionTypes">
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="learningStyle">Learning Style</Label>
                        <Select 
                          value={createForm.learningStyle}
                          onValueChange={(value) => setCreateForm({ ...createForm, learningStyle: value })}
                        >
                          <SelectTrigger id="learningStyle">
                            <SelectValue placeholder="Select learning style" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEARNING_STYLES.map((style) => (
                              <SelectItem key={style} value={style}>
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gamificationLevel">Gamification Level</Label>
                        <Select 
                          value={createForm.gamificationLevel}
                          onValueChange={(value) => setCreateForm({ ...createForm, gamificationLevel: value })}
                        >
                          <SelectTrigger id="gamificationLevel">
                            <SelectValue placeholder="Select gamification level" />
                          </SelectTrigger>
                          <SelectContent>
                            {GAMIFICATION_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="personalizedFor">Personalized For</Label>
                        <Select 
                          value={createForm.personalizedFor}
                          onValueChange={(value) => setCreateForm({ ...createForm, personalizedFor: value })}
                        >
                          <SelectTrigger id="personalizedFor">
                            <SelectValue placeholder="Select personalization" />
                          </SelectTrigger>
                          <SelectContent>
                            {PERSONALIZATION_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox 
                          id="includeImages" 
                          checked={createForm.includeImages}
                          onCheckedChange={(checked: boolean | "indeterminate") => 
                            setCreateForm({ ...createForm, includeImages: checked === true })
                          }
                        />
                        <label
                          htmlFor="includeImages"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Include image descriptions
                        </label>
                      </div>
                      <Button
                        onClick={handleGenerateQuiz}
                        disabled={generateQuizMutation.isPending || !createForm.topic || !createForm.subject || !createForm.gradeLevel}
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                        size="lg"
                      >
                        {generateQuizMutation.isPending ? (
                          <>
                            <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                            Generating Quiz...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Generate Quiz
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {/* Results Tab Content */}
              <TabsContent value="results">
                <div className="p-4 text-center">
                  <p>No quiz results available.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
