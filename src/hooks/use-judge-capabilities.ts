import { useState, useEffect, useCallback } from 'react';

interface JudgeStatus {
  connected: boolean;
  judgeCount: number;
}

interface JudgeCapabilities {
  status: JudgeStatus;
  executors: string[];
}

export const useJudgeCapabilities = () => {
  const [capabilities, setCapabilities] = useState<JudgeCapabilities>({
    status: { connected: false, judgeCount: 0 },
    executors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch status and executors only (problems removed for privacy)
      const [statusRes, executorsRes] = await Promise.all([
        fetch('/api/judge/status'),
        fetch('/api/judge/executors')
      ]);

      const [status, executors] = await Promise.all([
        statusRes.ok ? statusRes.json() : { connected: false, judgeCount: 0 },
        executorsRes.ok ? executorsRes.json() : []
      ]);

      setCapabilities({
        status,
        executors
      });
    } catch (err) {
      console.error('Error fetching judge capabilities:', err);
      setError('Failed to fetch judge capabilities');
      setCapabilities({
        status: { connected: false, judgeCount: 0 },
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
    availableExecutors: capabilities.executors,
    loading,
    error,
    isExecutorAvailable,
    refreshCapabilities,
  };
};
