import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Eye, CheckCircle, XCircle, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomStudySession({
  folderName,
  studyType,
  flashcards,
  onComplete,
  onBack
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    reviewed: 0
  });

  const studyTypeLabels = {
    review_all: "🔁 Revisando Todos os Cards",
    new_cards: "⏩ Estudando Cards Novos",
    difficult_cards: "⚠️ Reforçando Cards Difíceis",
    recent_mistakes: "🧹 Revisando Erros Recentes"
  };

  const handleAnswer = (isCorrect) => {
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      reviewed: prev.reviewed + 1
    }));

    // Não atualizar o algoritmo de repetição espaçada - apenas estatísticas básicas
    // Esta é uma sessão de estudo personalizado que não afeta o cronograma

    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // Sessão concluída
        onComplete({
          ...sessionStats,
          correct: sessionStats.correct + (isCorrect ? 1 : 0),
          incorrect: sessionStats.incorrect + (isCorrect ? 0 : 1),
          reviewed: sessionStats.reviewed + 1
        });
      }
    }, 1000);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "facil": return "bg-green-100 text-green-700 border-green-200";
      case "dificil": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const formatDifficulty = (difficulty) => {
    switch (difficulty) {
      case "facil": return "Fácil";
      case "medio": return "Médio";
      case "dificil": return "Difícil";
      default: return difficulty;
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-3">Nenhum card encontrado</h3>
            <p className="text-slate-600 mb-4">
              Não há cards disponíveis para este tipo de estudo personalizado.
            </p>
            <Button onClick={onBack}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="border-slate-300 text-slate-200 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-white text-xl font-bold">
                {studyTypeLabels[studyType]}
              </h1>
              <p className="text-blue-100">
                Pasta: {folderName} • {currentIndex + 1} de {flashcards.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Badge de Estudo Personalizado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-purple-800 font-medium text-sm">
              ⚡ Estudo Personalizado - Não afeta seu cronograma de revisão
            </span>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 mb-4" />
            
            <div className="flex justify-between text-sm">
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {sessionStats.correct} acertos
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {sessionStats.incorrect} erros
              </span>
            </div>
          </div>
        </motion.div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
              <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
                <div className="flex justify-center gap-2 mb-4 flex-wrap">
                  <Badge variant="outline" className="bg-[#0a223b] text-white px-3 py-1">
                    {currentFlashcard.category || "Geral"}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${getDifficultyColor(currentFlashcard.difficulty)} px-3 py-1`}
                  >
                    {formatDifficulty(currentFlashcard.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 px-3 py-1">
                    Personalizado
                  </Badge>
                </div>
                <CardTitle className="text-xl text-[#0a223b]">
                  {currentFlashcard.question}
                </CardTitle>
                {currentFlashcard.image_question && (
                  <img src={currentFlashcard.image_question} alt="Imagem da pergunta" className="mt-4 max-w-full mx-auto rounded-lg" />
                )}
              </CardHeader>
              <CardContent className="p-8 text-center space-y-8">
                <AnimatePresence mode="wait">
                  {showAnswer ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl border border-slate-200"
                    >
                      {currentFlashcard.image_answer && (
                        <img src={currentFlashcard.image_answer} alt="Imagem da resposta" className="mb-4 max-w-full mx-auto rounded-lg" />
                      )}
                      <p className="text-slate-700 text-lg leading-relaxed mb-6">
                        {currentFlashcard.answer}
                      </p>
                      
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => handleAnswer(false)}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 px-6 py-3"
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Errei
                        </Button>
                        <Button
                          onClick={() => handleAnswer(true)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg px-6 py-3"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Acertei
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
                    >
                      <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                      <p className="text-purple-700 text-xl mb-6">
                        Pense na resposta e clique para revelar
                      </p>
                      <Button
                        onClick={toggleAnswer}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl px-8 py-4 text-lg"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        Mostrar Resposta
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}