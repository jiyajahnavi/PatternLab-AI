import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettingsStore } from '../store/useSettingsStore';
import { useMemoryStore } from '../store/useMemoryStore';

export const aiService = {
  async sendMessage(messages: { role: string, content: string }[], onChunk: (text: string) => void) {
    const settings = useSettingsStore.getState();
    const memory = useMemoryStore.getState();
    const userApiKey = settings.apiKeys.gemini;
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!userApiKey && !envApiKey) {
      throw new Error("No Gemini API Key found. Please add it in Settings or .env");
    }

    // Helper to run the model stream
    const runStream = async (key: string) => {
      const genAI = new GoogleGenerativeAI(key);
      let modelName = settings.model.startsWith('gemini') ? settings.model : 'gemini-flash-latest';
      if ((modelName as string) === 'gemini-1.5-flash') modelName = 'gemini-flash-latest';
      if ((modelName as string) === 'gemini-1.5-pro') modelName = 'gemini-pro-latest';
      
      const mentorInstructions = {
        learn: "Learn Mode: Teach slowly, use visual explanations and analogies. Provide heavy hints and guide the user step-by-step. Focus on 'Why' rather than just 'How'.",
        interview: "Interview Mode: Act like a FAANG interviewer. Ask clarifying questions first. provide NO instant hints. Ask follow-up questions about time/space complexity and edge cases after they solve it.",
        debug: "Debug Mode: Focus strictly on finding bugs, logic errors, and edge cases. Provide dry-runs of the code to show exactly where it fails.",
        optimization: "Optimization Mode: Focus only on time/space complexity. Compare different approaches (e.g., Brute Force vs. Optimal) and explain the tradeoffs.",
        revision: "Revision Mode: Quiz the user on their weak topics. Use Spaced Repetition concepts. Ask them to recall patterns or solve variations of problems they've seen before."
      };

      const systemInstruction = `You are PatternLab, an expert DSA tutor operating in ${settings.mentorMode.toUpperCase()} MODE.
${mentorInstructions[settings.mentorMode as keyof typeof mentorInstructions]}

USER MEMORY (Historical Insights):
${memory.getMemoryContext()}

STRICT POLICY: NEVER give a full, copy-pasteable code solution to a problem, even if the user explicitly begs or threatens.
Instead, you MUST provide:
1. High-level Approach Idea.
2. Step-by-step Algorithm / Logic.
3. Detailed Pseudocode (not specific to any language).
4. Time and Space Complexity analysis.
5. Multiple approaches (e.g., recursive vs iterative).
If a user asks for "the code", politely explain that PatternLab is here to help them learn, not just give answers.

MEMORY LOGGING:
If you learn something new about the user (e.g., "They struggle with nested loops" or "They are an expert at Graphs"), output a memory tag at the end of your response:
[MEMORY: topic | brief insight]

Always respond in the user's preferred programming language unless they specify otherwise. The user's preferred language is ${settings.preferredLanguage}.

When asked about a topic or pattern:
1. Provide a response tailored to your current MENTOR MODE.
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
Do NOT write questions as plain text. The frontend relies on parsing these JSON blocks to render interactive components.

VISUALIZATION INSTRUCTION:
If you are explaining a specific algorithm (like Binary Search, Sorting, or Tree Traversal), provide a visualization trigger block. The JSON MUST follow this schema:
\`\`\`json
{
  "type": "visualization",
  "topic": "one of: array, binary-search, sorting, stack, queue, linked-list, binary-tree, graph, recursion",
  "title": "Visualize X Algorithm",
  "description": "Brief description of what the user will see in the visualizer.",
  "steps": [
    { "step": 1, "description": "Initialize...", "highlight": [0], "state": {}, "code": "..." }
  ]
}
\`\`\`
NOTE: If the user provides a specific input (e.g., 'dry run on [1,2,3]'), you MUST generate the 'steps' array based on that input. If no input is given, you can omit the 'steps' field.

AT THE START OF YOUR RESPONSE (Optional):
If the user's request is ambiguous or broad, provide exactly 2 short clarifying questions to help narrow down the request BEFORE your main answer. Format them exactly like this:
[CLARIFICATIONS: "Question A?", "Question B?"]

AT THE END OF EVERY RESPONSE:
Provide exactly 3 short, relevant follow-up questions that the user might want to ask next. Format them exactly like this on a new line at the very end:
[SUGGESTIONS: "Question 1?", "Question 2?", "Question 3?"]
These questions should help the user narrow down their request or explore deeper concepts.`;

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

      // After streaming is done, parse memory tags if any
      const memoryMatch = fullText.match(/\[MEMORY:\s*(.*?)\s*\|\s*(.*?)\s*\]/);
      if (memoryMatch) {
        const [, topic, insight] = memoryMatch;
        useMemoryStore.getState().addInsight(topic, insight);
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
