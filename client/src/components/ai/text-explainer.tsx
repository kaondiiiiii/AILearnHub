import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EXPLANATION_LEVELS } from "@/lib/constants";

export default function TextExplainer() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [explanation, setExplanation] = useState("");

  // AI explanation mutation
  const explainMutation = useMutation({
    mutationFn: async ({ text, level, context }: { text: string; level: string; context?: string }) => {
      const response = await apiRequest('POST', '/api/ai/explain', { text, level, context });
      return response.json();
    },
    onSuccess: (data) => {
      setExplanation(data.explanation);
    },
  });

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        setPosition({ x: event.pageX, y: event.pageY - 10 });
        setIsVisible(true);
        setExplanation(""); // Reset explanation
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const tooltip = document.getElementById('explainTooltip');
      if (tooltip && !tooltip.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleExplain = (level: string) => {
    if (selectedText) {
      explainMutation.mutate({
        text: selectedText,
        level,
        context: window.location.pathname // Provide page context
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setExplanation("");
    setSelectedText("");
  };

  if (!isVisible) return null;

  return (
    <Card
      id="explainTooltip"
      className="fixed z-50 max-w-md shadow-xl border-gray-200 bg-white"
      style={{
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.max(position.y, 10),
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Brain className="h-5 w-5 text-blue-600 mr-2" />
            AI Explain
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selected Text */}
        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-700 font-medium">Selected text:</p>
          <p className="text-sm text-gray-900 mt-1">"{selectedText}"</p>
        </div>

        {/* Explanation Levels */}
        {!explanation && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Explain for:</p>
            <div className="flex flex-wrap gap-2">
              {EXPLANATION_LEVELS.map((level) => (
                <Button
                  key={level.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleExplain(level.id)}
                  disabled={explainMutation.isPending}
                  className="text-xs hover:bg-blue-50 hover:border-blue-300"
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {explainMutation.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Explanation Content */}
        {explanation && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{explanation}</p>
            
            <div className="flex items-center justify-between mt-3">
              <Badge variant="secondary" className="text-xs">
                AI Generated
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExplanation("")}
                  className="text-xs"
                >
                  Try Different Level
                </Button>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="text-xs"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {explainMutation.isError && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-900">
              Failed to generate explanation. Please try again.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExplanation("")}
              className="mt-2 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
