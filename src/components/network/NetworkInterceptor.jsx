import { useEffect } from 'react';
import { User } from '@/api/entities';
import { Flashcard } from '@/api/entities';
import { useNetwork } from './NetworkErrorHandler.js';

const createEntityInterceptor = (Entity, entityName, network) => {
  const originalMethods = {};
  const { handleNetworkError, retryWithBackoff } = network || {};

  if (Entity.__isIntercepted) {
    return Entity;
  }

  ['list', 'filter', 'create', 'update', 'delete', 'me', 'updateMyUserData'].forEach(method => {
    if (Entity[method]) {
      originalMethods[method] = Entity[method];
    }
  });

  Object.keys(originalMethods).forEach(method => {
    Entity[method] = async function(...args) {
      // 'this' aqui refere-se ao contexto da entidade (ex: Flashcard)
      try {
        if (retryWithBackoff) {
          // Cria uma função com 'this' e argumentos pré-vinculados.
          // Esta é a forma mais robusta de preservar o contexto.
          const functionToRetry = originalMethods[method].bind(this, ...args);
          return await retryWithBackoff(functionToRetry, 3, 1000);
        } else {
          // Fallback se o mecanismo de retry não estiver disponível
          return await originalMethods[method].apply(this, args);
        }
      } catch (error) {
        console.error(`[${entityName}.${method}] Error:`, error);
        
        if (handleNetworkError) {
          handleNetworkError(error, `${entityName}.${method}`);
        }
        
        throw error;
      }
    };
  });

  Entity.__isIntercepted = true;
  return Entity;
};

export const NetworkInterceptor = () => {
  const network = useNetwork();

  useEffect(() => {
    if (network) {
      // Corrigido erro de digitação aqui
      createEntityInterceptor(User, 'User', network);
      createEntityInterceptor(Flashcard, 'Flashcard', network);
    }
  }, [network]);

  return null;
};