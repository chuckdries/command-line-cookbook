
/**
 * Normalize quotes to prevent issues with smart quotes from markdown
 */
export const normalizeQuotes = (str: string): string => {
  return str
    .replace(/[""]/g, '"') // Convert smart quotes to regular quotes
    .replace(/['']/g, "'"); // Convert smart single quotes to regular quotes
};

/**
 * Copy text to clipboard and return success state
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text:", error);
    return false;
  }
};

/**
 * Format duration in milliseconds for display
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Calculate duration in milliseconds from ISO8601 timestamps
 */
export const calculateDuration = (startedAt: string, finishedAt: string): number => {
  const start = new Date(startedAt).getTime();
  const finish = new Date(finishedAt).getTime();
  return finish - start;
};

/**
 * Common interface for execution results
 */
export interface ExecutionResult {
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
}
