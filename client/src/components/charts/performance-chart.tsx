import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceData {
  subject: string;
  performance: number;
  trend: number;
  color: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  showTrends?: boolean;
}

export default function PerformanceChart({ 
  data, 
  title = "Subject Performance", 
  showTrends = true 
}: PerformanceChartProps) {
  
  const maxPerformance = useMemo(() => Math.max(...data.map(d => d.performance)), [data]);

  const getPerformanceLevel = (performance: number) => {
    if (performance >= 90) return { label: "Excellent", color: "bg-green-500" };
    if (performance >= 80) return { label: "Good", color: "bg-blue-500" };
    if (performance >= 70) return { label: "Average", color: "bg-yellow-500" };
    if (performance >= 60) return { label: "Below Average", color: "bg-orange-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const level = getPerformanceLevel(item.performance);
            const barWidth = (item.performance / maxPerformance) * 100;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 w-20">
                      {item.subject}
                    </span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded ${
                            i < Math.floor(item.performance / 20) 
                              ? level.color 
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.performance}%
                    </span>
                    {showTrends && (
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(item.trend)}
                        <span className={`text-xs font-medium ${getTrendColor(item.trend)}`}>
                          {item.trend > 0 ? '+' : ''}{item.trend}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${level.color}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                
                {/* Performance Badge */}
                <div className="flex justify-between items-center">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      item.performance >= 90 ? 'bg-green-100 text-green-800' :
                      item.performance >= 80 ? 'bg-blue-100 text-blue-800' :
                      item.performance >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      item.performance >= 60 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {level.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Performance Scale</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded" />
                <span>90%+</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded" />
                <span>80-89%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded" />
                <span>70-79%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded" />
                <span>&lt;70%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
