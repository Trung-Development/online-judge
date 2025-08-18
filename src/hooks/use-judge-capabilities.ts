import { useState, useEffect } from 'react';

interface JudgeCapabilities {
  judges: { [key: string]: { problems: string[]; executors: { [key: string]: unknown } } };
  summary: {
    connectedJudges: number;
    totalProblems: number;
    totalExecutors: number;
  };
}

interface JudgeStatus {
  connected: number;
  judges: string[];
}

export function useJudgeCapabilities() {
  const [capabilities, setCapabilities] = useState<JudgeCapabilities | null>(null);
  const [status, setStatus] = useState<JudgeStatus | null>(null);
  const [availableProblems, setAvailableProblems] = useState<string[]>([]);
  const [availableExecutors, setAvailableExecutors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3001";
      
      // Fetch all data in parallel
      const [capRes, statusRes, problemsRes, executorsRes] = await Promise.all([
        fetch(`${apiBase}/client/judge/capabilities`),
        fetch(`${apiBase}/client/judge/status`),
        fetch(`${apiBase}/client/judge/problems`),
        fetch(`${apiBase}/client/judge/executors`),
      ]);

      if (!capRes.ok || !statusRes.ok || !problemsRes.ok || !executorsRes.ok) {
        throw new Error('Failed to fetch judge data');
      }

      const [capData, statusData, problemsData, executorsData] = await Promise.all([
        capRes.json(),
        statusRes.json(),
        problemsRes.json(),
        executorsRes.json(),
      ]);

      setCapabilities(capData);
      setStatus(statusData);
      setAvailableProblems(problemsData.problems || []);
      setAvailableExecutors(executorsData.executors || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching judge capabilities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
    
    // Refresh capabilities every 30 seconds
    const interval = setInterval(fetchCapabilities, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const isProblemAvailable = (problemCode: string): boolean => {
    return availableProblems.includes(problemCode);
  };

  const isExecutorAvailable = (executor: string): boolean => {
    return availableExecutors.includes(executor);
  };

  const refreshCapabilities = () => {
    setLoading(true);
    fetchCapabilities();
  };

  return {
    capabilities,
    status,
    availableProblems,
    availableExecutors,
    loading,
    error,
    isProblemAvailable,
    isExecutorAvailable,
    refreshCapabilities,
  };
}
