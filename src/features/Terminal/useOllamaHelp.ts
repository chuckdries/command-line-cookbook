import { useState } from "react";
import { useAppSelector } from "../../app/hooks";

interface OllamaHelpResult {
  suggestion: string;
  timestamp: Date;
  model: string;
  generationTime?: number; // milliseconds
}

interface UseOllamaHelpReturn {
  getSuggestion: (
    command: string,
    output: string,
    exitCode: number,
    cwd?: string
  ) => Promise<void>;
  suggestion: OllamaHelpResult | null;
  isLoading: boolean;
  error: string | null;
  clearSuggestion: () => void;
  lastPrompt: string | null;
}

export function useOllamaHelp(): UseOllamaHelpReturn {
  const [suggestion, setSuggestion] = useState<OllamaHelpResult | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useAppSelector((s) => s.settings.ollama);

  const getSuggestion = async (
    command: string,
    output: string,
    exitCode: number,
    cwd?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    // Start timing the generation
    const startTime = performance.now();

    const cwdSection = cwd
      ? `
User was in directory: \`${cwd}\``
      : "";

    const prompt = `
      You are a friendly CLI teaching assistant in an app designed to help beginners learn command line skills. Someone just ran a command that failed and needs your help understanding what went wrong.

Command the user ran:
\`\`\`
${command}
\`\`\`${cwdSection}
Exit Code: ${exitCode}
Error Output:
\`\`\`
${output}
\`\`\`

Please provide a concise but friendly explanation to help them learn. Focus on:
1. What went wrong
2. A brief explanation of why this happened (so they can learn from it)
3. How they might try to fix it

Use fewer than 200 words, and do not greet the user.`;

    try {
      setLastPrompt(prompt);
      const response = await fetch(`${config.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(config.timeout),
        body: JSON.stringify({
          model: config.defaultModel,
          prompt,
          stream: false,
          think: false,
          options: config.options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Calculate generation time
      const endTime = performance.now();
      const generationTime = Math.round(endTime - startTime);

      setSuggestion({
        suggestion: data.response,
        timestamp: new Date(),
        model: config.defaultModel,
        generationTime,
      });
    } catch (err) {
      console.error("Failed to get AI suggestion:", err);
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestion = () => {
    setSuggestion(null);
    setError(null);
  };

  return {
    getSuggestion,
    suggestion,
    isLoading,
    error,
    clearSuggestion,
    lastPrompt,
  };
}
