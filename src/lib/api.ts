import { Scenario, Message, skills, recentSessions } from './mock-data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  startSimulation: async (scenarioId: string, difficulty: string) => {
    await delay(800);
    return {
      sessionId: `session_${Date.now()}`,
      status: 'started'
    };
  },

  sendMessage: async (sessionId: string, message: string): Promise<Message> => {
    await delay(1200); // Simulate AI thinking time
    
    // Simple mock responses based on length of user message
    let responseText = "That's interesting, tell me more.";
    if (message.length > 50) {
      responseText = "I see your point. It's really fascinating how that works out in practice. What are your thoughts on the alternatives?";
    } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      responseText = "Hi there! How are you doing today?";
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: responseText,
      timestamp: new Date().toISOString()
    };
  },

  endSimulation: async (sessionId: string) => {
    await delay(1000);
    return { success: true };
  },

  getEvaluation: async (sessionId: string) => {
    await delay(1500);
    return {
      overallScore: 8.2,
      skills: [
        { name: 'Communication', score: 8.5 },
        { name: 'Confidence', score: 7.5 },
        { name: 'Active Listening', score: 9.0 },
        { name: 'Empathy', score: 8.0 }
      ],
      whatYouDidWell: [
        "Asked great open-ended questions",
        "Maintained a positive and friendly tone",
        "Showed active listening by referencing previous points"
      ],
      areasToImprove: [
        "Try to be more concise in your explanations",
        "Don't be afraid to take brief pauses before answering complex questions"
      ],
      betterResponses: [
        {
          type: "Casual",
          text: "Yeah, I totally get what you mean. It's been pretty crazy lately!"
        },
        {
          type: "Confident",
          text: "I'm confident we can resolve this issue by reallocating our resources."
        },
        {
          type: "Friendly",
          text: "I'd love to hear more about your experience with that if you have time."
        }
      ]
    };
  },

  getHistory: async () => {
    await delay(500);
    return recentSessions;
  },

  getProgress: async () => {
    await delay(500);
    return skills;
  }
};
