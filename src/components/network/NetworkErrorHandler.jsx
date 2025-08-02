import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
      setRetryAttempts(0);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('Sem conexão com a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkError = (error, context = '') => {
    console.error(`[NetworkError] ${context}:`, error);
    
    let errorMessage = 'Erro de conexão';
    
    if (!navigator.onLine) {
      errorMessage = 'Sem conexão com a internet';
    } else if (error.message?.includes('ServerSelectionTimeoutError') || 
               error.message?.includes('No replica set members')) {
      errorMessage = 'Sistema temporariamente indisponível';
    } else if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
      errorMessage = 'Falha na comunicação com o servidor';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Erro interno do servidor';
    } else if (error.response?.status === 429) {
      errorMessage = 'Muitas requisições, aguarde um momento';
    }

    setNetworkError(errorMessage);
    return errorMessage;
  };

  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    setIsRetrying(true);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        setNetworkError(null);
        setRetryAttempts(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        setRetryAttempts(attempt + 1);
        
        if (attempt === maxRetries) {
          handleNetworkError(error, 'Final retry attempt failed');
          setIsRetrying(false);
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const clearError = () => {
    setNetworkError(null);
    setRetryAttempts(0);
  };

  return (
    <NetworkContext.Provider value={{
      isOnline,
      networkError,
      retryAttempts,
      isRetrying,
      handleNetworkError,
      retryWithBackoff,
      clearError
    }}>
      {children}
      <NetworkErrorDisplay />
    </NetworkContext.Provider>
  );
};

const NetworkErrorDisplay = () => {
  const { networkError, clearError, isRetrying, retryAttempts } = useNetwork();

  if (!networkError && navigator.onLine) return null;

  return (
    <AnimatePresence>
      {(networkError || !navigator.onLine) && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <Alert className="bg-red-50 border-red-200 shadow-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>
                  {!navigator.onLine ? 'Sem internet' : networkError}
                  {isRetrying && ` (Tentativa ${retryAttempts + 1}/3)`}
                </span>
                {isRetrying && <RefreshCw className="w-4 h-4 animate-spin" />}
              </div>
              {!isRetrying && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="ml-2 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Recarregar
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkProvider;