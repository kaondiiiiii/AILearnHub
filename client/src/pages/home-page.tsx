import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Clock, Star, TrendingUp, BookOpen, Users, Target } from "lucide-react";
import { DashboardStats, RecentActivity, AIRecommendation } from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();

  // Fetch dashboard data based on user role
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/analytics/overview'],
    enabled: !!user && ['principal', 'admin'].includes(user.role),
  });

  const { data: studyProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/study-progress'],
    enabled: !!user,
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/ai/interactions', { limit: 5 }],
    enabled: !!user,
  });

  const getDashboardStats = (): DashboardStats => {
    if (user?.role === 'principal' || user?.role === 'admin') {
      return stats || {
        totalStudents: 0,
        totalTeachers: 0,
        averagePerformance: 0,
        studentsNeedingAttention: 0
      };
    }
    // Student/Teacher personal stats
    return {
      flashcardsMastered: 284,
      quizAverage: 92,
      studyTimeToday: 2.4,
      currentLevel: 8
    };
  };

  const getMockRecentActivities = (): RecentActivity[] => [
    {
      id: '1',
      type: 'quiz',
      title: 'Completed "Algebra Basics" quiz',
      subject: 'Mathematics',
      timeAgo: '2 hours ago',
      score: 95
    },
    {
      id: '2',
      type: 'flashcard',
      title: 'Generated flashcards for "Chemical Reactions"',
      subject: 'Chemistry',
      timeAgo: '4 hours ago',
      status: '24 cards'
    },
    {
      id: '3',
      type: 'mindmap',
      title: 'Created mind map for "World War II"',
      subject: 'History',
      timeAgo: 'Yesterday',
      status: 'Saved'
    }
  ];

  const getMockAIRecommendations = (): AIRecommendation[] => [
    {
      id: '1',
      title: 'Review Fractions',
      description: 'You struggled with this in your last quiz',
      action: 'Start Review',
      type: 'review'
    },
    {
      id: '2',
      title: 'Try Physics Flashcards',
      description: 'Based on your strong performance in Math',
      action: 'Explore',
      type: 'explore'
    }
  ];

  const dashboardStats = getDashboardStats();
  const mockActivities = getMockRecentActivities();
  const mockRecommendations = getMockAIRecommendations();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderStatsCards = () => {
    if (user?.role === 'principal' || user?.role === 'admin') {
      return (
        <>
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-blue-600">+5.2%</Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats.totalStudents || 0}
              </h3>
              <p className="text-gray-600 text-sm">Total Students</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-blue-600">+2.1%</Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats.totalTeachers || 0}
              </h3>
              <p className="text-gray-600 text-sm">Active Teachers</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-blue-600">+12%</Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : `${dashboardStats.averagePerformance || 0}%`}
              </h3>
              <p className="text-gray-600 text-sm">Average Performance</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-800">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <Badge variant="destructive" className="bg-blue-100 text-blue-700 border border-blue-200">-3 alerts</Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats.studentsNeedingAttention || 0}
              </h3>
              <p className="text-gray-600 text-sm">Students Need Attention</p>
            </CardContent>
          </Card>
        </>
      );
    }

    // Student/Teacher personal stats
    return (
      <>
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-blue-600">+12%</Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.flashcardsMastered}</h3>
            <p className="text-gray-600 text-sm">Flashcards Mastered</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-blue-600">+8%</Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.quizAverage}%</h3>
            <p className="text-gray-600 text-sm">Quiz Average</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-blue-600">+15%</Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.studyTimeToday}h</h3>
            <p className="text-gray-600 text-sm">Study Time Today</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-800">
                <Star className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-blue-600">New!</Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Level {dashboardStats.currentLevel}</h3>
            <p className="text-gray-600 text-sm">Current Level</p>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopBar />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="text-gray-600">
              {user?.role === 'student' && "Here's what's happening with your learning today."}
              {user?.role === 'teacher' && "Ready to inspire minds and create amazing lessons today."}
              {user?.role === 'parent' && "Track your child's educational progress and achievements."}
              {(user?.role === 'principal' || user?.role === 'admin') && "Monitor school performance and insights."}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderStatsCards()}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activitiesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-6 w-12" />
                        </div>
                      ))
                    ) : (
                      mockActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'quiz' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'flashcard' ? 'bg-purple-100 text-purple-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <i className={`fas ${
                              activity.type === 'quiz' ? 'fa-check-circle' :
                              activity.type === 'flashcard' ? 'fa-brain' :
                              'fa-project-diagram'
                            }`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.subject} • {activity.timeAgo}</p>
                          </div>
                          <span className={`font-semibold ${
                            activity.score ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {activity.score ? `${activity.score}%` : activity.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations & Quick Actions */}
            <div className="space-y-6">
              {/* AI Recommendations */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-gray-900">AI Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockRecommendations.map((rec) => (
                      <div key={rec.id} className="p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                        <Button size="sm" variant="link" className="mt-2 p-0 h-auto text-xs font-medium">
                          {rec.action} →
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50">
                      <i className="fas fa-plus-circle text-blue-500 text-xl"></i>
                      <span className="text-xs font-medium">New Quiz</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50">
                      <i className="fas fa-robot text-blue-500 text-xl"></i>
                      <span className="text-xs font-medium">Ask AI</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50">
                      <i className="fas fa-layer-group text-blue-500 text-xl"></i>
                      <span className="text-xs font-medium">Flashcards</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50">
                      <i className="fas fa-project-diagram text-blue-500 text-xl"></i>
                      <span className="text-xs font-medium">Mind Map</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Study Progress */}
              {(user?.role === 'student' || user?.role === 'teacher') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Questions Asked</span>
                          <span className="font-semibold">12/15</span>
                        </div>
                        <Progress value={80} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Study Time</span>
                          <span className="font-semibold">45min</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
