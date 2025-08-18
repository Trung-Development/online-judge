import { useState, useEffect, useCallback } from 'react';

interface JudgeStatus {
  connected: boolean;
  judgeCount: number;
}

interface JudgeCapabilities {
  status: JudgeStatus;
  problems: string[];
  executors: string[];
}

export const useJudgeCapabilities = () => {
  const [capabilities, setCapabilities] = useState<JudgeCapabilities>({
    status: { connected: false, judgeCount: 0 },
    problems: [],
    executors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch all endpoints in parallel using Next.js API routes
      const [statusRes, problemsRes, executorsRes] = await Promise.all([
        fetch('/api/judge/status'),
        fetch('/api/judge/problems'),
        fetch('/api/judge/executors')
      ]);

      const [status, problems, executors] = await Promise.all([
        statusRes.ok ? statusRes.json() : { connected: false, judgeCount: 0 },
        problemsRes.ok ? problemsRes.json() : [],
        executorsRes.ok ? executorsRes.json() : []
      ]);

      setCapabilities({
        status,
        problems,
        executors
      });
    } catch (err) {
      console.error('Error fetching judge capabilities:', err);
      setError('Failed to fetch judge capabilities');
      setCapabilities({
        status: { connected: false, judgeCount: 0 },
        problems: [],
        executors: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCapabilities();
    
    // Refresh capabilities every 30 seconds
    const interval = setInterval(fetchCapabilities, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCapabilities]);

  const isProblemAvailable = useCallback((problemCode: string): boolean => {
    return capabilities.problems.includes(problemCode);
  }, [capabilities.problems]);

  const isExecutorAvailable = useCallback((executor: string): boolean => {
    return capabilities.executors.includes(executor);
  }, [capabilities.executors]);

  const refreshCapabilities = useCallback(() => {
    setLoading(true);
    fetchCapabilities();
  }, [fetchCapabilities]);

  return {
    capabilities,
    status: capabilities.status,
    availableProblems: capabilities.problems,
    availableExecutors: capabilities.executors,
    loading,
    error,
    isProblemAvailable,
    isExecutorAvailable,
    refreshCapabilities,
  };
};
