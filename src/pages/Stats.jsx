
import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Target, BookOpen, Brain, Calendar, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Stats() {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    studied: 0,
    accuracy: 0,
    byCategory: {},
    byDifficulty: {},
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await Flashcard.list("-last_studied");
      setFlashcards(data);
      calculateStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
    setIsLoading(false);
  };

  const calculateStats = (data) => {
    const studied = data.filter((f) => (f.times_studied || 0) > 0);
    const totalAnswers = data.reduce((sum, f) => sum + (f.times_studied || 0), 0);
    const correctAnswers = data.reduce((sum, f) => sum + (f.correct_answers || 0), 0);

    // Agrupa categorias por caixa baixa para evitar duplicatas (ex: "Cardiologia" e "cardiologia")
    const byCategory = {};
    data.forEach((f) => {
      if (f.category && f.category.trim() !== "") {
        const categoryKey = f.category.trim().toLowerCase();
        byCategory[categoryKey] = (byCategory[categoryKey] || 0) + 1;
      }
    });

    // Estatísticas por dificuldade
    const byDifficulty = {};
    data.forEach((f) => {
      const diff = f.difficulty || 'medio';
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    });

    setStats({
      total: data.length,
      studied: studied.length,
      accuracy: totalAnswers > 0 ? Math.round(correctAnswers / totalAnswers * 100) : 0,
      byCategory,
      byDifficulty,
      recentActivity: []
    });
  };

  const formatDifficulty = (difficulty) => {
    switch (difficulty) {
      case "facil":return "Fácil";
      case "medio":return "Médio";
      case "dificil":return "Difícil";
      default:return difficulty;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "facil":return "bg-green-100 text-green-700 border-green-200";
      case "dificil":return "bg-red-100 text-red-700 border-red-200";
      default:return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="group cursor-pointer">

      <Card className="border-0 shadow-xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <motion.div
            className={`p-2 md:p-3 rounded-xl bg-gradient-to-br ${
            color === 'orange' ? 'from-orange-400 to-orange-600' :
            color === 'green' ? 'from-green-400 to-green-600' :
            color === 'purple' ? 'from-purple-400 to-purple-600' :
            'from-blue-400 to-blue-600'} shadow-lg group-hover:scale-110 transition-transform duration-300`
            }
            whileHover={{ rotate: 5 }}>

              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <Badge className="bg-[#0a223b] text-slate-50 px-2 md:px-3 py-1 text-xs font-bold shadow-md">
              {subtitle}
            </Badge>
          </div>
          <div className="space-y-1 md:space-y-2">
            <motion.p
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0a223b] to-blue-600 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}>

              {value}
            </motion.p>
            <p className="text-xs md:text-sm text-slate-600 font-medium">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-100">Carregando estatísticas...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 md:mb-8">

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700 hover:border-slate-500">


            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              Estatísticas de Estudo
            </h1>
            <p className="text-blue-100 text-base md:text-lg">
              Acompanhe seu progresso e desempenho
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            title="Total de Flashcards"
            value={stats.total}
            subtitle="Criados"
            icon={BookOpen}
            color="blue" />

          <StatCard
            title="Flashcards Rev." /* Adjusted for uniform size */
            value={stats.studied}
            subtitle="Revisados"
            icon={Brain}
            color="green" />

          <StatCard
            title="Taxa de Acerto"
            value={`${stats.accuracy}%`}
            subtitle="Precisão"
            icon={Target}
            color="purple" />

          <StatCard
            title="Progresso Geral"
            value={`${stats.total > 0 ? Math.round(stats.studied / stats.total * 100) : 0}%`}
            subtitle="Concluídos"
            icon={TrendingUp}
            color="orange" />

        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Flashcards por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {Object.entries(stats.byCategory).length > 0 ?
                Object.entries(stats.byCategory).map(([category, count]) =>
                <div key={category} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900 capitalize text-sm md:text-base truncate">
                          {category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 ml-2">
                        <div className="w-16 md:w-24">
                          <Progress
                        value={stats.total > 0 ? count / stats.total * 100 : 0}
                        className="h-2" />

                        </div>
                        <span className="text-xs md:text-sm font-medium text-slate-600 w-6 md:w-8 text-right shrink-0">
                          {count}
                        </span>
                      </div>
                    </div>
                ) :

                <div className="text-center py-8 md:py-12">
                    <Activity className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm md:text-base">Nenhuma categoria encontrada</p>
                  </div>
                }
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Distribuição por Dificuldade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {Object.entries(stats.byDifficulty).length > 0 ?
                Object.entries(stats.byDifficulty).map(([difficulty, count]) =>
                <div key={difficulty} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Badge
                      variant="outline"
                      className={`${getDifficultyColor(difficulty)} text-xs md:text-sm shrink-0`}>

                          {formatDifficulty(difficulty)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 ml-2">
                        <div className="w-16 md:w-24">
                          <Progress
                        value={stats.total > 0 ? count / stats.total * 100 : 0}
                        className="h-2" />

                        </div>
                        <span className="text-xs md:text-sm font-medium text-slate-600 w-6 md:w-8 text-right shrink-0">
                          {count}
                        </span>
                      </div>
                    </div>
                ) :

                <div className="text-center py-8 md:py-12">
                    <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm md:text-base">Nenhum dado de dificuldade encontrado</p>
                  </div>
                }
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>);

}