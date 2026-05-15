# Goal Description
Build PatternLab, a full-stack AI-powered DSA learning web application. The application will be a dark-themed, dense, professional tool for learning algorithms. It functions like a combination of LeetCode, an AI Mentor, and a Visual Learning Platform, focused heavily on teaching problem-solving intuition and explaining why approaches work.

## User Review Required
> [!IMPORTANT]
> - We are transitioning the architecture from Firebase to Supabase for Auth, Database, and Realtime features.
> - The project scope has expanded significantly to include an Interactive Visualization System, an AI-powered Solution Review System, and multiple Learning Modes.

## Open Questions
> [!WARNING]
> - **Supabase**: Supabase requires a project URL and anon key. Shall I assume a local Supabase setup (e.g., using `npx supabase start`) for development, or will you provide a remote Supabase project configuration later?
> - **Judge0**: For code execution, I will use a mock execution service to simulate Judge0 by default unless a real API URL/key is provided. Is this acceptable?

## Proposed Changes

### Phase 1: Setup and Foundation (Supabase)
- Initialize a React 18 + Vite + TypeScript project.
- Install dependencies: `react-router-dom`, `tailwindcss`, `zustand`, `@supabase/supabase-js`, `@google/generative-ai`, `@monaco-editor/react`, `recharts`, `framer-motion`, `date-fns`, `lucide-react`, `react-resizable-panels`.
- Configure Tailwind CSS with the specified dark theme palette (`#0D0D0F` background, `#141416` surface, `#7C6FF7` accent).
- Create `supabaseClient.ts`, `auth.service.ts`, and `progress.service.ts`.
- Set up Zustand stores (`useUserStore.ts`, `useChatStore.ts`, `useSettingsStore.ts`, `useProgressStore.ts`).

### Phase 2: App Shell, UI/UX & Routing
- Build `Topbar.tsx` and `Sidebar.tsx`.
- Implement Resizable IDE panels, Keyboard shortcuts, and a Command palette for the terminal-like aesthetic.
- Configure React Router to wrap the app shell and handle navigation.
- Implement Supabase Auth flow (Google OAuth and Email/Password).

### Phase 3: AI Chat, Learning Modes & Smart Hints
- Build the `ChatPage`.
- Implement **Learning Modes**: 
  - Learn Mode (heavy hints, visualization)
  - Practice Mode (limited hints)
  - Contest Mode
  - Interview Mode (no hints, AI behaves like interviewer).
- Implement the **Smart Hint System** (Hint 1: Pattern, Hint 2: Data Structure, Hint 3: Complexity, Hint 4: Partial Logic).
- Integrate `ai.service.ts` with streaming support.

### Phase 4: Problem IDE & AI Solution Review
- Implement the `ProblemPage` split layout.
- Integrate `@monaco-editor/react`.
- Complete `judge0.service.ts` for code execution.
- Build the **AI-Powered Solution Review System** (`solutionReview.service.ts`, `complexityAnalyzer.ts`) to analyze submitted code and provide mistake pointers, optimization suggestions, and complexity reviews without revealing full solutions.
- Add an inline review panel beside the editor.

### Phase 5: Visualization-Based Learning System
- Build interactive algorithm visualizers (`VisualizerPage.tsx`, `AlgorithmCanvas.tsx`, `StepController.tsx`, `ExplanationPanel.tsx`).
- Implement visualizers for Stack, Queue, Linked List, Sliding Window, Binary Search, Trees, Graphs, etc., using Framer Motion.
- Add support for step-by-step animations, dry runs, and variable state tracking.

### Phase 6: Tracking, Recommendations & Profile
- Implement the **Pattern Tracking & Recommendations System** to track weak topics and suggest targeted lessons.
- Build the `ProgressPage` with XP, levels, difficulty progression tracking, and topic mastery charts.
- Build the `ProfilePage` with the Activity Heatmap and streak system.
- Build the `SettingsPage` (handling API keys stored locally).

### Phase 7: Future Architecture Readiness
- Ensure the codebase is structured to easily support multi-model AI, voice explanations, collaborative rooms, live contests, and custom problem uploads.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify the build process.

### Manual Verification
- **Visualization rendering**: Ensure animations run correctly, state doesn't desync, and mobile interaction works.
- **AI feedback accuracy**: Verify the AI correctly identifies complexity and inefficiencies without giving away the full optimal solution.
- **Hint progression**: Ensure the Smart Hint system follows the required logic (pattern -> structure -> complexity -> partial logic).
- **IDE interactions**: Verify Monaco editor responsiveness, code execution, and the AI review panel.
- **UI/UX**: Test resizable panels, keyboard shortcuts, and command palette.
- **Performance**: Ensure AI streaming remains smooth during long explanations and submission review latency remains low.
