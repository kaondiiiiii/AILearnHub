import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import PerformanceChart from "@/components/charts/performance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Users, BookOpen, TrendingUp, TrendingDown, AlertTriangle,
  FileText, UserCheck, Calendar, Clock, Download, Lightbulb,
  CheckCircle, TriangleAlert, Target, Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  averagePerformance: number;
  studentsNeedingAttention: number;
  subjectPerformance: Record<string, number>;
  trends: {
    performanceChange: number;
    engagementChange: number;
    attendanceChange: number;
  };
}

interface AIInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'success';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("performance");

  // Check if user has access to analytics
  const hasAccess = user?.role === 'principal' || user?.role === 'admin';

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/overview', timeRange],
    enabled: hasAccess,
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <TopBar />
          <main className="p-6">
            <div className="max-w-2xl mx-auto text-center py-16">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
              <p className="text-gray-600">
                Coming Soon
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being prepared for download.",
    });
  };

  const getPerformanceData = () => {
    if (!analyticsData) return [];
    
    return Object.entries(analyticsData.subjectPerformance).map(([subject, performance]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      performance,
      trend: Math.floor(Math.random() * 20) - 10, // Mock trend data
      color: getSubjectColor(subject),
    }));
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      math: 'text-blue-600',
      science: 'text-green-600',
      english: 'text-purple-600',
      history: 'text-orange-600',
      geography: 'text-teal-600',
    };
    return colors[subject as keyof typeof colors] || 'text-gray-600';
  };

  const getMockAIInsights = (): AIInsight[] => [
    {
      id: '1',
      type: 'warning',
      title: 'Math Performance Declining in Grade 9B',
      description: 'AI detected a 15% drop in math quiz scores over the past 3 weeks. Recommend additional support sessions.',
      confidence: 92,
      action: 'Schedule intervention',
      priority: 'high'
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Science Engagement Increasing',
      description: 'Students are spending 23% more time on science flashcards. Consider expanding science curriculum.',
      confidence: 87,
      action: 'Expand curriculum',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Teacher Support Needed',
      description: 'Student performance in Mrs. Johnson\'s classes has dropped. She may benefit from additional resources or training.',
      confidence: 78,
      action: 'Schedule meeting',
      priority: 'medium'
    },
    {
      id: '4',
      type: 'success',
      title: 'Excellent Flashcard Adoption',
      description: 'AI-generated flashcards show 94% completion rate across all grades. Students are highly engaged.',
      confidence: 96,
      priority: 'low'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <TriangleAlert className="h-5 w-5 text-orange-600" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-orange-500 bg-orange-50';
      case 'opportunity': return 'border-l-blue-500 bg-blue-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatPercentageChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (analyticsError) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <TopBar />
          <main className="p-6">
            <Alert className="max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load analytics data. Please check your connection and try again.
              </AlertDescription>
            </Alert>
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
              <BarChart3 className="h-8 w-8 text-blue-600" />
              School Analytics
            </h1>
            <p className="text-gray-600">Comprehensive insights into school performance and trends</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-6">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {analyticsData && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(analyticsData.trends.performanceChange)}
                      <Badge variant="secondary" className={getTrendColor(analyticsData.trends.performanceChange)}>
                        {formatPercentageChange(analyticsData.trends.performanceChange)}
                      </Badge>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsLoading ? <Skeleton className="h-8 w-16" /> : analyticsData?.totalStudents || 0}
                </h3>
                <p className="text-gray-600 text-sm">Total Students</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-600">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  {analyticsData && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(analyticsData.trends.engagementChange)}
                      <Badge variant="secondary" className={getTrendColor(analyticsData.trends.engagementChange)}>
                        {formatPercentageChange(analyticsData.trends.engagementChange)}
                      </Badge>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsLoading ? <Skeleton className="h-8 w-16" /> : analyticsData?.totalTeachers || 0}
                </h3>
                <p className="text-gray-600 text-sm">Active Teachers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-green-600">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  {analyticsData && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(analyticsData.trends.attendanceChange)}
                      <Badge variant="secondary" className={getTrendColor(analyticsData.trends.attendanceChange)}>
                        {formatPercentageChange(analyticsData.trends.attendanceChange)}
                      </Badge>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsLoading ? <Skeleton className="h-8 w-16" /> : `${analyticsData?.averagePerformance || 0}%`}
                </h3>
                <p className="text-gray-600 text-sm">Average Performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="destructive">Needs Attention</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsLoading ? <Skeleton className="h-8 w-16" /> : analyticsData?.studentsNeedingAttention || 0}
                </h3>
                <p className="text-gray-600 text-sm">Students Need Support</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Performance Chart */}
                <div>
                  {analyticsLoading ? (
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-2 w-full" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <PerformanceChart
                      data={getPerformanceData()}
                      title="Subject Performance Heatmap"
                      showTrends={true}
                    />
                  )}
                </div>

                {/* Performance Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Academic Performance</SelectItem>
                        <SelectItem value="engagement">Student Engagement</SelectItem>
                        <SelectItem value="attendance">Attendance Rate</SelectItem>
                        <SelectItem value="completion">Assignment Completion</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {analyticsLoading ? (
                      <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                          <p className="text-gray-600">Loading performance data...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-100">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Performance trending upward</p>
                          <p className="text-sm text-gray-500">
                            Average improvement: +{analyticsData?.trends.performanceChange || 0}% this semester
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quiz Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Average Score</span>
                        <span className="font-semibold text-green-600">85.3%</span>
                      </div>
                      <Progress value={85.3} className="h-2" />
                      <p className="text-xs text-gray-500">+3.2% from last month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Flashcard Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completion Rate</span>
                        <span className="font-semibold text-blue-600">92.7%</span>
                      </div>
                      <Progress value={92.7} className="h-2" />
                      <p className="text-xs text-gray-500">+5.1% from last month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Tool Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Daily Active Users</span>
                        <span className="font-semibold text-purple-600">78.4%</span>
                      </div>
                      <Progress value={78.4} className="h-2" />
                      <p className="text-xs text-gray-500">+12.3% from last month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        AI-Generated Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getMockAIInsights().map((insight) => (
                          <div key={insight.id} className={`p-4 border-l-4 rounded-r-lg ${getInsightBorderColor(insight.type)}`}>
                            <div className="flex items-start space-x-3">
                              {getInsightIcon(insight.type)}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Confidence: {insight.confidence}%</span>
                                  {insight.action && (
                                    <Button size="sm" variant="link" className="p-0 h-auto text-xs">
                                      {insight.action} →
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-3 text-blue-600" />
                        <span className="text-sm font-medium">Export Monthly Report</span>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-3 text-purple-600" />
                        <span className="text-sm font-medium">Schedule Teacher Meeting</span>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start">
                        <UserCheck className="h-4 w-4 mr-3 text-green-600" />
                        <span className="text-sm font-medium">Send Parent Notifications</span>
                      </Button>

                      <Button variant="outline" className="w-full justify-start">
                        <Award className="h-4 w-4 mr-3 text-orange-600" />
                        <span className="text-sm font-medium">Review Achievements</span>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-900">Low attendance in 8A</p>
                          <p className="text-red-600 text-xs">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-900">Quiz deadline approaching</p>
                          <p className="text-blue-600 text-xs">4 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-900">New teacher onboarded</p>
                          <p className="text-green-600 text-xs">1 day ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Monthly Performance Report</h3>
                      <p className="text-sm text-gray-600 mb-4">Comprehensive analysis of student and teacher performance</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Subject Analysis</h3>
                      <p className="text-sm text-gray-600 mb-4">Detailed breakdown of performance by subject area</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Teacher Effectiveness</h3>
                      <p className="text-sm text-gray-600 mb-4">Analysis of teaching methods and student outcomes</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Attendance Trends</h3>
                      <p className="text-sm text-gray-600 mb-4">Student attendance patterns and recommendations</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Target className="h-12 w-12 text-red-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Intervention Report</h3>
                      <p className="text-sm text-gray-600 mb-4">Students requiring additional support and resources</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Lightbulb className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">AI Insights Summary</h3>
                      <p className="text-sm text-gray-600 mb-4">Compiled AI recommendations and action items</p>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
