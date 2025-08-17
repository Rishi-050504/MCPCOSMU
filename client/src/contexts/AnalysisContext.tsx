import { createContext, useState, useContext, type ReactNode } from 'react';
import type { AnalysisResult } from '../types';

interface AnalysisContextType {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  updateFileContent: (filePath: string, newContent: string) => void;
  // --- ADD THESE LINES ---
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // --- ADD THIS LINE ---
  const [sessionId, setSessionId] = useState<string | null>(null);

  const updateFileContent = (filePath: string, newContent: string) => {
    setResult(prevResult => {
      if (!prevResult) return null;

      const updatedFileContents = {
        ...prevResult.fileContents,
        [filePath]: newContent,
      };

      const updatedFileIssues = { ...prevResult.fileIssues };
      delete updatedFileIssues[filePath];
      
      return {
        ...prevResult,
        fileContents: updatedFileContents,
        fileIssues: updatedFileIssues,
      };
    });
  };

  return (
    <AnalysisContext.Provider value={{ 
      result, setResult, 
      error, setError, 
      isLoading, setIsLoading, 
      updateFileContent,
      // --- ADD THESE LINES ---
      sessionId, setSessionId 
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};