import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import FlashcardGenerator from "@/components/flashcards/flashcard-generator";
import FlashcardStudy from "@/components/flashcards/flashcard-study";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Plus, Play, BarChart3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FlashcardDeck, Flashcard } from "@shared/schema";

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);

  // Fetch flashcard decks
  const { data: decks, isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ['/api/flashcard-decks'],
  });

  // Fetch cards for selected deck
  const { data: cards, isLoading: cardsLoading } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcard-decks', selectedDeckId, 'cards'],
    enabled: !!selectedDeckId,
  });

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      const response = await apiRequest('POST', '/api/flashcard-decks', deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcard-decks'] });
    },
  });

  const handleDeckSelect = (deckId: number) => {
    setSelectedDeckId(deckId);
  };

  const handleCreateDeck = (title: string, subject: string, grade: string) => {
    createDeckMutation.mutate({
      title,
      subject,
      grade,
      description: `AI-generated flashcards for ${subject}`,
      isPublic: false,
    });
  };

  const getDifficultyColor = (masteryPercentage: number) => {
    if (masteryPercentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (masteryPercentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMasteryLevel = (deckId: number) => {
    // Mock mastery calculation - in real app, this would be based on study history
    const mockMastery = Math.floor(Math.random() * 100);
    return mockMastery;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              AI Flashcards
            </h1>
            <p className="text-gray-600">Generate and study with AI-powered flashcards</p>
          </div>

          <Tabs defaultValue="study" className="space-y-6">
            <TabsList>
              <TabsTrigger value="study">Study</TabsTrigger>
              <TabsTrigger value="generate">Generate New</TabsTrigger>
              <TabsTrigger value="library">My Library</TabsTrigger>
            </TabsList>

            {/* Study Tab */}
            <TabsContent value="study" className="space-y-6">
              {selectedDeckId && cards ? (
                <FlashcardStudy
                  deck={decks?.find(d => d.id === selectedDeckId)}
                  cards={cards}
                  onBack={() => setSelectedDeckId(null)}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Deck Selection */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Select a Deck to Study</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {decksLoading ? (
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
                        ) : decks && decks.length > 0 ? (
                          <div className="space-y-3">
                            {decks.map((deck) => {
                              const masteryLevel = getMasteryLevel(deck.id);
                              return (
                                <div
                                  key={deck.id}
                                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                                  onClick={() => handleDeckSelect(deck.id)}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                      <Brain className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">{deck.title}</h3>
                                      <p className="text-sm text-gray-500">{deck.subject} • {deck.grade}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Badge className={getDifficultyColor(masteryLevel)}>
                                      {masteryLevel >= 80 ? 'Mastered' : masteryLevel >= 60 ? 'Learning' : 'Needs Review'}
                                    </Badge>
                                    <Button size="sm">
                                      <Play className="h-4 w-4 mr-1" />
                                      Study
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flashcard Decks Yet</h3>
                            <p className="text-gray-500 mb-4">Create your first AI-generated flashcard deck to start studying</p>
                            <Button onClick={() => document.querySelector('[value="generate"]')?.click()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Generate Flashcards
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Study Stats */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Study Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Decks Studied</span>
                            <span className="font-semibold">{decks?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cards Reviewed</span>
                            <span className="font-semibold">284</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy Rate</span>
                            <span className="font-semibold text-green-600">87%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Study Streak</span>
                            <span className="font-semibold">7 days</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Brain className="h-4 w-4 mr-2" />
                            AI Study Tips
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate">
              <FlashcardGenerator onDeckCreated={handleCreateDeck} />
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Flashcard Library</CardTitle>
                    <Button onClick={() => document.querySelector('[value="generate"]')?.click()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Deck
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {decksLoading ? (
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
                  ) : decks && decks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {decks.map((deck) => {
                        const masteryLevel = getMasteryLevel(deck.id);
                        return (
                          <Card key={deck.id} className="card-hover">
                            <CardContent className="pt-6">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                  <Brain className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{deck.title}</h3>
                                  <p className="text-sm text-gray-500">{deck.subject}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Grade Level</span>
                                  <span className="font-medium">{deck.grade}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Mastery</span>
                                  <Badge className={getDifficultyColor(masteryLevel)}>
                                    {masteryLevel}%
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Created</span>
                                  <span className="font-medium">
                                    {deck.createdAt ? new Date(deck.createdAt).toLocaleDateString() : 'Recently'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <Button 
                                  className="w-full" 
                                  onClick={() => handleDeckSelect(deck.id)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Study Now
                                </Button>
                                <Button variant="outline" className="w-full">
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Stats
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flashcard Decks</h3>
                      <p className="text-gray-500 mb-4">Start by generating your first AI-powered flashcard deck</p>
                      <Button onClick={() => document.querySelector('[value="generate"]')?.click()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Your First Deck
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
