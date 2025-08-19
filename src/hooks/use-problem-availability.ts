import { useState, useCallback } from 'react';

interface ProblemAvailabilityHook {
  checkProblemAvailability: (problemCode: string) => Promise<boolean>;
  isChecking: boolean;
}

export function useProblemAvailability(): ProblemAvailabilityHook {
  const [isChecking, setIsChecking] = useState(false);

  const checkProblemAvailability = useCallback(async (problemCode: string): Promise<boolean> => {
    setIsChecking(true);
    try {
      const response = await fetch(`/api/judge/problems/${problemCode}/available`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.available || false;
    } catch (error) {
      console.error('Error checking problem availability:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkProblemAvailability,
    isChecking,
  };
}
