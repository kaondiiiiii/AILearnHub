/**
 * Utility functions for input validation and processing
 */

/**
 * Validates and trims user input to prevent empty or dangerous inputs
 * from reaching the OpenAI API
 * 
 * @param input The user input string to validate and trim
 * @returns A sanitized string or empty string if invalid
 */
export function validateAndTrimPrompt(input: string): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[\\`]/g, '');
  
  // Check if we still have content after sanitization
  return sanitized;
}

/**
 * Generates a collapsible HTML preview of a mind map structure
 * 
 * @param mindMap The mind map node to render as HTML
 * @returns HTML string representation of the mind map
 */
export function generateMindMapPreviewHTML(mindMap: any): string {
  if (!mindMap) return '<div>No mind map data available</div>';
  
  const renderNode = (node: any, depth = 0): string => {
    if (!node) return '';
    
    const padding = depth * 20; // Increase padding for each level
    const hasChildren = node.children && node.children.length > 0;
    
    let html = `
      <div class="mind-map-node" style="padding-left: ${padding}px;">
        <div class="node-content">
          <span class="node-label">${node.label || 'Unnamed Node'}</span>
          ${hasChildren ? '<button class="toggle-btn">+</button>' : ''}
        </div>
    `;
    
    if (hasChildren) {
      html += '<div class="children">';
      for (const child of node.children) {
        html += renderNode(child, depth + 1);
      }
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  };
  
  return `
    <div class="mind-map-preview">
      ${renderNode(mindMap)}
    </div>
    <style>
      .mind-map-preview {
        font-family: Arial, sans-serif;
        margin: 10px 0;
      }
      .mind-map-node {
        margin: 5px 0;
      }
      .node-content {
        display: flex;
        align-items: center;
      }
      .node-label {
        font-weight: bold;
      }
      .toggle-btn {
        margin-left: 5px;
        cursor: pointer;
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 20px;
        height: 20px;
      }
      .children {
        margin-left: 10px;
      }
    </style>
    <script>
      document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const children = btn.closest('.node-content').nextElementSibling;
          if (children) {
            children.style.display = children.style.display === 'none' ? 'block' : 'none';
            btn.textContent = children.style.display === 'none' ? '+' : '-';
          }
        });
      });
    </script>
  `;
}

/**
 * Creates a fallback mind map structure when the API fails
 * 
 * @param topic The original topic for the mind map
 * @returns A simple mind map structure
 */
export function createFallbackMindMap(topic: string): any {
  return {
    id: "root",
    label: topic || "Learning Topic",
    children: [
      {
        id: "subtopic1",
        label: "Key Concepts",
        children: [
          { id: "detail1", label: "Basic Definition" },
          { id: "detail2", label: "Important Facts" }
        ]
      },
      {
        id: "subtopic2",
        label: "Applications",
        children: [
          { id: "detail3", label: "Real-world Examples" },
          { id: "detail4", label: "Practice Problems" }
        ]
      },
      {
        id: "subtopic3",
        label: "Resources",
        children: [
          { id: "detail5", label: "Further Reading" }
        ]
      }
    ]
  };
}

/**
 * Creates fallback quiz questions when the API fails
 * 
 * @param topic The original topic for the quiz
 * @param subject The subject of the quiz
 * @param numberOfQuestions Number of questions to generate
 * @param questionTypes Types of questions to include
 * @returns A gamified array of quiz questions with difficulty levels, time limits, and point values
 */
export function createFallbackQuiz(topic: string, subject: string = 'General Knowledge', numberOfQuestions: number = 4, questionTypes: string[] = ['multiple-choice', 'true-false']): any[] {
  return [
    {
      type: "multiple-choice",
      question: `What is the main focus of ${topic}?`,
      options: ["Understanding key concepts", "Memorizing facts", "Practical applications", "Historical context"],
      correctAnswer: "Understanding key concepts",
      explanation: "The primary goal is to understand the fundamental concepts.",
      difficulty: "easy",
      timeLimit: 20, // seconds
      points: 100,
      imageUrl: null
    },
    {
      type: "true-false",
      question: `${topic} is an important area of study in modern education.`,
      correctAnswer: "True",
      explanation: "Most educational topics have relevance in modern education.",
      difficulty: "medium",
      timeLimit: 15, // seconds
      points: 150,
      imageUrl: null
    },
    {
      type: "multiple-choice",
      question: `Which of the following is a practical application of ${topic}?`,
      options: ["Solving real-world problems", "Taking tests", "Memorizing formulas", "Writing essays"],
      correctAnswer: "Solving real-world problems",
      explanation: "${topic} is most valuable when applied to solve actual problems.",
      difficulty: "hard",
      timeLimit: 30, // seconds
      points: 200,
      imageUrl: null
    },
    {
      type: "short-answer",
      question: `Briefly explain why ${topic} is relevant in today's world.`,
      correctAnswer: "It helps us understand and solve contemporary problems.",
      explanation: "${topic} provides frameworks and tools to address modern challenges.",
      difficulty: "hard",
      timeLimit: 45, // seconds
      points: 250,
      imageUrl: null
    }
  ];
}

/**
 * Creates fallback flashcards when the API fails
 * 
 * @param content The content to create flashcards from
 * @param subject The subject for the flashcards
 * @param numberOfCards Number of flashcards to generate
 * @returns A simple array of flashcards
 */
export function createFallbackFlashcards(content: string, subject: string, numberOfCards: number = 5): any[] {
  return [
    {
      question: `What is ${subject}?`,
      answer: `${subject} is a field of study that focuses on understanding key concepts and their applications.`,
      difficulty: "easy"
    },
    {
      question: `Why is ${subject} important?`,
      answer: `${subject} helps us understand the world around us and develop critical thinking skills.`,
      difficulty: "medium"
    }
  ];
}
