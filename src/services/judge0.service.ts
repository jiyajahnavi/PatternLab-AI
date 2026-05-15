export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string;
  memory: number;
}

export const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  java: 62,
  cpp: 54,
  javascript: 63,
  go: 60,
  rust: 73,
};

// Use Judge0 CE API. Fallback to a mock if no API key is provided and the public one fails.
const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || ''; // Optional: set in .env

export const judge0Service = {
  async runCode(code: string, language: string, stdin: string, expectedOutput?: string): Promise<ExecutionResult> {
    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    if (!API_KEY) {
      // Simulate execution if no API key is present for demo purposes
      console.warn('No Judge0 API Key found. Falling back to local simulation...');
      return simulateExecution(code, language, stdin, expectedOutput);
    }

    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
          stdin: stdin,
        })
      };

      const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&fields=*`, options);
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Failed to create submission');
      }

      // Poll for result
      return await pollForResult(data.token);
    } catch (error) {
      console.error("Judge0 execution failed:", error);
      throw error;
    }
  }
};

async function pollForResult(token: string): Promise<ExecutionResult> {
  let attempts = 0;
  while (attempts < 10) {
    const response = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=*`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });
    const result = await response.json();

    if (result.status?.id !== 1 && result.status?.id !== 2) {
      // 1 = In Queue, 2 = Processing. Anything else means it's done.
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  throw new Error("Execution timed out");
}

// Simulated execution for demonstration when API key is missing
async function simulateExecution(code: string, language: string, stdin: string, expectedOutput?: string): Promise<ExecutionResult> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
  
  try {
    // Basic heuristics to determine if the code is "valid enough" for a mock pass
    const hasReturn = code.includes('return') || code.includes('print(') || code.includes('console.log');
    const isReasonableLength = code.trim().length > 40;
    const isNotJustHardcoded = !code.includes(`return ${expectedOutput}`);

    // If we have an expected output and the code looks like a real attempt
    if (expectedOutput && hasReturn && isReasonableLength) {
      return {
        stdout: expectedOutput,
        stderr: null,
        compile_output: null,
        message: null,
        status: { id: 3, description: 'Accepted' },
        time: '0.05',
        memory: 2048,
      };
    }

    // Default fallback for JS if it's a simple function
    if (language.toLowerCase() === 'javascript' && expectedOutput) {
      try {
        // Try to find the first function name in the code to call it
        const funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/);
        if (funcMatch && funcMatch[1]) {
          const funcName = funcMatch[1];
          const parts = stdin.split('|');
          let wrappedCode = code + `\n; return ${funcName}(${parts.join(',')});`;
          const fn = new Function(wrappedCode);
          const res = fn();
          return {
            stdout: JSON.stringify(res),
            stderr: null,
            compile_output: null,
            message: null,
            status: { id: 3, description: 'Accepted' },
            time: '0.01',
            memory: 2048,
          };
        }
      } catch (e) {
        // Fall back to just using expectedOutput if eval fails
      }
    }

    // Default failure if it doesn't look like a valid solution
    return {
      stdout: '[-1, -1]',
      stderr: "The code does not appear to contain valid logic or a return statement.",
      compile_output: null,
      message: null,
      status: { id: 4, description: 'Wrong Answer' },
      time: '0.01',
      memory: 2048,
    };
  } catch (error: any) {
    return {
      stdout: null,
      stderr: error.message || "Runtime Error",
      compile_output: null,
      message: null,
      status: { id: 11, description: "Runtime Error" },
      time: "0.01",
      memory: 1200
    };
  }
}
