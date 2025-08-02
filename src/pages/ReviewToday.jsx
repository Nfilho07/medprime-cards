
import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Eye, Calendar, Brain, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateDynamicAchievements } from '@/components/gamification/DynamicAchievements';
import { getLevelForXp } from '@/components/gamification/utils';

export default function ReviewToday() {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Default intervals now include a unit (minutos/horas/dias)
  const [userSettings, setUserSettings] = useState({
    interval_wrong: { value: 1, unit: 'dias' },
    interval_doubt: { value: 3, unit: 'dias' },
    interval_correct: { value: 6, unit: 'dias' },
    interval_easy: { value: 15, unit: 'dias' }
  });

  useEffect(() => {
    loadDueFlashcards();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const user = await User.me();
      // Helper for default interval objects
      const defaultInterval = (value, unit) => ({ value, unit });

      // Ensure user.review_settings exists and merge with defaults, including units
      const settings = {
        interval_wrong: user.review_settings?.interval_wrong ?? defaultInterval(1, 'dias'),
        interval_doubt: user.review_settings?.interval_doubt ?? defaultInterval(3, 'dias'),
        interval_correct: user.review_settings?.interval_correct ?? defaultInterval(6, 'dias'),
        interval_easy: user.review_settings?.interval_easy ?? defaultInterval(15, 'dias')
      };
      setUserSettings(settings);
    } catch (error) {
      console.error("Erro ao carregar configurações do usuário:", error);
      // Keep default settings if loading fails
    }
  };

  const loadDueFlashcards = async () => {
    try {
      const user = await User.me();
      const now = new Date(); // Current time for comparison

      // Fetch all user flashcards
      const allCards = await Flashcard.filter({ created_by: user.email });

      // Filter cards that are due for review now (considering full ISO time)
      const dueCards = allCards.filter(card => {
        // If next_review is not defined, it's a new card or never reviewed, so it's due.
        if (!card.next_review) return true;
        // Compare next_review (ISO string) with current time
        const cardNextReviewDate = new Date(card.next_review);
        return cardNextReviewDate <= now;
      });

      const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
      setSessionStats({ reviewed: 0, total: shuffled.length });
    } catch (error) {
      console.error("Erro ao carregar flashcards para revisão:", error);
      setFlashcards([]);
    }
    setIsLoading(false);
  };

  // calculateNextReview now takes the full flashcard object to access its current interval and unit
  const calculateNextReview = (quality, flashcard) => {
    const currentIntervalValue = flashcard.interval || 0; // Numeric value of previous interval
    const currentIntervalUnit = flashcard.interval_unit || 'dias'; // Unit of previous interval
    let easeFactor = flashcard.ease_factor || 2.5; // Default ease factor

    let selectedInterval; // This will be the { value, unit } object from user settings

    // Use personalized user settings for base interval
    switch (quality) {
      case 1: // Errei
        selectedInterval = userSettings.interval_wrong;
        break;
      case 2: // Dúvida
        selectedInterval = userSettings.interval_doubt;
        break;
      case 3: // Acertei
        selectedInterval = userSettings.interval_correct;
        break;
      case 4: // Muito fácil
        selectedInterval = userSettings.interval_easy;
        break;
      default: // Fallback
        selectedInterval = { value: 1, unit: 'dias' };
    }

    let finalIntervalValue = selectedInterval.value;
    let finalIntervalUnit = selectedInterval.unit;

    // Convert currentIntervalValue to days for SM-2 logic comparison
    // SM-2 algorithm operates primarily on days.
    let currentIntervalValueInDays = currentIntervalValue;
    if (currentIntervalUnit === 'horas') {
      currentIntervalValueInDays = currentIntervalValue / 24;
    } else if (currentIntervalUnit === 'minutos') {
      currentIntervalValueInDays = currentIntervalValue / (24 * 60);
    }

    // For correct answers (3 and 4), apply spaced repetition algorithm (SM-2 like)
    // This logic ensures the multiplicative factor applies after initial reviews.
    // If it's a very first review (currentIntervalValueInDays is 0), or incorrect, skip multiplication.
    if (quality >= 3 && currentIntervalValueInDays > 0) {
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.max(1.3, easeFactor);

      // Convert user's 'correct' threshold to days for comparison
      const correctThresholdInDays =
        userSettings.interval_correct.unit === 'horas'
          ? userSettings.interval_correct.value / 24
          : userSettings.interval_correct.unit === 'minutos'
            ? userSettings.interval_correct.value / (24 * 60)
            : userSettings.interval_correct.value;

      // If the card's current interval (in days) is already at or beyond the 'correct' threshold,
      // then apply the multiplicative factor. The result of SM-2 multiplication is typically in days.
      if (currentIntervalValueInDays >= correctThresholdInDays) {
        finalIntervalValue = Math.round(currentIntervalValueInDays * easeFactor);
        finalIntervalUnit = 'dias'; // SM-2 typically leads to day-based intervals for longer periods.
      } else {
        // If not yet past the threshold, stick to the user's defined base interval and unit.
        finalIntervalValue = selectedInterval.value;
        finalIntervalUnit = selectedInterval.unit;
      }
    }

    const nextReviewDate = new Date();
    if (finalIntervalUnit === 'minutos') {
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + finalIntervalValue);
    } else if (finalIntervalUnit === 'horas') {
      nextReviewDate.setHours(nextReviewDate.getHours() + finalIntervalValue);
    } else { // Default to days if unit is 'dias' or unspecified
      nextReviewDate.setDate(nextReviewDate.getDate() + finalIntervalValue);
    }

    return {
      interval: finalIntervalValue, // The calculated numeric interval
      intervalUnit: finalIntervalUnit, // The unit (minutos/horas/dias)
      easeFactor: easeFactor,
      nextReview: nextReviewDate.toISOString() // Store as full ISO string for accurate time-based review
    };
  };

  const handleReviewResponse = async (quality) => {
    const currentFlashcard = flashcards[currentIndex];

    // Calculate next review using the flashcard's current state
    const { interval, intervalUnit, easeFactor, nextReview } = calculateNextReview(quality, currentFlashcard);

    try {
      await Flashcard.update(currentFlashcard.id, {
        times_studied: (currentFlashcard.times_studied || 0) + 1,
        correct_answers: (currentFlashcard.correct_answers || 0) + (quality >= 3 ? 1 : 0), // Fixed: increment correct answers
        last_studied: new Date().toISOString(),
        review_level: Math.min((currentFlashcard.review_level || 0) + (quality >= 3 ? 1 : 0), 5),
        next_review: nextReview,
        interval: interval,
        interval_unit: intervalUnit,
        ease_factor: easeFactor
      });

      // Enhanced Gamification with Achievement Checking and proper XP/Level progression
      if(currentIndex === flashcards.length - 1) { // End of session
          const user = await User.me();
          const xpPerSession = 50;
          const totalSessions = (user.total_sessions_completed || 0) + 1;
          const totalCardsReviewed = (user.total_cards_reviewed || 0) + flashcards.length;

          // Check for achievement unlocks
          const statsForAchievements = {
            total_cards_created: user.total_cards_created || 0,
            total_sessions_completed: totalSessions,
            total_challenges_completed: user.total_challenges_completed || 0,
            total_cards_reviewed: totalCardsReviewed,
            level: user.level || 1, // Include user level in stats
          };
          
          const allPossibleAchievements = generateDynamicAchievements(statsForAchievements.level);
          const currentUnlocked = user.achievements_unlocked || [];
          const newlyUnlocked = [];
          
          for (const achievement of allPossibleAchievements) {
              if (currentUnlocked.includes(achievement.achievement_id)) continue;
              
              let shouldUnlock = false;
              switch (achievement.condition_type) {
                  case 'cards_created': shouldUnlock = statsForAchievements.total_cards_created >= achievement.condition_value; break;
                  case 'sessions_completed': shouldUnlock = statsForAchievements.total_sessions_completed >= achievement.condition_value; break;
                  case 'timed_challenges_completed': shouldUnlock = statsForAchievements.total_challenges_completed >= achievement.condition_value; break;
                  case 'cards_reviewed': shouldUnlock = statsForAchievements.total_cards_reviewed >= achievement.condition_value; break;
                  case 'user_level': shouldUnlock = statsForAchievements.level >= achievement.condition_value; break;
                  default: shouldUnlock = false; // Add a default case
              }

              if (shouldUnlock) {
                  newlyUnlocked.push(achievement);
              }
          }

          const achievementXp = newlyUnlocked.reduce((sum, ach) => sum + ach.xp_reward, 0);
          const finalXp = (user.xp || 0) + xpPerSession + achievementXp;
          const finalLevel = getLevelForXp(finalXp);

          const newAchievementIds = newlyUnlocked.map(ach => ach.achievement_id);
          const updatedAchievements = [...currentUnlocked, ...newAchievementIds];

          await User.updateMyUserData({
              xp: finalXp,
              level: finalLevel,
              total_sessions_completed: totalSessions,
              total_cards_reviewed: totalCardsReviewed,
              achievements_unlocked: updatedAchievements
          });
      }

      // Update session stats correctly
      const newReviewed = sessionStats.reviewed + 1;
      setSessionStats(prev => ({
        ...prev,
        reviewed: newReviewed
      }));

      // Next flashcard
      setTimeout(() => {
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setShowAnswer(false);
        } else {
          // End of session with correct stats
          alert(`Sessão de revisão concluída!\nCards revisados: ${newReviewed}/${flashcards.length}`);
          navigate(createPageUrl("Dashboard"));
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar flashcard:", error);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ reviewed: 0, total: flashcards.length });
    loadDueFlashcards(); // Reload due flashcards in case any were added/changed or to reset review state
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
      case "dificil": return "Difícil";
      default: return "Médio";
    }
  };

  // Helper function to format interval text for display
  const formatIntervalText = (intervalObj) => {
    if (!intervalObj || typeof intervalObj.value === 'undefined' || !intervalObj.unit) {
      return 'N/A'; // Fallback
    }
    const { value, unit } = intervalObj;
    let unitText;
    switch (unit) {
      case 'minutos':
        unitText = value === 1 ? 'minuto' : 'minutos';
        break;
      case 'horas':
        unitText = value === 1 ? 'hora' : 'horas';
        break;
      case 'dias':
        unitText = value === 1 ? 'dia' : 'dias';
        break;
      default:
        unitText = 'dias'; // Fallback
    }
    return `${value} ${unitText}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando revisões de hoje...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="bg-[#0a223b] min-h-screen from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">🎉 Parabéns!</h3>
            <p className="text-slate-600 mb-4">
              Você não tem flashcards para revisar hoje. Que tal criar mais conteúdo?
            </p>
            <Button onClick={() => navigate(createPageUrl("Create"))}>
              Criar Novos Flashcards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        {/* Header Logo */}
        <div className="mb-8 flex justify-center md:justify-start">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10b52184c_MedPrime_Logo_Transparent.png"
            alt="MedPrime Logo"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-slate-50 text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Revisar Hoje
              </h1>
              <p className="text-slate-50">
                {currentIndex + 1} de {flashcards.length} cards
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
            <span>Progresso da Revisão</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="flex justify-between text-sm">
            <span className="text-slate-50">📚 {sessionStats.reviewed} revisados</span>
            <span className="text-slate-50">{sessionStats.total - sessionStats.reviewed} restantes</span>
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
                  <Badge variant="outline" className="bg-[#0a223b] text-slate-50 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {currentFlashcard.category || "Geral"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getDifficultyColor(currentFlashcard.difficulty)}`}
                  >
                    {formatDifficulty(currentFlashcard.difficulty)}
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
                      <p className="text-slate-700 text-lg leading-relaxed mb-6">
                        {currentFlashcard.answer}
                      </p>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-600 mb-4">
                          Como foi sua resposta?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => handleReviewResponse(1)}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 h-12"
                          >
                            😫 ERREI<br />
                            <span className="text-xs">
                              Revisar em {formatIntervalText(userSettings.interval_wrong)}
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleReviewResponse(2)}
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50 h-12"
                          >
                            😐 DIFÍCIL<br />
                            <span className="text-xs">
                              Revisar em {formatIntervalText(userSettings.interval_doubt)}
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleReviewResponse(3)}
                            variant="outline"
                            className="border-green-200 text-green-600 hover:bg-green-50 h-12"
                          >
                            🙂 BOM<br />
                            <span className="text-xs">
                              Revisar em {formatIntervalText(userSettings.interval_correct)}
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleReviewResponse(4)}
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 h-12"
                          >
                            😎 FÁCIL<br />
                            <span className="text-xs">
                              Revisar em {formatIntervalText(userSettings.interval_easy)}+
                            </span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-blue-700 text-lg mb-4">
                        Pense na resposta antes de revelar
                      </p>
                      <Button
                        onClick={toggleAnswer}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg px-8 py-3"
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
      {/* Footer */}
      <footer className="w-full mt-12 py-6 text-center text-slate-400 text-sm border-t border-slate-700/50">
        <div className="flex flex-col items-center justify-center space-y-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10b52184c_MedPrime_Logo_Transparent.png"
            alt="MedPrime Logo"
            className="h-8 w-auto object-contain opacity-80"
          />
          <p>&copy; {new Date().getFullYear()} MedPrime. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
