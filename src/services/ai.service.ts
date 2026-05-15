import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettingsStore } from '../store/useSettingsStore';

export const aiService = {
  async sendMessage(messages: { role: string, content: string }[], onChunk: (text: string) => void) {
    const settings = useSettingsStore.getState();
    const userApiKey = settings.apiKeys.gemini;
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!userApiKey && !envApiKey) {
      throw new Error("No Gemini API Key found. Please add it in Settings or .env");
    }

    // Helper to run the model stream
    const runStream = async (key: string) => {
      const genAI = new GoogleGenerativeAI(key);
      let modelName = settings.model.startsWith('gemini') ? settings.model : 'gemini-flash-latest';
      // Map deprecated model names that might be stuck in localStorage
      if ((modelName as string) === 'gemini-1.5-flash') modelName = 'gemini-flash-latest';
      if ((modelName as string) === 'gemini-1.5-pro') modelName = 'gemini-pro-latest';
      
      const systemInstruction = `You are PatternLab, an expert DSA tutor. You help users master data structures and algorithms by teaching concepts clearly.
Always respond in the user's preferred programming language unless they specify otherwise. The user's preferred language is ${settings.preferredLanguage}.

When asked about a topic or pattern:
1. First, provide a clear, concise Concept Explanation.
2. Analyze the user's skill level based on their prompt. If they are a beginner, provide Level 1 questions. If intermediate, Level 2. If advanced, Level 3. Do not provide all 3 levels at once unless explicitly asked. Provide exactly 3 questions for the chosen level.

CRITICAL INSTRUCTION FOR QUESTIONS:
Every single practice question you generate MUST be output as a standalone JSON block fenced with \`\`\`json. The JSON MUST exactly follow this schema:
\`\`\`json
{
  "id": "unique-slug-for-problem",
  "title": "Problem Title",
  "description": "Full problem statement markdown...",
  "level": 1, // or 2, or 3
  "pattern": "relevant pattern",
  "topic": "relevant topic",
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "constraints": ["..."],
  "hints": ["hint 1", "hint 2"],
  "testCases": [{"id": "tc1", "input": "...", "expectedOutput": "..."}]
}
\`\`\`
Do NOT write questions as plain text. The frontend relies on parsing these JSON blocks to render interactive components.`;

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction
      });

      let rawHistory = messages.slice(0, -1);
      while (rawHistory.length > 0 && rawHistory[0].role !== 'user') {
        rawHistory.shift();
      }

      const history = rawHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history
      });

      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessageStream(lastMessage);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(fullText);
      }
      return fullText;
    };

    try {
      // Try the user's API key first if it exists
      if (userApiKey) {
        return await runStream(userApiKey);
      } else {
        // If no user key, just use env key
        return await runStream(envApiKey);
      }
    } catch (error: any) {
      // If the user's key failed and we have an env key to fallback on
      if (userApiKey && envApiKey) {
        console.warn("User API key failed, falling back to .env API key...", error);
        return await runStream(envApiKey);
      }
      throw error; // Re-throw if there is no fallback or fallback also failed
    }
  }
};
