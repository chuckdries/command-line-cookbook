// Static defaults for Ollama integration (kept for fallback/reference)
export const OLLAMA_DEFAULTS = {
  baseUrl: 'http://localhost:11434',
  defaultModel: 'qwen3:8b',
  timeout: 30000, // 30 seconds
  options: {
    temperature: 0.3,
    num_predict: 300,
  },
};

// Check if Ollama is available
export async function checkOllamaAvailability(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout for availability check
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Get available models
export async function getAvailableModels(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch {
    return [];
  }
}
