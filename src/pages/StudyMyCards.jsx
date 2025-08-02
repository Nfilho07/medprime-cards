
import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Eye, EyeOff, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function StudyMyCards() {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      const user = await User.me();
      const data = await Flashcard.filter({ created_by: user.email });
      
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
      setSessionStats({ correct: 0, incorrect: 0, total: shuffled.length });
    } catch (error) {
      console.error("Erro ao carregar flashcards do usuário:", error);
      setFlashcards([]);
    }
    setIsLoading(false);
  };

  const handleAnswer = async (isCorrect) => {
    const currentFlashcard = flashcards[currentIndex];
    
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    try {
      await Flashcard.update(currentFlashcard.id, {
        times_studied: (currentFlashcard.times_studied || 0) + 1,
        correct_answers: (currentFlashcard.correct_answers || 0) + (isCorrect ? 1 : 0),
        last_studied: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error);
    }

    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        alert(`Sessão concluída!\nAcertos: ${sessionStats.correct + (isCorrect ? 1 : 0)}\nErros: ${sessionStats.incorrect + (isCorrect ? 0 : 1)}`);
        navigate(createPageUrl("MyFlashcards"));
      }
    }, 1000);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0, total: flashcards.length });
    loadFlashcards();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "facil": return "bg-green-100 text-green-700 border-green-200";
      case "dificil": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 text-center p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Sem Flashcards para Estudar</h3>
          <p className="text-slate-600 mb-4">Você precisa criar alguns flashcards antes de iniciar uma sessão de estudo.</p>
          <Button onClick={() => navigate(createPageUrl("Create"))}>
            Criar Agora
          </Button>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto w-full p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("MyFlashcards"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-slate-900 text-xl font-bold">Estudando Meus Flashcards</h1>
              <p className="text-slate-600">
                {currentIndex + 1} de {flashcards.length}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={restartSession}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          <div className="flex justify-between text-sm text-slate-600">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-green-600">✓ {sessionStats.correct}</span>
            <span className="text-red-600">✗ {sessionStats.incorrect}</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-slate-950 text-slate-50 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {currentFlashcard.category}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getDifficultyColor(currentFlashcard.difficulty)}`}
                  >
                    {currentFlashcard.difficulty}
                  </Badge>
                   {currentFlashcard.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />}
                </div>
                <CardTitle className="text-xl text-slate-900">
                  {currentFlashcard.question}
                </CardTitle>
                {currentFlashcard.image_question && <img src={currentFlashcard.image_question} alt="Imagem da pergunta" className="mt-4 max-w-full mx-auto rounded-md" />}
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <AnimatePresence mode="wait">
                  {showAnswer ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      {currentFlashcard.image_answer && <img src={currentFlashcard.image_answer} alt="Imagem da resposta" className="mb-4 max-w-full mx-auto rounded-md" />}
                      <p className="text-slate-700 text-lg leading-relaxed">
                        {currentFlashcard.answer}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <p className="text-blue-700 text-lg">
                        Clique para revelar a resposta
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center">
                  {!showAnswer ? (
                    <Button
                      onClick={toggleAnswer}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg px-8 py-3"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Mostrar Resposta
                    </Button>
                  ) : (
                    <div className="flex gap-4">
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
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
