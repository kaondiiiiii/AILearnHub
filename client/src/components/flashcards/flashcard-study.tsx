import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle, Minus } from "lucide-react";
import { FlashcardDeck, Flashcard } from "@shared/schema";
import { cn } from "@/lib/utils";

interface FlashcardStudyProps {
  deck?: FlashcardDeck;
  cards: Flashcard[];
  onBack: () => void;
}

export default function FlashcardStudy({ deck, cards, onBack }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    studied: 0,
    correct: 0,
    timeSpent: 0,
  });
  const [startTime] = useState(Date.now());

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (difficulty: 'easy' | 'medium' | 'hard') => {
    const isCorrect = difficulty === 'easy';
    
    setSessionStats(prev => ({
      ...prev,
      studied: prev.studied + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }));

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const resetCard = () => {
    setIsFlipped(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    return sessionStats.studied > 0 
      ? Math.round((sessionStats.correct / sessionStats.studied) * 100)
      : 0;
  };

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h3>
        <p className="text-gray-600 mb-6">
          You've reviewed all {cards.length} cards in this deck.
        </p>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{sessionStats.studied}</p>
            <p className="text-sm text-gray-500">Cards Studied</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{getAccuracy()}%</p>
            <p className="text-sm text-gray-500">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatTime(sessionStats.timeSpent)}</p>
            <p className="text-sm text-gray-500">Time Spent</p>
          </div>
        </div>

        <div className="space-x-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
          <Button onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
            setSessionStats({ studied: 0, correct: 0, timeSpent: 0 });
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Study Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decks
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{deck?.title || 'Flashcard Study'}</h2>
          <p className="text-sm text-gray-500">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Time: {formatTime(sessionStats.timeSpent)}</span>
          <span>Accuracy: {getAccuracy()}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="relative mx-auto max-w-2xl">
        <div 
          className="flashcard cursor-pointer"
          onClick={flipCard}
        >
          <div className={cn(
            "flashcard-inner relative w-full h-80 transition-transform duration-600",
            isFlipped && "transform rotate-y-180"
          )}>
            {/* Front */}
            <Card className={cn(
              "flashcard-front absolute w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200",
              "flex items-center justify-center p-6 backface-hidden"
            )}>
              <CardContent className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentCard.question}
                </h3>
                <p className="text-sm text-gray-500">Click to reveal answer</p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card className={cn(
              "flashcard-back absolute w-full h-full bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200",
              "flex items-center justify-center p-6 backface-hidden transform rotate-y-180"
            )}>
              <CardContent className="text-center space-y-4">
                <p className="text-lg text-gray-900 mb-6">
                  {currentCard.answer}
                </p>
                
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('hard');
                    }}
                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Hard
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('medium');
                    }}
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Medium
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('easy');
                    }}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Easy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={resetCard}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Flip Back
        </Button>

        <Button
          onClick={goToNext}
          disabled={currentIndex === cards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{sessionStats.studied}</p>
            <p className="text-sm text-gray-500">Studied</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{getAccuracy()}%</p>
            <p className="text-sm text-gray-500">Accuracy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{formatTime(sessionStats.timeSpent)}</p>
            <p className="text-sm text-gray-500">Time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
