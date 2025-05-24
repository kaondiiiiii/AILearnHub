import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Users, 
  BarChart3,
  MessageSquare,
  PenTool,
  Search,
  Mic,
  Volume2,
  Languages,
  Calendar,
  Target,
  Lightbulb,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Shield,
  Home,
  Palette,
  Music,
  Camera,
  Globe
} from "lucide-react";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  audience: string[];
  featured?: boolean;
}

const tools: Tool[] = [
  // Student Tools
  {
    id: "ai-study-buddy",
    title: "AI Study Buddy",
    description: "Chat-style learning assistant for personalized help",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"],
    featured: true
  },
  {
    id: "explain-text",
    title: "Explain This Text",
    description: "Highlight any content and AI explains it simply",
    icon: <Lightbulb className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "flashcard-generator",
    title: "AI Flashcard Generator",
    description: "Creates Q&A cards from your notes automatically",
    icon: <Brain className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"],
    featured: true
  },
  {
    id: "quiz-generator",
    title: "Quiz Generator",
    description: "Creates MCQs, True/False, and Matching questions",
    icon: <ClipboardList className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student", "teacher"]
  },
  {
    id: "ai-summarizer",
    title: "AI Summarizer",
    description: "Summarizes books, lessons, or articles instantly",
    icon: <FileText className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student", "teacher"]
  },
  {
    id: "concept-rewriter",
    title: "Concept Rewriter",
    description: "Explains complex concepts in simpler words",
    icon: <PenTool className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "homework-assistant",
    title: "Homework Assistant",
    description: "Step-by-step guidance without giving direct answers",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "mind-map-builder",
    title: "AI Mind Map Builder",
    description: "Generates visual mind maps from any topic",
    icon: <Target className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student", "teacher"]
  },
  {
    id: "language-translator",
    title: "Language Translator + Simplifier",
    description: "Translate & simplify into your native language",
    icon: <Languages className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "voice-tutor",
    title: "Voice Tutor",
    description: "Ask questions by voice, get AI answers",
    icon: <Mic className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "daily-plan",
    title: "Daily Learning Plan",
    description: "Personalized schedule with smart reminders",
    icon: <Calendar className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "ai-journal",
    title: "AI Journal Reflections",
    description: "Reflective writing prompts with feedback",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "memory-booster",
    title: "Memory Booster",
    description: "Smart spaced repetition based on your accuracy",
    icon: <Brain className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "speech-coach",
    title: "Speech Practice Coach",
    description: "Records your voice and gives pronunciation feedback",
    icon: <Volume2 className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },
  {
    id: "exam-trainer",
    title: "AI Exam Trainer",
    description: "Simulates realistic exam-style practice questions",
    icon: <GraduationCap className="h-5 w-5" />,
    category: "Learning & Tutoring",
    audience: ["student"]
  },

  // Teacher Tools
  {
    id: "lesson-plan-generator",
    title: "Lesson Plan Generator",
    description: "Creates complete lessons from learning objectives",
    icon: <FileText className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"],
    featured: true
  },
  {
    id: "worksheet-generator",
    title: "Worksheet Generator",
    description: "Creates printable and digital worksheets",
    icon: <ClipboardList className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "grading-assistant",
    title: "Grading Assistant",
    description: "AI grades open text and provides detailed feedback",
    icon: <BarChart3 className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"],
    featured: true
  },
  {
    id: "progress-analyzer",
    title: "Student Progress Analyzer",
    description: "Summarizes student strengths & improvement areas",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "test-generator",
    title: "Test Generator",
    description: "Builds comprehensive tests by topic & difficulty",
    icon: <ClipboardList className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "essay-evaluator",
    title: "Essay Evaluator",
    description: "Evaluates logic, grammar, and coherence",
    icon: <PenTool className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "slide-builder",
    title: "Slide Builder Assistant",
    description: "Suggests presentation slides from lesson content",
    icon: <FileText className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "class-summary",
    title: "Class Summary Writer",
    description: "Auto-writes what was covered in each class",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "feedback-generator",
    title: "Feedback Generator",
    description: "Creates report card and parent comments",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },
  {
    id: "research-assistant",
    title: "AI Research Assistant",
    description: "Finds recent articles and sources for projects",
    icon: <Search className="h-5 w-5" />,
    category: "Teacher Productivity",
    audience: ["teacher"]
  },

  // Principal & Admin Tools
  {
    id: "school-insights",
    title: "School-wide Insights Generator",
    description: "Auto-summary of academic performance data",
    icon: <BarChart3 className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"],
    featured: true
  },
  {
    id: "teacher-activity",
    title: "Teacher Activity Reporter",
    description: "Tracks lessons created & engagement metrics",
    icon: <Users className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "risk-predictor",
    title: "Student Risk Predictor",
    description: "Flags students who may be falling behind",
    icon: <Shield className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "curriculum-scanner",
    title: "Curriculum Coverage Scanner",
    description: "Detects gaps in content coverage",
    icon: <Search className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "intervention-suggestions",
    title: "AI Intervention Suggestions",
    description: "Smart recommendations for improving performance",
    icon: <Lightbulb className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "meeting-notes",
    title: "Meeting Note AI",
    description: "Records and summarizes school meetings",
    icon: <FileText className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "parent-communication",
    title: "Parent Communication Writer",
    description: "Auto-generates newsletters & notices",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "report-generator",
    title: "Report Generator",
    description: "Export comprehensive reports as PDF",
    icon: <FileText className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "policy-assistant",
    title: "Policy Draft Assistant",
    description: "Drafts school policies and proposals",
    icon: <ClipboardList className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },
  {
    id: "schedule-optimizer",
    title: "AI Schedule Optimizer",
    description: "Suggests optimal subject time blocks",
    icon: <Calendar className="h-5 w-5" />,
    category: "Principal & Admin",
    audience: ["admin"]
  },

  // Parent Tools
  {
    id: "parent-summary",
    title: "Parent Summary Bot",
    description: "How is my child doing? - in plain English",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Parent-Facing",
    audience: ["parent"],
    featured: true
  },
  {
    id: "home-support",
    title: "Home Support Tips",
    description: "AI suggests ways to help with specific topics",
    icon: <Home className="h-5 w-5" />,
    category: "Parent-Facing",
    audience: ["parent"]
  },
  {
    id: "behavior-translator",
    title: "Behavior Translator",
    description: "Explains school behavior reports simply",
    icon: <Users className="h-5 w-5" />,
    category: "Parent-Facing",
    audience: ["parent"]
  },
  {
    id: "progress-qa",
    title: "AI Progress Q&A",
    description: "Parents can ask any question about progress",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Parent-Facing",
    audience: ["parent"]
  },
  {
    id: "lesson-playback",
    title: "Lesson Playback Summarizer",
    description: "Summary of missed classes for parents",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Parent-Facing",
    audience: ["parent"]
  },

  // Creativity Tools
  {
    id: "story-generator",
    title: "Story Generator",
    description: "Students write a sentence, AI completes the story",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Creativity & Expression",
    audience: ["student"]
  },
  {
    id: "image-creator",
    title: "Image Creator",
    description: "AI generates illustrations for student projects",
    icon: <Camera className="h-5 w-5" />,
    category: "Creativity & Expression",
    audience: ["student", "teacher"]
  },
  {
    id: "poetry-maker",
    title: "AI Poetry Maker",
    description: "Converts facts or feelings into beautiful poems",
    icon: <PenTool className="h-5 w-5" />,
    category: "Creativity & Expression",
    audience: ["student"]
  },
  {
    id: "comic-writer",
    title: "Comic Strip Writer",
    description: "Creates dialogues & scenes for comic strips",
    icon: <Palette className="h-5 w-5" />,
    category: "Creativity & Expression",
    audience: ["student"]
  },
  {
    id: "presentation-builder",
    title: "Presentation Builder",
    description: "AI helps organize speeches & slide presentations",
    icon: <FileText className="h-5 w-5" />,
    category: "Creativity & Expression",
    audience: ["student", "teacher"]
  },

  // Communication & Accessibility
  {
    id: "voice-to-text",
    title: "Voice-to-Text Transcriber",
    description: "Converts voice to editable text using Whisper",
    icon: <Mic className="h-5 w-5" />,
    category: "Communication & Accessibility",
    audience: ["student", "teacher", "parent"]
  },
  {
    id: "text-to-voice",
    title: "Text-to-Voice Explainer",
    description: "AI reads content aloud when requested",
    icon: <Volume2 className="h-5 w-5" />,
    category: "Communication & Accessibility",
    audience: ["student", "teacher", "parent"]
  },
  {
    id: "multilingual-assistant",
    title: "Multilingual Assistant",
    description: "Interacts in different languages with auto-translate",
    icon: <Globe className="h-5 w-5" />,
    category: "Communication & Accessibility",
    audience: ["student", "teacher", "parent"]
  },
  {
    id: "chat-to-lesson",
    title: "Chat-to-Lesson Transformer",
    description: "Turn any conversation into a structured lesson",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Communication & Accessibility",
    audience: ["teacher"]
  },
  {
    id: "emoji-summarizer",
    title: "Emoji Lesson Summarizer",
    description: "Fun emoji-based summary for younger students",
    icon: <Palette className="h-5 w-5" />,
    category: "Communication & Accessibility",
    audience: ["student"]
  }
];

export default function ToolsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(tools.map(tool => tool.category)))];
  
  const userRole = user?.role || "student";
  
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    const matchesRole = tool.audience.includes(userRole);
    
    return matchesSearch && matchesCategory && matchesRole;
  });

  const featuredTools = filteredTools.filter(tool => tool.featured);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Educational Tools</h1>
            <p className="text-muted-foreground">
              Discover powerful AI tools designed for {userRole}s to enhance learning and productivity
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredTools.length} tools available
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Tools */}
      {featuredTools.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Featured Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map(tool => (
              <Card key={tool.id} className="card-hover border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4">
                    {tool.description}
                  </CardDescription>
                  <Button className="w-full" size="sm">
                    Launch Tool
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Tools */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">All Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map(tool => (
            <Card key={tool.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">{tool.title}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {tool.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-3 line-clamp-2">
                  {tool.description}
                </CardDescription>
                <Button variant="outline" className="w-full" size="sm">
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tools found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category filter to find the tools you need.
          </p>
        </div>
      )}
    </div>
  );
}