import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Save, Download, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface FlashcardGeneratorProps {
  onDeckCreated?: (title: string, subject: string, grade: string) => void;
}

interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function FlashcardGenerator({ onDeckCreated }: FlashcardGeneratorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [deckTitle, setDeckTitle] = useState("");
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);

  // Generate flashcards mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/generate-flashcards', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCards(data.flashcards || []);
      if (data.flashcards?.length > 0) {
        toast({
          title: "Flashcards Generated!",
          description: `Successfully generated ${data.flashcards.length} flashcards.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save deck mutation
  const saveDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      const response = await apiRequest('POST', '/api/flashcard-decks', deckData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck Saved!",
        description: "Your flashcard deck has been saved successfully.",
      });
      onDeckCreated?.(deckTitle, subject, gradeLevel);
      // Reset form
      setContent("");
      setDeckTitle("");
      setGeneratedCards([]);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save flashcard deck.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!content.trim() || !subject || !gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      content: content.trim(),
      subject,
      gradeLevel,
      numberOfCards,
    });
  };

  const handleSave = () => {
    if (!deckTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your flashcard deck.",
        variant: "destructive",
      });
      return;
    }

    if (generatedCards.length === 0) {
      toast({
        title: "No Cards to Save",
        description: "Please generate flashcards first.",
        variant: "destructive",
      });
      return;
    }

    saveDeckMutation.mutate({
      title: deckTitle,
      subject,
      grade: gradeLevel,
      description: `AI-generated flashcards for ${subject}`,
      isPublic: false,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Generate AI Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Content or Topic *</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your lesson content or enter a topic like 'Photosynthesis' or 'World War 2'..."
                  className="h-32 resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subj) => (
                        <SelectItem key={subj.id} value={subj.id}>
                          <i className={subj.icon + " mr-2"} />
                          {subj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">Grade Level *</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
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

              <div>
                <Label htmlFor="numberOfCards">Number of Cards</Label>
                <Input
                  id="numberOfCards"
                  type="number"
                  min="5"
                  max="50"
                  value={numberOfCards}
                  onChange={(e) => setNumberOfCards(parseInt(e.target.value) || 10)}
                  className="w-full"
                />
              </div>
            </div>

            {/* AI Features */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-2">AI Features</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✨ Intelligent content analysis</li>
                  <li>🎯 Grade-appropriate language</li>
                  <li>📊 Balanced difficulty levels</li>
                  <li>🧠 Memory-optimized questions</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !content.trim() || !subject || !gradeLevel}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Cards */}
      {(generateMutation.isPending || generatedCards.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Flashcards</CardTitle>
              {generatedCards.length > 0 && (
                <Badge variant="secondary">{generatedCards.length} cards</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Save Options */}
            {generatedCards.length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="deckTitle">Deck Title</Label>
                  <Input
                    id="deckTitle"
                    placeholder="Enter a name for your flashcard deck"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saveDeckMutation.isPending || !deckTitle.trim()}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Deck
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Loading State */}
            {generateMutation.isPending && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Generated Cards List */}
            {generatedCards.length > 0 && (
              <div className="space-y-4">
                {generatedCards.map((card, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={getDifficultyColor(card.difficulty)}>
                          {card.difficulty}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`Q: ${card.question}\nA: ${card.answer}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
                          <p className="text-gray-900">{card.question}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Answer:</p>
                          <p className="text-gray-900">{card.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
