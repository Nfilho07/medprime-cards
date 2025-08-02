
import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Timer, Award, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelForXp } from '@/components/gamification/utils';

const ChallengeSetup = ({ onStart }) => {
  const [cardCount, setCardCount] = useState(10);
  const [time, setTime] = useState(5); // in minutes
  const [isLoading, setIsLoading] = useState(false); // Changed to false as per outline

  const handleStart = () => {
    onStart({ count: cardCount, time: time * 60 });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
          <CardTitle className="text-2xl font-bold text-[#0a223b]">Configurar Desafio</CardTitle>
          <p className="text-slate-600 mt-2">Flashcards aleatórios para máximo desafio!</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="card-count" className="font-medium text-slate-700">Nº de Flashcards</Label>
              <Input
                id="card-count"
                type="number"
                value={cardCount}
                onChange={(e) => setCardCount(parseInt(e.target.value))}
                min="5"
                max="50"
                className="mt-2" />

              <p className="text-xs text-slate-500 mt-1">Entre 5 e 50 flashcards</p>
            </div>
            <div>
              <Label htmlFor="time" className="font-medium text-slate-700">Tempo (minutos)</Label>
              <Input
                id="time"
                type="number"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value))}
                min="1"
                max="30"
                className="mt-2" />

              <p className="text-xs text-slate-500 mt-1">Entre 1 e 30 minutos</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Desafio Aleatório</h3>
            <p className="text-blue-700 text-sm">
              Os flashcards serão selecionados aleatoriamente de toda sua biblioteca para um desafio mais dinâmico e completo!
            </p>
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl text-lg h-12"
            disabled={isLoading}>

            <Play className="w-5 h-5 mr-2" />
            Começar Desafio
          </Button>
        </CardContent>
      </Card>
    </motion.div>);

};

const ChallengeResults = ({ correct, incorrect, xpGained, onRestart, onExit }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md text-center">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
          <CardTitle className="text-3xl font-bold text-[#0a223b] flex items-center justify-center gap-3">
            <Award className="w-8 h-8 text-yellow-500" />
            Desafio Concluído!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xl">
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="font-bold text-green-700">{correct}</p>
              <p className="text-sm text-green-600">Corretas</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <p className="font-bold text-red-700">{incorrect}</p>
              <p className="text-sm text-red-600">Incorretas</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            +{xpGained} XP Ganhos!
          </div>
          <div className="flex gap-4">
            <Button onClick={onRestart} variant="outline" className="w-full">
              Novo Desafio
            </Button>
            <Button onClick={onExit} className="w-full">
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>);

};

export default function TimedChallenge() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [gameState, setGameState] = useState('setup');
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState({ correct: 0, incorrect: 0 });

  const xpPerCorrectAnswer = 15;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.log("Usuário não logado.", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, gameState]);

  const handleStartChallenge = async (config) => {
    try {
      const user = await User.me();
      const allFlashcards = await Flashcard.filter({ created_by: user.email });

      if (allFlashcards.length === 0) {
        alert("Você precisa criar alguns flashcards primeiro!");
        return;
      }

      // Embaralha todos os flashcards e pega a quantidade desejada
      const shuffled = allFlashcards.sort(() => 0.5 - Math.random());
      setFlashcards(shuffled.slice(0, Math.min(config.count, allFlashcards.length)));
      setTimeLeft(config.time);
      setCurrentIndex(0);
      setResults({ correct: 0, incorrect: 0 });
      setShowAnswer(false);
      setGameState('playing');
    } catch (error) {
      console.error("Erro ao iniciar desafio:", error);
      alert("Erro ao iniciar desafio. Tente novamente.");
    }
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setResults((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setResults((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    setGameState('results');
    const xpGained = results.correct * xpPerCorrectAnswer;
    try {
      const currentUser = await User.me();
      const newXp = (currentUser.xp || 0) + xpGained;
      const newLevel = getLevelForXp(newXp);
      await User.updateMyUserData({
        xp: newXp,
        level: newLevel,
        total_challenges_completed: (currentUser.total_challenges_completed || 0) + 1
      });
      setUser((prev) => ({ ...prev, xp: newXp, level: newLevel }));
    } catch (error) {
      console.error("Erro ao salvar progresso do desafio:", error);
    }
  };

  const currentCard = useMemo(() => flashcards[currentIndex], [flashcards, currentIndex]);

  if (isLoadingUser) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => gameState === 'playing' ? setGameState('setup') : navigate(createPageUrl("Dashboard"))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-white text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Timer className="w-8 h-8 text-purple-400" />
              Desafio Diário
            </h1>
            <p className="text-blue-100">Teste seus conhecimentos contra o relógio!</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {gameState === 'setup' &&
          <motion.div key="setup">
              <ChallengeSetup onStart={handleStartChallenge} />
            </motion.div>
          }

          {gameState === 'playing' && currentCard &&
          <motion.div key="playing" className="space-y-6">
              <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-xl">
                <div className="text-white font-bold text-xl">
                  {currentIndex + 1} / {flashcards.length}
                </div>
                <div className="flex items-center gap-2 text-white font-bold text-xl">
                  <Timer className="w-6 h-6" />
                  {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}
                </div>
              </div>
              <Progress value={timeLeft / (5 * 60) * 100} className="h-3" /> {/* Assumes initial 5 minutes for progress bar */}

              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-[#0a223b]">{currentCard.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center space-y-6">
                  {showAnswer ?
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-slate-700 text-lg mb-6">{currentCard.answer}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleAnswer(false)} variant="destructive" className="h-16 text-lg">
                          <XCircle className="w-6 h-6 mr-2" />
                          Errei
                        </Button>
                        <Button onClick={() => handleAnswer(true)} variant="default" className="h-16 text-lg bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-6 h-6 mr-2" />
                          Acertei
                        </Button>
                      </div>
                    </motion.div> :

                <Button onClick={() => setShowAnswer(true)} className="px-8 py-4 text-lg">
                      Mostrar Resposta
                    </Button>
                }
                </CardContent>
              </Card>
            </motion.div>
          }

          {gameState === 'results' &&
          <motion.div key="results">
              <ChallengeResults
              correct={results.correct}
              incorrect={results.incorrect}
              xpGained={results.correct * xpPerCorrectAnswer}
              onRestart={() => setGameState('setup')}
              onExit={() => navigate(createPageUrl('Dashboard'))} />

            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>);

}