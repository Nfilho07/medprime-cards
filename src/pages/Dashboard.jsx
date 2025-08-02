
import React, { useState, useEffect, useRef } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, BookOpen, Brain, Target, TrendingUp, Clock, Calendar, BarChart3, Timer, Sparkles, Zap, Star, Award, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Função utilitária para retry automático
const retryRequest = async (requestFn, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries) {
        console.error(`A requisição falhou após ${retries + 1} tentativas:`, error);
        throw error;
      }
      
      const nextAttemptIn = delay * (i + 1);
      console.warn(`Requisição falhou. Tentando novamente em ${nextAttemptIn}ms... (Tentativa ${i + 1}/${retries})`);
      
      await new Promise(res => setTimeout(res, nextAttemptIn));
    }
  }
};

export default function Dashboard() {
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    studied: 0,
    accuracy: 0,
    dueToday: 0,
    recentlyCreated: []
  });
  const location = useLocation();
  const navigate = useNavigate();
  const loadingRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [location.key]);

  const loadData = async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const user = await retryRequest(() => User.me());
      
      // 1. Fetch data without server-side sorting to prevent DB errors
      const unsortedData = await retryRequest(() => Flashcard.filter({ created_by: user.email }));

      // 2. Sort data safely on the client-side
      const data = unsortedData.sort((a, b) => {
        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        // Handle invalid dates gracefully, preventing crashes
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
      });

      setFlashcards(data);
      calculateStats(data);
    } catch (error) {
      console.error("Erro ao carregar flashcards:", error);
      
      let errorMessage = "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.";
      
      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        errorMessage = "Erro de conexão com a internet. Verifique sua rede e tente novamente.";
      } else if (error.message?.includes('ServerSelectionTimeoutError') ||
                 error.message?.includes('No replica set members')) {
        errorMessage = "O sistema está temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (error.response?.status === 429) {
        errorMessage = "Sistema temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erro interno do servidor. Nossa equipe foi notificada, tente novamente em alguns instantes.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const calculateStats = (data) => {
    const studied = data.filter((f) => (f.times_studied || 0) > 0);
    const totalAnswers = data.reduce((sum, f) => sum + (f.times_studied || 0), 0);
    const correctAnswers = data.reduce((sum, f) => sum + (f.correct_answers || 0), 0);

    // Calculate due cards more accurately
    const now = new Date();
    const dueToday = data.filter((card) => {
      if (!card.next_review) return true; // New cards are due immediately
      try {
        // Defensive date parsing
        const nextReviewDate = new Date(card.next_review);
        if (isNaN(nextReviewDate.getTime())) { // Check for invalid date
          console.warn(`Invalid next_review date found for card ${card.id}:`, card.next_review);
          return true; // Treat invalid date as due
        }
        return nextReviewDate <= now;
      } catch (e) {
        console.error(`Error parsing date for card ${card.id}:`, e);
        return true; // Treat parsing error as due
      }
    }).length;

    setStats({
      total: data.length,
      studied: studied.length,
      accuracy: totalAnswers > 0 ? Math.round(correctAnswers / totalAnswers * 100) : 0,
      dueToday: dueToday,
      recentlyCreated: data.slice(0, 5)
    });
  };

  const formatDifficulty = (difficulty) => {
    switch (difficulty) {
      case "facil": return "Fácil";
      case "medio": return "Médio";
      case "dificil": return "Difícil";
      default: return difficulty;
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", delay = 0, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-md hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/30" />
        <CardContent className="relative p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <motion.div
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br ${
                color === 'orange' ? 'from-orange-400 to-orange-600' :
                color === 'green' ? 'from-green-400 to-green-600' :
                color === 'purple' ? 'from-purple-400 to-purple-600' :
                'from-blue-400 to-blue-600'
              } shadow-lg group-hover:scale-110 transition-transform duration-300`}
              whileHover={{ rotate: 5 }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
            <Badge className="bg-[#0a223b] text-slate-50 px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-bold shadow-md text-right">
              {subtitle}
            </Badge>
          </div>
          <div className="space-y-1">
            <motion.p
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#0a223b] to-blue-600 bg-clip-text text-transparent"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              {value}
            </motion.p>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md text-white"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("Create"))}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Criar Flashcards
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <motion.h1
              className="text-white text-3xl md:text-4xl font-bold"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Bem-vindo Aluno <span translate="no">MedPrime</span>
            </motion.h1>
            <motion.p
              className="text-blue-100 text-base mt-2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Transforme seus estudos com flashcards inteligentes
            </motion.p>
            <motion.div
              className="mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link to={createPageUrl("Create")}>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 text-base font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
                  <Plus className="mr-2 w-5 h-5" />
                  Criar Flashcards
                  <Zap className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Cards de estatísticas com navegação */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.dueToday === 0 ? (
              <StatCard
                title="Revisão Concluída!"
                value={"✔"}
                subtitle="Nenhum Card Pendente"
                icon={CheckCircle}
                color="green"
                delay={0.1}
                onClick={() => navigate(createPageUrl("Study"))}
              />
            ) : (
              <StatCard
                title="Para Revisar Hoje"
                value={stats.dueToday}
                subtitle="Cards Pendentes"
                icon={Calendar}
                color="orange"
                delay={0.1}
                onClick={() => navigate(createPageUrl("Study"))}
              />
            )}
            <StatCard
              title="Total de Flashcards"
              value={stats.total}
              subtitle="Criados"
              icon={BookOpen}
              color="blue"
              delay={0.2}
              onClick={() => navigate(createPageUrl("MyFlashcards"))}
            />
            <StatCard
              title="Estudados"
              value={stats.studied}
              subtitle="Revisados"
              icon={Brain}
              color="green"
              delay={0.3}
              onClick={() => navigate(createPageUrl("Study"))}
            />
            <StatCard
              title="Taxa de Acerto"
              value={`${stats.accuracy}%`}
              subtitle="Precisão"
              icon={Target}
              color="purple"
              delay={0.4}
              onClick={() => navigate(createPageUrl("Stats"))}
            />
          </div>

          {/* Rest of the dashboard content */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#0a223b]">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Flashcards Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="animate-pulse"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/2"></div>
                        </motion.div>
                      ))}
                    </div>
                  ) : stats.recentlyCreated.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentlyCreated.map((flashcard, index) => (
                        <motion.div
                          key={flashcard.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 rounded-xl border border-transparent hover:border-blue-200 group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-[#0a223b] mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors text-sm">
                                {flashcard.question}
                              </p>
                              <p className="text-slate-600 line-clamp-1 text-xs">
                                {flashcard.answer}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-2">
                              {flashcard.category && (
                                <Badge className="bg-gradient-to-r from-[#0a223b] to-blue-700 text-white shadow-md text-xs">
                                  {flashcard.category}
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-xs shadow-sm ${
                                  flashcard.difficulty === 'facil' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                                  flashcard.difficulty === 'dificil' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                                  'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                                }`}
                              >
                                {formatDifficulty(flashcard.difficulty)}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-slate-500 mb-4 text-base">Nenhum flashcard encontrado</p>
                      <Link to={createPageUrl("Create")}>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar seu primeiro
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0a223b] text-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                    Visão Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Calendar, label: "Para Hoje", value: `${stats.dueToday || 0} cards`, color: "orange" },
                    { icon: BookOpen, label: "Flashcards", value: `${stats.total} criados`, color: "blue" },
                    { icon: BarChart3, label: "Acertos", value: `${stats.accuracy}% precisão`, color: "green" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.color === 'orange' ? 'bg-gradient-to-br from-orange-100 to-orange-200' :
                        item.color === 'green' ? 'bg-gradient-to-br from-green-100 to-green-200' :
                        'bg-gradient-to-br from-blue-100 to-blue-200'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`w-4 h-4 ${
                          item.color === 'orange' ? 'text-orange-600' :
                          item.color === 'green' ? 'text-green-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-[#0a223b] text-base font-bold">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0a223b] text-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { to: "ReviewToday", icon: Calendar, label: `Revisar Hoje (${stats.dueToday || 0})`, disabled: !stats.dueToday, color: "from-orange-500 to-red-500" },
                    { to: "Study", icon: Brain, label: "Estudar por Pasta", disabled: stats.total === 0, color: "from-purple-500 to-pink-500" },
                    { to: "TimedChallenge", icon: Timer, label: "Iniciar Desafio", disabled: false, color: "from-purple-500 to-pink-500" },
                    { to: "MyFlashcards", icon: Brain, label: "Gerenciar Flashcards", disabled: stats.total === 0, color: "from-blue-500 to-indigo-500" },
                    { to: "Create", icon: Plus, label: "Criar Flashcards", disabled: false, color: "from-green-500 to-emerald-500" },
                  ].map((action, index) => (
                    <motion.div
                      key={action.to}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <Link to={createPageUrl(action.to)} className="block">
                        <Button
                          className={`w-full justify-start h-11 shadow-lg transition-all duration-300 transform hover:scale-105 ${
                            action.disabled
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:scale-100'
                              : `bg-gradient-to-r ${action.color} hover:shadow-xl text-white`
                          }`}
                          disabled={action.disabled}
                        >
                          <action.icon className="w-4 h-4 mr-3" />
                          <span className="text-sm">{action.label}</span>
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {stats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#0a223b] text-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Progresso de Estudos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#0a223b] font-medium">Flashcards Estudados</span>
                          <span className="font-bold text-[#0a223b]">{stats.studied}/{stats.total}</span>
                        </div>
                        <Progress
                          value={stats.total > 0 ? (stats.studied / stats.total) * 100 : 0}
                          className="h-2 bg-slate-200"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#0a223b] font-medium">Taxa de Acerto</span>
                          <span className="font-bold text-[#0a223b]">{stats.accuracy}%</span>
                        </div>
                        <Progress
                          value={stats.accuracy}
                          className="h-2 bg-slate-200"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="w-full text-center py-6 px-4 mt-8 bg-gradient-to-t from-gray-950/80 to-transparent text-gray-400 text-sm relative z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-400" translate="no">© {new Date().getFullYear()} MedPrime. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            Desenvolvido por
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10b52184c_MedPrime_Logo_Transparent.png"
              alt="MedPrime Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="font-semibold text-white" translate="no">Grupo MedPrime</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
