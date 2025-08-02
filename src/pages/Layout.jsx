

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Flashcard } from "@/api/entities";
import { LifeBuoy, GraduationCap, Home, Plus, BookOpen, BarChart3, Download, UserSquare, Calendar, Timer, Award, Settings, CreditCard, Crown, AlertCircle, RefreshCw } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Footer from '../components/medprime/Footer';
import UpdateChecker from '../components/medprime/UpdateChecker';
import { NetworkProvider, useNetwork } from '../components/network/NetworkErrorHandler.js';
import { NetworkInterceptor } from '../components/network/NetworkInterceptor.js';
import { getLevelForXp, getXpForLevel } from '@/components/gamification/utils';

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Estudar", url: createPageUrl("Study"), icon: BookOpen },
  { title: "Desafio", url: createPageUrl("TimedChallenge"), icon: Timer },
  { title: "Criar Flashcards", url: createPageUrl("Create"), icon: Plus },
  { title: "Meus Flashcards", url: createPageUrl("MyFlashcards"), icon: UserSquare },
  { title: "Estatísticas", url: createPageUrl("Stats"), icon: BarChart3 },
  { title: "Conquistas", url: createPageUrl("Achievements"), icon: Award },
  { title: "Suporte", url: createPageUrl("Support"), icon: LifeBuoy },
  { title: "Configurações", url: createPageUrl("Settings"), icon: Settings },
  { title: "Minha Conta", url: createPageUrl("Account"), icon: CreditCard }
];

const defaultTheme = {
  primary: '#0a223b',
  accent: '#10b981'
};

// Função melhorada de retry com exponential backoff
const retryRequest = async (requestFn, retries = 3, baseDelay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.error(`Tentativa ${i + 1}/${retries + 1} falhou:`, error);
      
      if (i === retries) {
        console.error(`Todas as ${retries + 1} tentativas falharam`);
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Tentando novamente em ${delay}ms...`);
      
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

const LayoutContent = ({ children, currentPageName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const network = useNetwork();
  const [theme, setTheme] = useState(defaultTheme);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalFlashcards: 0,
    todayAccuracy: 0,
    dueToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [criticalError, setCriticalError] = useState(null);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '' ||
      !currentPageName || currentPageName === 'undefined') {
      navigate(createPageUrl("Dashboard"), { replace: true });
    }
  }, [location.pathname, currentPageName, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.key]);

  // Força limpeza de cache quando o layout é carregado
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('medprime') || cacheName.includes('workbox')) {
            console.log(`Limpando cache: ${cacheName}`);
            caches.delete(cacheName);
          }
        });
      });
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setCriticalError(null);
    
    try {
      console.log('Carregando dados do usuário...');
      const userData = await retryRequest(() => User.me());
      setUser(userData);

      if (userData?.theme_settings) {
        setTheme({
          primary: userData.theme_settings.primary || defaultTheme.primary,
          accent: userData.theme_settings.accent || defaultTheme.accent
        });
      }

      console.log('Carregando flashcards...');
      const allFlashcards = await retryRequest(() => 
        Flashcard.filter({ created_by: userData.email })
      );

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const dueTodayCount = allFlashcards.filter((card) => {
        if (!card.next_review) return true;
        try {
          const nextReviewDate = new Date(card.next_review);
          if (isNaN(nextReviewDate.getTime())) {
             console.warn(`Invalid next_review date for card ${card.id} resulted in NaN:`, card.next_review);
             return true; // Consider it due today if date is invalid
          }
          nextReviewDate.setHours(0, 0, 0, 0);
          return nextReviewDate <= now;
        } catch (e) {
          // If date parsing fails, consider it due today to avoid breaking the app
          console.warn(`Error parsing date for card ${card.id}: ${card.next_review}`, e);
          return true; 
        }
      }).length;

      const totalAnswers = allFlashcards.reduce((sum, f) => sum + (f.times_studied || 0), 0);
      const correctAnswers = allFlashcards.reduce((sum, f) => sum + (f.correct_answers || 0), 0);
      const accuracy = totalAnswers > 0 ? Math.round(correctAnswers / totalAnswers * 100) : 0;

      setStats({
        totalFlashcards: allFlashcards.length,
        todayAccuracy: accuracy,
        dueToday: dueTodayCount
      });

      console.log('Dados carregados com sucesso');
      
    } catch (err) {
      console.error("Erro crítico ao carregar dados essenciais:", err);
      
      let errorMessage = "Erro inesperado ao carregar a aplicação";
      
      if (!navigator.onLine) {
        errorMessage = "Sem conexão com a internet. Verifique sua rede.";
      } else if (err.message?.includes('ServerSelectionTimeoutError')) {
        errorMessage = "O sistema está temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (err.message === 'Network Error' || err.code === 'NETWORK_ERROR') {
        errorMessage = "Falha na comunicação com o servidor. Verifique sua conexão.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Erro interno do servidor. Nossa equipe foi notificada.";
      }
      
      setCriticalError(errorMessage);
      
      if (network?.handleNetworkError) {
        network.handleNetworkError(err, 'Layout.loadData');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location.key]); // Trigger data load when navigation changes

  const userXp = user?.xp || 0;
  const currentLevel = getLevelForXp(userXp);
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);

  const xpInCurrentLevel = userXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

  const levelProgress = xpNeededForNextLevel > 0 ? xpInCurrentLevel / xpNeededForNextLevel * 100 : 0;

  // Tela de loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg">Carregando MedPrime Cards...</p>
        </div>
      </div>
    );
  }

  // Tela de erro crítico
  if (criticalError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md text-white"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
          <p className="text-red-200 mb-6">{criticalError}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Recarregar Página
            </Button>
            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <NetworkInterceptor />
        <UpdateChecker />
        <style>
          {`
            :root {
              --medprime-primary: ${theme.primary};
              --medprime-primary-hover: ${theme.primary};
              --medprime-accent: ${theme.accent};
              --medprime-accent-hover: ${theme.accent};
              --medprime-light: #f8fafc;
              --medprime-card: #ffffff;
              --medprime-text: #1e293b;
              --medprime-text-light: #64748b;
              --medprime-text-white: #f1f5f9;
              --medprime-border: #e2e8f0;
              --medprime-success: #22c55e;
              --medprime-warning: #f59e0b;
              --medprime-error: #ef4444;
              
              --medprime-gradient-main: linear-gradient(135deg, ${theme.primary} 0%, #1e3a8a 100%);
              --medprime-gradient-card: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%);
              --medprime-shadow-main: 0 10px 25px -5px rgba(10, 34, 59, 0.1), 0 4px 6px -2px rgba(10, 34, 59, 0.05);
            }
            
            .medprime-card {
              background: var(--medprime-gradient-card);
              box-shadow: var(--medprime-shadow-main);
              border: 1px solid var(--medprime-border);
              backdrop-filter: blur(10px);
            }
            
            .medprime-primary-bg {
              background: var(--medprime-primary);
            }
            
            .medprime-gradient-bg {
              background: var(--medprime-gradient-main);
            }
            
            .medprime-text-primary {
              color: var(--medprime-primary);
            }
            
            .medprime-text-white {
              color: var(--medprime-text-white);
            }
            
            .medprime-button-primary {
              background: var(--medprime-gradient-main);
              color: var(--medprime-text-white);
              border: none;
              transition: all 0.3s ease;
            }
            
            .medprime-button-primary:hover {
              background: var(--medprime-primary-hover);
              transform: translateY(-1px);
              box-shadow: var(--medprime-shadow-main);
            }

            * {
              box-sizing: border-box;
            }
            
            html, body {
              overflow-x: hidden;
              width: 100%;
              max-width: 100vw;
            }
            
            .mobile-container {
              width: 100%;
              max-width: 100vw;
              overflow-x: hidden;
              padding: 0;
            }
            
            @media (max-width: 768px) {
              .sidebar-content {
                width: 100%;
              }
              
              .main-content {
                padding: 1rem;
                width: 100%;
                max-width: 100vw;
                overflow-x: hidden;
              }
              
              .dashboard-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
                width: 100%;
              }
              
              .challenge-config {
                grid-template-columns: 1fr;
              }
              
              .card-preview {
                min-height: 200px;
                width: 100%;
                max-width: 100%;
              }
              
              .button-group {
                flex-direction: column;
                gap: 0.5rem;
                width: 100%;
              }
              
              .stats-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
              }
              
              .responsive-container {
                width: 100%;
                max-width: 100vw;
                overflow-x: hidden;
                padding-left: 1rem;
                padding-right: 1rem;
              }
              
              .responsive-card {
                width: 100%;
                max-width: 100%;
                margin: 0;
                overflow: hidden;
              }
              
              .responsive-flex {
                flex-direction: column;
                gap: 0.75rem;
                width: 100%;
              }
              
              .responsive-text {
                font-size: 0.875rem;
                line-height: 1.4;
              }
              
              .responsive-title {
                font-size: 1.5rem;
                line-height: 1.3;
              }
              
              .responsive-button {
                width: 100%;
                padding: 0.75rem;
                font-size: 0.875rem;
              }
            }
            
            @media (max-width: 480px) {
              .stats-grid {
                grid-template-columns: 1fr;
                gap: 0.5rem;
              }
              
              .text-responsive {
                font-size: 0.75rem;
              }
              
              .title-responsive {
                font-size: 1.25rem;
              }
              
              .responsive-container {
                padding-left: 0.75rem;
                padding-right: 0.75rem;
              }
              
              .mobile-padding {
                padding: 0.75rem;
              }
              
              .mobile-text-sm {
                font-size: 0.8rem;
              }
              
              .mobile-gap-sm {
                gap: 0.375rem;
              }
            }
          `}
        </style>

        <Sidebar className="border-r border-slate-200 medprime-card">
          <SidebarHeader className="p-6" style={{ backgroundColor: '#1E40AF' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>

              <div className="mb-4">
                <div className="bg-white/90 p-3 rounded-2xl inline-block shadow-lg">
                  <BookOpen className="w-6 h-6 text-blue-800" />
                </div>
              </div>

              <div>
                <h1 className="text-white text-2xl font-bold" translate="no">
                  MedPrime Cards
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  Flashcards Inteligentes
                </p>
              </div>
            </motion.div>
          </SidebarHeader>

          <SidebarContent className="p-3 md:p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="medprime-text-primary px-2 py-3 text-xs font-semibold uppercase tracking-wider">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) =>
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl h-12 md:h-11 text-base md:text-sm ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 md:gap-3 px-3 md:px-3 py-2">
                          <item.icon className="w-5 h-5 md:w-5 md:h-5" />
                          <span className="font-medium text-base md:text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="medprime-text-primary px-2 py-3 text-xs font-semibold uppercase tracking-wider">
                Progresso
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 md:px-3 py-2 space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium medprime-text-primary text-xs md:text-sm">Flashcards</p>
                      <p className="text-xs text-slate-500">{stats.totalFlashcards} criados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium medprime-text-primary text-xs md:text-sm">Precisão Geral</p>
                      <p className="text-xs text-slate-500">{stats.todayAccuracy}% de acertos</p>
                    </div>
                  </div>
                  {stats.dueToday > 0 &&
                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium medprime-text-primary text-xs md:text-sm">Para Hoje</p>
                        <p className="text-xs text-slate-500">{stats.dueToday} cards</p>
                      </div>
                    </div>
                  }
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="medprime-gradient-bg w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0">
                <span className="medprime-text-white text-xs md:text-sm font-semibold">{user?.full_name?.substring(0, 2).toUpperCase() || 'MP'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold medprime-text-primary text-xs md:text-sm truncate">{user?.full_name || <span translate="no">MedPrime User</span>}</p>
                <p className="text-xs text-slate-500">Nível {currentLevel}</p>
              </div>
            </div>

            {user?.plan === 'pro_anual' &&
              <div className="mb-2 md:mb-3">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 text-[10px] md:text-xs font-bold shadow-md border-purple-300 w-full justify-center">
                  <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  PRO Anual
                </Badge>
              </div>
            }

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Nível {currentLevel}</span>
                <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
              </div>
              <Progress value={levelProgress} className="h-1 md:h-1.5" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="medprime-card border-b border-slate-200 px-4 py-3 md:hidden">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="hidden sm:block flex-grow flex justify-center">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10b52184c_MedPrime_Logo_Transparent.png"
                  alt="MedPrime Logo"
                  className="mx-auto max-w-[120px] h-8 object-contain" />
              </div>
              <div className="w-10"></div>
            </div>
          </header>

          <div className="flex-1 overflow-auto relative">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default function Layout({ children, currentPageName }) {
  return (
    <NetworkProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </NetworkProvider>
  );
}

