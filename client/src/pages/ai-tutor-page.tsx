import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import VoiceAssistant from "@/components/ai/voice-assistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, Send, Mic, MicOff, Settings, Calculator, 
  Languages, FlaskConical, Volume2, VolumeX, User,
  Sparkles, BookOpen, HelpCircle, MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@/lib/types";
import { GRADE_LEVELS, LEARNING_STYLES, MAX_CHAT_HISTORY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AiTutorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tutor settings
  const [tutorSettings, setTutorSettings] = useState({
    explanationLevel: user?.grade || "middle-school",
    learningStyle: "balanced",
    voiceResponses: true,
    responseSpeed: "normal",
  });

  // Add welcome message on mount
  useEffect(() => {
    if (chatHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hi ${user?.firstName || 'there'}! I'm your AI tutor. I can help you with any subject - from explaining complex concepts to creating practice questions. What would you like to learn about today? 🎓`,
        timestamp: new Date(),
      };
      setChatHistory([welcomeMessage]);
    }
  }, [user?.firstName, chatHistory.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Fetch AI interactions for context
  const { data: recentInteractions } = useQuery({
    queryKey: ['/api/ai/interactions', { limit: 10 }],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context: any[] }) => {
      const response = await apiRequest('POST', '/api/ai/chat', { message, context });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      
      setChatHistory(prev => {
        const newHistory = [...prev, assistantMessage];
        // Keep only last MAX_CHAT_HISTORY messages
        return newHistory.slice(-MAX_CHAT_HISTORY);
      });

      // Speak response if voice is enabled
      if (tutorSettings.voiceResponses) {
        speakText(data.response);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || message.trim();
    if (!textToSend || sendMessageMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setChatHistory(prev => {
      const newHistory = [...prev, userMessage];
      return newHistory.slice(-MAX_CHAT_HISTORY);
    });

    // Prepare context from recent chat history
    const context = chatHistory.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    sendMessageMutation.mutate({ 
      message: textToSend, 
      context 
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceCommand = (command: string) => {
    setMessage(command);
    handleSendMessage(command);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && tutorSettings.voiceResponses) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = tutorSettings.responseSpeed === 'fast' ? 1.2 : 
                     tutorSettings.responseSpeed === 'slow' ? 0.8 : 1.0;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const handleQuickAction = (action: string) => {
    const actions = {
      'explain': "Can you explain a concept to me?",
      'quiz': "Can you give me a quiz on a topic?",
      'homework': "Can you help me with my homework?",
      'examples': "Can you give me some examples?",
    };
    
    const actionMessage = actions[action as keyof typeof actions];
    if (actionMessage) {
      handleSendMessage(actionMessage);
    }
  };

  const getProgressData = () => {
    // Calculate today's progress based on chat history
    const today = new Date().toDateString();
    const todaysMessages = chatHistory.filter(msg => 
      msg.timestamp.toDateString() === today && msg.role === 'user'
    );
    
    return {
      questionsAsked: todaysMessages.length,
      questionsGoal: 15,
      studyTime: Math.floor(todaysMessages.length * 2.5), // Estimate 2.5 min per question
      studyGoal: 60,
    };
  };

  const progress = getProgressData();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              AI Tutor
            </h1>
            <p className="text-gray-600">Get personalized help with your studies</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Chat Interface */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">EduMind AI Tutor</h3>
                    <p className="text-sm text-green-600 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      Online - Ready to help!
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={cn(
                      "text-gray-500 hover:text-primary",
                      isVoiceEnabled && "text-primary"
                    )}
                  >
                    {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ maxHeight: '60vh' }}>
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex items-start space-x-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-xl p-4",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-2",
                        msg.role === 'user' ? "text-blue-100" : "text-gray-500"
                      )}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {sendMessageMutation.isPending && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                        <span className="text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Ask me anything about your studies..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                      className="pr-12"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction('explain')}
                  >
                    Explain this concept
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction('quiz')}
                  >
                    Give me a quiz
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction('homework')}
                  >
                    Help with homework
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar - Settings & Tools */}
            <div className="space-y-6">
              {/* Tutor Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tutor Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Explanation Level</Label>
                    <Select 
                      value={tutorSettings.explanationLevel} 
                      onValueChange={(value) => setTutorSettings(prev => ({ ...prev, explanationLevel: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary (Simple)</SelectItem>
                        <SelectItem value="middle-school">Middle School</SelectItem>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Learning Style</Label>
                    <Select 
                      value={tutorSettings.learningStyle} 
                      onValueChange={(value) => setTutorSettings(prev => ({ ...prev, learningStyle: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visual">Visual Learner</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                        <SelectItem value="auditory">Auditory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Voice Responses</Label>
                    <Switch
                      checked={tutorSettings.voiceResponses}
                      onCheckedChange={(checked) => setTutorSettings(prev => ({ ...prev, voiceResponses: checked }))}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Response Speed</Label>
                    <Select 
                      value={tutorSettings.responseSpeed} 
                      onValueChange={(value) => setTutorSettings(prev => ({ ...prev, responseSpeed: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Study Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSendMessage("Can you help me solve a math problem?")}
                  >
                    <Calculator className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="text-sm font-medium">Math Solver</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSendMessage("Can you help me with language and grammar?")}
                  >
                    <Languages className="h-4 w-4 mr-3 text-purple-600" />
                    <span className="text-sm font-medium">Language Helper</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSendMessage("Can you explain a science concept or help with an experiment?")}
                  >
                    <FlaskConical className="h-4 w-4 mr-3 text-green-600" />
                    <span className="text-sm font-medium">Science Lab</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSendMessage("Can you create flashcards or a quiz for me?")}
                  >
                    <Sparkles className="h-4 w-4 mr-3 text-orange-600" />
                    <span className="text-sm font-medium">Study Materials</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today's Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Questions Asked</span>
                      <span className="font-semibold">{progress.questionsAsked}/{progress.questionsGoal}</span>
                    </div>
                    <Progress value={(progress.questionsAsked / progress.questionsGoal) * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Study Time</span>
                      <span className="font-semibold">{progress.studyTime}min</span>
                    </div>
                    <Progress value={(progress.studyTime / progress.studyGoal) * 100} className="h-2" />
                  </div>

                  <Separator />

                  <div className="text-center">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Keep Learning!
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Ask me to explain any concept</p>
                    <p>• Request practice problems</p>
                    <p>• Get homework help</p>
                    <p>• Create study materials</p>
                    <p>• Ask for examples</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Voice Assistant */}
      {isVoiceEnabled && (
        <VoiceAssistant
          onVoiceCommand={handleVoiceCommand}
          onToggle={setIsListening}
        />
      )}
    </div>
  );
}
