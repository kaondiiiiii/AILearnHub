import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  onVoiceCommand?: (command: string) => void;
  onToggle?: (isActive: boolean) => void;
  className?: string;
}

export default function VoiceAssistant({ 
  onVoiceCommand, 
  onToggle, 
  className 
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!isEnabled) return;

    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      onToggle?.(true);
    };

    recognitionInstance.onresult = (event) => {
      const command = event.results[0][0].transcript;
      setLastCommand(command);
      onVoiceCommand?.(command);
      
      // Process common voice commands
      processVoiceCommand(command);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      onToggle?.(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      onToggle?.(false);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    onToggle?.(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    if (!newEnabled && isListening) {
      stopListening();
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Handle navigation commands
    if (lowerCommand.includes('go to') || lowerCommand.includes('open')) {
      if (lowerCommand.includes('dashboard') || lowerCommand.includes('home')) {
        window.location.href = '/';
      } else if (lowerCommand.includes('flashcard')) {
        window.location.href = '/flashcards';
      } else if (lowerCommand.includes('quiz')) {
        window.location.href = '/quizzes';
      } else if (lowerCommand.includes('lesson')) {
        window.location.href = '/lessons';
      } else if (lowerCommand.includes('tutor') || lowerCommand.includes('chat')) {
        window.location.href = '/ai-tutor';
      } else if (lowerCommand.includes('mind map')) {
        window.location.href = '/mind-map';
      } else if (lowerCommand.includes('analytics')) {
        window.location.href = '/analytics';
      }
    }

    // Handle action commands
    if (lowerCommand.includes('create new') || lowerCommand.includes('generate')) {
      // Trigger appropriate creation flows
      if (lowerCommand.includes('flashcard')) {
        // Navigate to flashcard generator
        window.location.href = '/flashcards?tab=generate';
      } else if (lowerCommand.includes('quiz')) {
        window.location.href = '/quizzes?tab=create';
      } else if (lowerCommand.includes('lesson')) {
        window.location.href = '/lessons?tab=create';
      }
    }

    // Handle help commands
    if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      // Show help dialog or speak available commands
      speakText("I can help you navigate the platform, create content, and answer questions. Try saying 'go to flashcards' or 'create new quiz'.");
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Voice Command Display */}
      {lastCommand && (
        <Card className="mb-4 max-w-xs">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <Badge variant="secondary" className="text-xs">Heard</Badge>
            </div>
            <p className="text-sm text-gray-700">"{lastCommand}"</p>
          </CardContent>
        </Card>
      )}

      {/* Voice Control Buttons */}
      <div className="flex flex-col space-y-2">
        {/* Main Voice Button */}
        <Button
          size="lg"
          onClick={toggleListening}
          disabled={!isEnabled}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg transition-all duration-200",
            isListening 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "bg-blue-600 hover:bg-blue-700",
            !isEnabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>

        {/* Enable/Disable Toggle */}
        <Button
          size="sm"
          variant="outline"
          onClick={toggleEnabled}
          className="w-14 h-8 rounded-full bg-white shadow-md"
        >
          {isEnabled ? (
            <Volume2 className="h-4 w-4 text-green-600" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="absolute -top-2 -left-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full absolute top-0"></div>
        </div>
      )}
    </div>
  );
}
