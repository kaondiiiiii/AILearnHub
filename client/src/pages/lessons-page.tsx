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
import { Separator } from "@/components/ui/separator";
import { 
  Presentation, Plus, Save, Download, Clock, Users, 
  Sparkles, Eye, Edit, BookOpen, Target, ListChecks
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lesson } from "@shared/schema";
import { SUBJECTS, GRADE_LEVELS, LEARNING_STYLES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface LessonPlan {
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

export default function LessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');

  // Lesson creation form state
  const [createForm, setCreateForm] = useState({
    topic: "",
    subject: "",
    gradeLevel: "",
    duration: 45,
    learningStyle: "mixed",
    includeVisuals: true,
  });

  // Generated lesson plan state
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);

  // Fetch lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });

  // Generate lesson plan mutation
  const generateLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/generate-lesson', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.lessonPlan);
      toast({
        title: "Lesson Generated!",
        description: "Your AI lesson plan has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate lesson plan.",
        variant: "destructive",
      });
    },
  });

  // Save lesson mutation
  const saveLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest('POST', '/api/lessons', lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      toast({
        title: "Lesson Saved!",
        description: "Your lesson plan has been saved successfully.",
      });
      // Reset form
      setGeneratedPlan(null);
      setCreateForm({
        topic: "",
        subject: "",
        gradeLevel: "",
        duration: 45,
        learningStyle: "mixed",
        includeVisuals: true,
      });
    },
  });

  const handleGenerateLesson = () => {
    if (!createForm.topic || !createForm.subject || !createForm.gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateLessonMutation.mutate(createForm);
  };

  const handleSaveLesson = () => {
    if (!generatedPlan) {
      toast({
        title: "No Lesson to Save",
        description: "Please generate a lesson plan first.",
        variant: "destructive",
      });
      return;
    }

    saveLessonMutation.mutate({
      title: generatedPlan.title,
      subject: createForm.subject,
      grade: createForm.gradeLevel,
      description: generatedPlan.summary,
      content: generatedPlan,
      objectives: generatedPlan.objectives,
      duration: createForm.duration,
      isPublic: false,
    });
  };

  const exportLesson = (lesson: LessonPlan) => {
    const content = `
# ${lesson.title}

## Summary
${lesson.summary}

## Learning Objectives
${lesson.objectives.map(obj => `- ${obj}`).join('\n')}

## Lesson Structure
${lesson.structure.map(section => `
### ${section.section} (${section.duration} minutes)
${section.content}

**Activities:**
${section.activities.map(activity => `- ${activity}`).join('\n')}
`).join('\n')}

## Materials Needed
${lesson.materials.map(material => `- ${material}`).join('\n')}

## Assessment Methods
${lesson.assessment.map(method => `- ${method}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Detailed lesson view
  if (selectedLesson) {
    const lessonContent = selectedLesson.content as LessonPlan;

    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <TopBar />
          <main className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                  ← Back to Lessons
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'view' ? 'edit' : 'view')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {viewMode === 'view' ? 'Edit' : 'View'}
                  </Button>
                  <Button variant="outline" onClick={() => exportLesson(lessonContent)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Lesson Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
                      <p className="text-gray-600 mt-2">{selectedLesson.description}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="outline">{selectedLesson.subject}</Badge>
                      <p className="text-sm text-gray-500">{selectedLesson.grade}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overview */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold">{formatDuration(selectedLesson.duration || 45)}</p>
                    </div>
                    <div className="text-center">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Objectives</p>
                      <p className="font-semibold">{lessonContent.objectives?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <ListChecks className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Activities</p>
                      <p className="font-semibold">
                        {lessonContent.structure?.reduce((acc, section) => acc + section.activities.length, 0) || 0}
                      </p>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                    <ul className="space-y-2">
                      {lessonContent.objectives?.map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Lesson Structure */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Structure</h3>
                    <div className="space-y-4">
                      {lessonContent.structure?.map((section, index) => (
                        <Card key={index} className="border-l-4 border-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{section.section}</h4>
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {section.duration}m
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-3">{section.content}</p>
                            {section.activities.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">Activities:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {section.activities.map((activity, actIndex) => (
                                    <li key={actIndex} className="text-sm text-gray-600">{activity}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Materials and Assessment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Materials Needed</h3>
                      <ul className="space-y-1">
                        {lessonContent.materials?.map((material, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-700">{material}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment Methods</h3>
                      <ul className="space-y-1">
                        {lessonContent.assessment?.map((method, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-gray-700">{method}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <Presentation className="h-8 w-8 text-blue-600" />
              AI Lesson Builder
            </h1>
            <p className="text-gray-600">Create engaging lesson plans with AI assistance</p>
          </div>

          <Tabs defaultValue="create" className="space-y-6">
            <TabsList>
              <TabsTrigger value="create">Create Lesson</TabsTrigger>
              <TabsTrigger value="library">My Lessons</TabsTrigger>
            </TabsList>

            {/* Create Lesson Tab */}
            <TabsContent value="create" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lesson Generator Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Generate New Lesson
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Lesson Topic & Objectives *</Label>
                      <Textarea
                        id="topic"
                        placeholder="Enter the topic you want to teach, e.g., 'Introduction to Photosynthesis' or 'Basic Algebraic Equations'. Include learning objectives if you have specific goals..."
                        className="h-24 resize-none"
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
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="15"
                          max="180"
                          value={createForm.duration}
                          onChange={(e) => setCreateForm(prev => ({ 
                            ...prev, 
                            duration: parseInt(e.target.value) || 45 
                          }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="learningStyle">Learning Style</Label>
                        <Select 
                          value={createForm.learningStyle} 
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, learningStyle: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEARNING_STYLES.map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                {style.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeVisuals"
                        checked={createForm.includeVisuals}
                        onChange={(e) => setCreateForm(prev => ({ 
                          ...prev, 
                          includeVisuals: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeVisuals" className="text-sm">
                        Include visual aids and materials
                      </Label>
                    </div>

                    <Button
                      onClick={handleGenerateLesson}
                      disabled={generateLessonMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {generateLessonMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Lesson Plan
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Lesson Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Lesson Plan</CardTitle>
                      {generatedPlan && (
                        <div className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => exportLesson(generatedPlan)}>
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          <Button size="sm" onClick={handleSaveLesson} disabled={saveLessonMutation.isPending}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {generateLessonMutation.isPending ? (
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      </div>
                    ) : generatedPlan ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div>
                          <h3 className="font-semibold text-gray-900">{generatedPlan.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{generatedPlan.summary}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Learning Objectives</h4>
                          <ul className="space-y-1">
                            {generatedPlan.objectives.slice(0, 3).map((objective, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{objective}</span>
                              </li>
                            ))}
                            {generatedPlan.objectives.length > 3 && (
                              <li className="text-sm text-gray-500">
                                +{generatedPlan.objectives.length - 3} more objectives
                              </li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Lesson Structure</h4>
                          <div className="space-y-2">
                            {generatedPlan.structure.slice(0, 3).map((section, index) => (
                              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{section.section}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {section.duration}m
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{section.content.substring(0, 100)}...</p>
                              </div>
                            ))}
                            {generatedPlan.structure.length > 3 && (
                              <p className="text-sm text-gray-500 text-center">
                                +{generatedPlan.structure.length - 3} more sections
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Presentation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          Generate a lesson plan to see the preview
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Lessons Tab */}
            <TabsContent value="library" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Lesson Plans</CardTitle>
                    <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Lesson
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lessonsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="pt-6">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2 mb-4" />
                            <Skeleton className="h-8 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : lessons && lessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lessons.map((lesson) => (
                        <Card key={lesson.id} className="card-hover cursor-pointer">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 line-clamp-2">{lesson.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{lesson.subject} • {lesson.grade}</p>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(lesson.duration || 45)}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {lesson.description}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Objectives</span>
                                <span className="font-medium">{lesson.objectives?.length || 0}</span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Created</span>
                                <span className="font-medium">
                                  {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              <Button 
                                className="w-full" 
                                onClick={() => setSelectedLesson(lesson)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Lesson
                              </Button>
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="flex-1" 
                                  size="sm"
                                  onClick={() => lesson.content && exportLesson(lesson.content as LessonPlan)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Presentation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lesson Plans Yet</h3>
                      <p className="text-gray-500 mb-4">Create your first AI-generated lesson plan to get started</p>
                      <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Lesson
                      </Button>
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
