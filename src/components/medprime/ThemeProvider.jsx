import React, { createContext, useContext, useState } from 'react';

const MedPrimeTheme = {
  // Cores principais
  colors: {
    primary: '#0a223b',
    primaryHover: '#083048',
    accent: '#10b981',
    accentHover: '#059669',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    light: '#f8fafc',
    white: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textWhite: '#f1f5f9',
    border: '#e2e8f0'
  },
  
  // Textos personalizáveis
  texts: {
    appName: 'MedPrime Cards',
    appSubtitle: 'Flashcards Inteligentes',
    dashboard: 'Dashboard',
    createFlashcards: 'Criar Flashcards',
    myFlashcards: 'Meus Flashcards',
    reviewToday: 'Revisar Hoje',
    suggested: 'Sugeridos',
    statistics: 'Estatísticas',
    settings: 'Configurações',
    account: 'Minha Conta',
    
    // Botões de resposta
    responseWrong: 'ERREI',
    responseDifficult: 'DIFÍCIL', 
    responseGood: 'BOM',
    responseEasy: 'FÁCIL',
    
    // Mensagens
    welcomeMessage: 'Bem-vindo ao MedPrime Cards',
    welcomeSubtext: 'Transforme seus estudos com flashcards inteligentes',
    noFlashcards: 'Nenhum flashcard encontrado',
    createFirst: 'Comece criando seu primeiro flashcard para estudar.'
  },
  
  // Gradientes
  gradients: {
    main: 'linear-gradient(135deg, #0a223b 0%, #1e3a8a 100%)',
    card: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
    accent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  
  // Sombras
  shadows: {
    main: '0 10px 25px -5px rgba(10, 34, 59, 0.1), 0 4px 6px -2px rgba(10, 34, 59, 0.05)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }
};

const ThemeContext = createContext(MedPrimeTheme);

export const useMedPrimeTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useMedPrimeTheme must be used within a MedPrimeThemeProvider');
  }
  return context;
};

export const MedPrimeThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(MedPrimeTheme);
  
  const updateTheme = (updates) => {
    setTheme(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  return (
    <ThemeContext.Provider value={{ ...theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default MedPrimeTheme;