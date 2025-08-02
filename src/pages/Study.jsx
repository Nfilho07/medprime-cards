
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Brain, Eye, BookOpen, FolderOpen, Star, Trophy, Calendar, CheckCircle, XCircle, Sparkles, AlertCircle, FolderKanban, MoreVertical, Target as TargetIcon, Crown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateDynamicAchievements } from '@/components/gamification/DynamicAchievements';
import { getLevelForXp } from '@/components/gamification/utils';
import StudyCompletionScreen from '../components/study/StudyCompletionScreen';
import CustomStudyModal from '../components/study/CustomStudyModal';
import CustomStudySession from '../components/study/CustomStudySession';
import CustomStudyCompletionScreen from '../components/study/CustomStudyCompletionScreen';

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

export default function Study() {
  const navigate = useNavigate();
  const location = useLocation();
  const loadingRef = useRef(false);

  const [decks, setDecks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    total: 0,
    correct: 0,
    newCards: 0,
    reviewCards: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [proUserMessage, setProUserMessage] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [userSettings, setUserSettings] = useState({
    interval_wrong: { value: 1, unit: 'dias' },
    interval_doubt: { value: 3, unit: 'dias' },
    interval_correct: { value: 6, unit: 'dias' },
    interval_easy: { value: 15, unit: 'dias' }
  });

  // Custom Study States
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [showCustomStudyModal, setShowCustomStudyModal] = useState(false);
  const [customStudyType, setCustomStudyType] = useState(null);
  const [customStudyCards, setCustomStudyCards] = useState([]);
  const [showCustomStudySession, setShowCustomStudySession] = useState(false);
  const [showCustomCompletionScreen, setShowCustomCompletionScreen] = useState(false);
  const [customSessionStats, setCustomSessionStats] = useState({});
  const [customStudyOptions, setCustomStudyOptions] = useState({});

  useEffect(() => {
    loadPageData();
  }, [location.key]);

  const loadPageData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      // Aplicando a lógica de retry nas chamadas de API
      const userData = await retryRequest(() => User.me());
      setUser(userData);

      const defaultInterval = (value, unit) => ({ value, unit });
      const settings = {
        interval_wrong: userData.review_settings?.interval_wrong || defaultInterval(1, 'dias'),
        interval_doubt: userData.review_settings?.interval_doubt || defaultInterval(3, 'dias'),
        interval_correct: userData.review_settings?.interval_correct || defaultInterval(6, 'dias'),
        interval_easy: userData.review_settings?.interval_easy || defaultInterval(15, 'dias')
      };
      setUserSettings(settings);

      const userFlashcards = await retryRequest(() => Flashcard.filter({ created_by: userData.email }));

      if (!userFlashcards || userFlashcards.length === 0) {
        setDecks([]);
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }

      const decksData = userFlashcards.
        filter((card) => card.folder && card.folder.trim() !== "").
        reduce((acc, card) => {
          const folderName = card.folder;
          if (!acc[folderName]) {
            acc[folderName] = { cards: [] };
          }
          acc[folderName].cards.push(card);
          return acc;
        }, {});

      const now = new Date();
      const calculatedDecks = Object.keys(decksData).map((folderName) => {
        const deckCards = decksData[folderName].cards;
        const dueCards = deckCards.filter((card) => {
          if (!card.next_review) return true;
          try {
            const nextReviewDate = new Date(card.next_review);
            return nextReviewDate <= now;
          } catch (e) {
            console.warn("Invalid next_review date in card:", card.next_review, e);
            return true;
          }
        }).length;

        return {
          name: folderName,
          dueCards: dueCards,
          totalCards: deckCards.length
        };
      }).sort((a, b) => b.dueCards - a.dueCards);

      setDecks(calculatedDecks);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (error.response?.status === 429) {
        setError("Sistema temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.");
        setTimeout(() => setError(""), 5000);
      } else {
        setError("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleStartStudy = (folderName) => {
    setSelectedFolder(folderName);
    setIsStudying(true); // Immediate transition to study screen
    loadStudySession(folderName); // Load data in background
  };

  const loadStudySession = async (folderName) => {
    if (!folderName || !folderName.trim()) {
      setError("Nome da pasta inválido.");
      setFlashcards([]); // Ensure cards are cleared on error
      return;
    }

    setError("");
    console.log("Iniciando sessão para pasta:", folderName);

    try {
      const user = await retryRequest(() => User.me());
      const now = new Date();

      // Get all cards from selected folder with exact match
      const folderCards = await retryRequest(() => Flashcard.filter({
        created_by: user.email,
        folder: folderName.trim()
      }));

      console.log(`Cards encontrados na pasta "${folderName}":`, folderCards.length);

      if (!folderCards || folderCards.length === 0) {
        setError(`Nenhum flashcard encontrado na pasta "${folderName}". Verifique se existem cards nesta pasta.`);
        setFlashcards([]); // Ensure cards are cleared if none found
        return;
      }

      // Separate new cards from cards that need review
      const newCards = folderCards.filter((card) => !card.next_review);
      const dueCards = folderCards.filter((card) => {
        if (!card.next_review) return false;
        try {
          const nextReviewDate = new Date(card.next_review);
          return nextReviewDate <= now;
        } catch (e) {
          console.warn("Data de revisão inválida:", card.next_review);
          return false;
        }
      });

      console.log("Cards novos:", newCards.length, "Cards para revisar:", dueCards.length);

      // Combine and shuffle (prioritize due cards, then new cards)
      const studyCards = [...dueCards, ...newCards.slice(0, 20)].sort(() => Math.random() - 0.5);

      if (studyCards.length === 0) {
        setError("Não há cards novos ou para revisar nesta pasta no momento.");
        // Se não houver cards, limpe o array e o erro será tratado na renderização
        setFlashcards([]);
        return;
      }

      setFlashcards(studyCards);
      setSessionStats({
        reviewed: 0,
        total: studyCards.length,
        correct: 0,
        newCards: newCards.length,
        reviewCards: dueCards.length
      });
      setCurrentIndex(0);
      setShowAnswer(false);
      setSessionStartTime(Date.now()); // Record session start time
      // The setIsStudying(true) line was removed from here to allow immediate transition

    } catch (error) {
      console.error("Erro ao carregar sessão de estudo:", error);
      setError("Erro ao carregar a sessão de estudo. Tente novamente.");
      setFlashcards([]); // Clear flashcards on error to ensure error message is shown
    }
  };

  const calculateNextReview = (quality, flashcard) => {
    const currentIntervalValue = flashcard.interval || 0;
    const currentIntervalUnit = flashcard.interval_unit || 'dias';
    let easeFactor = flashcard.ease_factor || 2.5;

    let selectedInterval;

    switch (quality) {
      case 1: selectedInterval = userSettings.interval_wrong; break;
      case 2: selectedInterval = userSettings.interval_doubt; break;
      case 3: selectedInterval = userSettings.interval_correct; break;
      case 4: selectedInterval = userSettings.interval_easy; break;
      default: selectedInterval = { value: 1, unit: 'dias' };
    }

    let finalIntervalValue = selectedInterval.value;
    let finalIntervalUnit = selectedInterval.unit;

    // Apply SM-2 algorithm for advanced cards
    if (quality >= 3 && currentIntervalValue > 0) {
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.max(1.3, easeFactor);

      const correctThresholdInDays = userSettings.interval_correct.unit === 'dias' ?
        userSettings.interval_correct.value :
        userSettings.interval_correct.value / 24;

      const currentIntervalInDays = currentIntervalUnit === 'dias' ?
        currentIntervalValue :
        currentIntervalValue / 24;

      if (currentIntervalInDays >= correctThresholdInDays) {
        finalIntervalValue = Math.round(currentIntervalInDays * easeFactor);
        finalIntervalUnit = 'dias';
      }
    }

    const nextReviewDate = new Date();
    if (finalIntervalUnit === 'minutos') {
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + finalIntervalValue);
    } else if (finalIntervalUnit === 'horas') {
      nextReviewDate.setHours(nextReviewDate.getHours() + finalIntervalValue);
    } else {
      nextReviewDate.setDate(nextReviewDate.getDate() + finalIntervalValue);
    }

    return {
      interval: finalIntervalValue,
      intervalUnit: finalIntervalUnit,
      easeFactor: easeFactor,
      nextReview: nextReviewDate.toISOString()
    };
  };

  const handleReviewResponse = (quality) => {
    const currentFlashcard = flashcards[currentIndex];
    const isCorrect = quality >= 3;

    // --- 1. Optimistic UI Update (Immediate response) ---
    // Update session stats
    const newStats = {
      ...sessionStats,
      reviewed: sessionStats.reviewed + 1,
      correct: sessionStats.correct + (isCorrect ? 1 : 0)
    };
    setSessionStats(newStats);

    // Move to the next card or end session
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Calculate session duration
      const sessionDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;

      // Update final stats with duration
      const finalStats = {
        ...newStats,
        timeTaken: sessionDuration
      };
      setSessionStats(finalStats);

      // End of session - show completion screen
      setIsStudying(false);
      setShowCompletionScreen(true);
    }

    // --- 2. Background async operations (No await) ---
    const { interval, intervalUnit, easeFactor, nextReview } = calculateNextReview(quality, currentFlashcard);

    // Update Flashcard in background
    Flashcard.update(currentFlashcard.id, {
      times_studied: (currentFlashcard.times_studied || 0) + 1,
      correct_answers: (currentFlashcard.correct_answers || 0) + (isCorrect ? 1 : 0),
      last_studied: new Date().toISOString(),
      review_level: Math.min((currentFlashcard.review_level || 0) + (isCorrect ? 1 : 0), 5),
      next_review: nextReview,
      interval: interval,
      interval_unit: intervalUnit,
      ease_factor: easeFactor
    }).catch((error) => console.error("Erro ao atualizar flashcard em background:", error));

    // Update User stats in background
    if (user) {
      const updatedUserFields = {
        total_cards_reviewed: (user.total_cards_reviewed || 0) + 1
      };

      // Award XP and achievements on session completion (last card)
      if (currentIndex === flashcards.length - 1) {
        const xpPerSession = 50;
        const totalSessions = (user.total_sessions_completed || 0) + 1;
        const totalCardsReviewed = (user.total_cards_reviewed || 0) + flashcards.length; // This is already being incremented card by card, consider if this is double counting or intended for total session count. For now, it adds total cards for the session at the end.

        // Recalculate XP and achievements
        const statsForAchievements = {
          total_cards_created: user.total_cards_created || 0,
          total_sessions_completed: totalSessions,
          total_challenges_completed: user.total_challenges_completed || 0,
          total_cards_reviewed: totalCardsReviewed,
          level: user.level || 1
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
            default: shouldUnlock = false;
          }

          if (shouldUnlock) {
            newlyUnlocked.push(achievement);
          }
        }

        const achievementXp = newlyUnlocked.reduce((sum, ach) => sum + ach.xp_reward, 0);
        const finalXp = (user.xp || 0) + xpPerSession + achievementXp;
        const finalLevel = getLevelForXp(finalXp);

        const newAchievementIds = newlyUnlocked.map((ach) => ach.achievement_id);
        const updatedAchievements = [...currentUnlocked, ...newAchievementIds];

        updatedUserFields.xp = finalXp;
        updatedUserFields.level = finalLevel;
        updatedUserFields.total_sessions_completed = totalSessions;
        // total_cards_reviewed is already updated per card, ensuring cumulative total.
        updatedUserFields.achievements_unlocked = updatedAchievements;
      }

      User.updateMyUserData(updatedUserFields).
        then((updatedUser) => setUser(updatedUser)) // Keep local user state synced
        .catch((error) => console.error("Erro ao atualizar dados do usuário em background:", error));

      // Show motivational message for Pro users
      if (isCorrect) {
        setProUserMessage("🎉 Progresso salvo! Continue assim!");
        setTimeout(() => setProUserMessage(""), 3000);
      }
    }
  };

  // Fixed Custom Study Functions
  const getCustomStudyOptions = async (folderName) => {
    try {
      const user = await retryRequest(() => User.me());
      const allFolderCards = await retryRequest(() => Flashcard.filter({
        created_by: user.email,
        folder: folderName
      }));

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        total: allFolderCards.length,
        newCards: allFolderCards.filter((card) => !card.next_review).length,
        difficultCards: allFolderCards.filter((card) => card.difficulty === 'dificil').length,
        recentMistakes: allFolderCards.filter((card) => {
          if (!card.last_studied) return false;
          const lastStudied = new Date(card.last_studied);
          const correctRate = card.times_studied > 0 ? (card.correct_answers || 0) / card.times_studied : 1;
          return lastStudied >= sevenDaysAgo && correctRate < 0.5; // Recent mistakes
        }).length
      };
    } catch (error) {
      console.error("Erro ao calcular opções de estudo personalizado:", error);
      return { total: 0, newCards: 0, difficultCards: 0, recentMistakes: 0 };
    }
  };

  const startCustomStudy = async (options) => {
    const { studyType, count, isRandom } = options;

    try {
      const user = await retryRequest(() => User.me());
      const allFolderCards = await retryRequest(() => Flashcard.filter({
        created_by: user.email,
        folder: selectedFolder
      }));

      let cardsToStudy = [];

      switch (studyType) {
        case 'review_all':
          cardsToStudy = allFolderCards;
          break;
        case 'new_cards':
          cardsToStudy = allFolderCards.filter((card) => !card.next_review);
          break;
        case 'difficult_cards':
          cardsToStudy = allFolderCards.filter((card) => card.difficulty === 'dificil');
          break;
        case 'recent_mistakes':
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          cardsToStudy = allFolderCards.filter((card) => {
            if (!card.last_studied) return false;
            const lastStudied = new Date(card.last_studied);
            const correctRate = card.times_studied > 0 ? (card.correct_answers || 0) / card.times_studied : 1;
            return lastStudied >= sevenDaysAgo && correctRate < 0.5;
          });
          break;
        default:
          cardsToStudy = [];
          break;
      }

      if (isRandom) {
        cardsToStudy.sort(() => Math.random() - 0.5);
      }

      cardsToStudy = cardsToStudy.slice(0, count);

      if (cardsToStudy.length === 0) {
        setError(`Nenhum flashcard encontrado para as opções selecionadas.`);
        setShowCustomStudyModal(false);
        return;
      }

      setCustomStudyType(studyType);
      setCustomStudyCards(cardsToStudy);
      setShowCustomStudyModal(false);
      setShowCustomStudySession(true);

    } catch (error) {
      console.error("Erro ao iniciar estudo personalizado:", error);
      setError("Erro ao iniciar estudo personalizado.");
    }
  };

  const handleCustomStudyComplete = (stats) => {
    setCustomSessionStats(stats);
    setShowCustomStudySession(false);
    setShowCustomCompletionScreen(true);
  };

  // Fixed Custom Study Modal Handler
  const handleCustomStudyModalOpen = async (folderName) => {
    console.log("Iniciando estudo personalizado para pasta:", folderName);
    setSelectedFolder(folderName);

    try {
      const options = await getCustomStudyOptions(folderName);
      console.log("Opções calculadas:", options);
      setCustomStudyOptions(options);
      setShowCustomStudyModal(true);
    } catch (error) {
      console.error("Erro ao carregar opções de estudo personalizado:", error);
      setError("Erro ao carregar opções de estudo personalizado.");
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const formatIntervalText = (intervalObj) => {
    if (!intervalObj || typeof intervalObj.value === 'undefined' || !intervalObj.unit) {
      return 'N/A';
    }
    const { value, unit } = intervalObj;
    let unitText;
    switch (unit) {
      case 'minutos': unitText = value === 1 ? 'minuto' : 'minutos'; break;
      case 'horas': unitText = value === 1 ? 'hora' : 'horas'; break;
      case 'dias': unitText = value === 1 ? 'dia' : 'dias'; break;
      default: unitText = 'dias';
    }
    return `${value} ${unitText}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center w-full p-4 md:p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6" />

          <p className="text-blue-100 text-lg">Carregando seus dados...</p>
        </div>
      </div>);
  }

  // New error display for initial data loading
  if (error && !isStudying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md text-white"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button
            onClick={loadPageData}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render completion screen
  if (showCompletionScreen) {
    return (
      <StudyCompletionScreen
        score={sessionStats.correct}
        total={sessionStats.reviewed}
        timeTaken={sessionStats.timeTaken || 0}
        onRestart={() => {
          setShowCompletionScreen(false);
          setIsStudying(false);
          setSelectedFolder("");
          loadPageData(); // Recalculate due cards
        }}
        onBackToDashboard={() => navigate(createPageUrl("Dashboard"))}
      />
    );
  }

  // Render custom study completion screen
  if (showCustomCompletionScreen) {
    return (
      <CustomStudyCompletionScreen
        sessionStats={customSessionStats}
        studyType={customStudyType}
        folderName={selectedFolder}
        onBackToStudy={() => {
          setShowCustomCompletionScreen(false);
          // Assuming CustomStudyCompletionScreen should lead back to the main deck selection view
          // rather than the regular completion screen as per context.
          // This allows users to start another custom study or regular study directly.
          setIsStudying(false);
          setSelectedFolder("");
          loadPageData();
        }}
        onBackToDashboard={() => navigate(createPageUrl("Dashboard"))} />
    );
  }

  // Render custom study session
  if (showCustomStudySession) {
    return (
      <CustomStudySession
        folderName={selectedFolder}
        studyType={customStudyType}
        flashcards={customStudyCards}
        onComplete={handleCustomStudyComplete}
        onBack={() => {
          setShowCustomStudySession(false);
          setIsStudying(false); // Make sure to exit study mode when backing out of custom session
          setSelectedFolder("");
          loadPageData();
        }}
        userSettings={userSettings} // Pass user settings for custom study's calculateNextReview
      />);
  }

  // Study session in progress
  if (isStudying) {
    // If the session is starting and cards haven't been loaded yet
    if (flashcards.length === 0 && !error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
          <div className="text-center w-full p-4 md:p-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6" />

            <p className="text-blue-100 text-lg">Preparando sua sessão de estudo...</p>
          </div>
        </div>);
    }

    // If an error occurred or there are no cards to study
    if (!flashcards[currentIndex]) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
          <div className="text-center w-full p-4 md:p-8">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-100 text-lg">{error || "Não há flashcards para estudar nesta pasta no momento."}</p>
            <Button
              onClick={() => {
                setIsStudying(false);
                setSelectedFolder("");
                setError(""); // Clear error message
                setFlashcards([]); // Clear flashcards state
                loadPageData(); // Reload deck data
              }}
              className="mt-4">

              Voltar
            </Button>
          </div>
        </div>);
    }

    const currentFlashcard = flashcards[currentIndex];
    const progress = (currentIndex + 1) / flashcards.length * 100;
    const isNewCard = !currentFlashcard.next_review;

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
          <div className="max-w-2xl mx-auto w-full p-2 sm:p-4 md:p-8">
            <AnimatePresence>
              {proUserMessage &&
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4">

                  <Alert className="bg-green-100 border-green-300">
                    <Sparkles className="h-4 w-4 text-green-700" />
                    <AlertDescription className="text-green-800 font-medium">
                      {proUserMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              }
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4 sm:mb-6">

              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsStudying(false);
                    setSelectedFolder("");
                    loadPageData();
                  }} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700 shrink-0">


                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
                    <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                    <span className="truncate">{selectedFolder}</span>
                  </h1>
                  <p className="text-blue-100 text-sm">
                    {currentIndex + 1} de {flashcards.length} • {sessionStats.correct} acertos
                  </p>
                </div>
              </div>
            </motion.div>

            {error &&
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">

                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-red-800 text-sm">{error}</span>
              </motion.div>
            }

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">

              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl">
                <div className="flex justify-between text-sm text-blue-100 mb-2">
                  <span>Progresso da Sessão</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 sm:h-3 mb-3 sm:mb-4" />

                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {sessionStats.correct} acertos
                  </span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {sessionStats.reviewed} revisados
                  </span>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
                  <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-4 sm:p-6">
                    <div className="flex justify-center gap-2 mb-3 sm:mb-4 flex-wrap">
                      <Badge variant="outline" className="bg-[#0a223b] text-white px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        {currentFlashcard.category || "Geral"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${getDifficultyColor(currentFlashcard.difficulty)} px-2 sm:px-3 py-1 text-xs sm:text-sm`}>

                        {formatDifficulty(currentFlashcard.difficulty)}
                      </Badge>
                      <Badge variant="outline" className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${isNewCard ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`
                      }>
                        {isNewCard ? "NOVO" : "REVISÃO"}
                      </Badge>
                      {currentFlashcard.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />}
                    </div>
                    <CardTitle className="text-lg sm:text-xl text-[#0a223b] leading-tight">
                      {currentFlashcard.question}
                    </CardTitle>
                    {currentFlashcard.image_question &&
                      <img src={currentFlashcard.image_question} alt="Imagem da pergunta" className="mt-4 max-w-full mx-auto rounded-lg" />
                    }
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8 text-center space-y-6 sm:space-y-8">
                    <AnimatePresence mode="wait">
                      {showAnswer ?
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl border border-slate-200">

                          {currentFlashcard.image_answer &&
                            <img src={currentFlashcard.image_answer} alt="Imagem da resposta" className="mb-4 max-w-full mx-auto rounded-lg" />
                          }
                          <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                            {currentFlashcard.answer}
                          </p>

                          <div className="space-y-3 sm:space-y-4">
                            <p className="text-sm font-medium text-slate-600 mb-3 sm:mb-4">
                              Como foi sua resposta?
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <Button
                                onClick={() => handleReviewResponse(1)}
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 h-auto py-2 sm:py-3 px-2 sm:px-4 text-center flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px]">

                                <span className="text-lg">😫</span>
                                <span className="font-semibold text-xs sm:text-sm">ERREI</span>
                                <span className="text-[10px] sm:text-xs opacity-75 leading-tight">
                                  {formatIntervalText(userSettings.interval_wrong)}
                                </span>
                              </Button>
                              <Button
                                onClick={() => handleReviewResponse(2)}
                                variant="outline"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 h-auto py-2 sm:py-3 px-2 sm:px-4 text-center flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px]">

                                <span className="text-lg">😐</span>
                                <span className="font-semibold text-xs sm:text-sm">DIFÍCIL</span>
                                <span className="text-[10px] sm:text-xs opacity-75 leading-tight">
                                  {formatIntervalText(userSettings.interval_doubt)}
                                </span>
                              </Button>
                              <Button
                                onClick={() => handleReviewResponse(3)}
                                variant="outline"
                                className="border-green-200 text-green-600 hover:bg-green-50 h-auto py-2 sm:py-3 px-2 sm:px-4 text-center flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px]">

                                <span className="text-lg">🙂</span>
                                <span className="font-semibold text-xs sm:text-sm">BOM</span>
                                <span className="text-[10px] sm:text-xs opacity-75 leading-tight">
                                  {formatIntervalText(userSettings.interval_correct)}
                                </span>
                              </Button>
                              <Button
                                onClick={() => handleReviewResponse(4)}
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 h-auto py-2 sm:py-3 px-2 sm:px-4 text-center flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px]">

                                <span className="text-lg">😎</span>
                                <span className="font-semibold text-xs sm:text-sm">FÁCIL</span>
                                <span className="text-[10px] sm:text-xs opacity-75 leading-tight">
                                  {formatIntervalText(userSettings.interval_easy)}+
                                </span>
                              </Button>
                            </div>
                          </div>
                        </motion.div> :

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">

                          <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-4" />
                          <p className="text-purple-700 text-lg sm:text-xl mb-4 sm:mb-6">
                            {isNewCard ? "Novo flashcard! Tente responder" : "Pense na resposta antes de revelar"}
                          </p>
                          <Button
                            onClick={toggleAnswer}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">

                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Mostrar Resposta
                          </Button>
                        </motion.div>
                      }
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </>);
  }

  // This is the Deck Selection View
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8">

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-background text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700">


              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
                <FolderKanban className="w-8 h-8 text-blue-400" />
                Estudar por Pasta
              </h1>
              <p className="text-blue-100 text-lg">Selecione uma pasta para iniciar sua revisão.</p>
            </div>
          </motion.div>

          {error &&
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl flex items-center gap-2">

              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </motion.div>
          }

          {decks.length === 0 ?
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>

                <BookOpen className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">Nenhuma pasta para estudar</h3>
              <p className="text-blue-100 mb-6">
                Crie flashcards e organize-os em pastas para começar.
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Create"))}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">

                Criar Flashcards
              </Button>
            </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck, index) =>
                <motion.div
                  key={deck.name}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  transition={{ delay: index * 0.05 }}>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md h-full flex flex-col">
                    <CardHeader className="flex-grow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shrink-0">
                            <FolderOpen className="w-6 h-6 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-[#0a223b] line-clamp-2">
                              {deck.name}
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{deck.totalCards} cards no total</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCustomStudyModalOpen(deck.name)}>

                              <TargetIcon className="w-4 h-4 mr-2" />
                              Estudo Personalizado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{deck.dueCards}</p>
                        <p className="text-sm font-medium text-blue-600">Cards para hoje</p>
                      </div>
                      <Button
                        onClick={() => handleStartStudy(deck.name)}
                        disabled={deck.dueCards === 0}
                        className="w-full h-12 text-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg disabled:bg-gray-300 disabled:from-gray-300">

                        <Brain className="w-5 h-5 mr-2" />
                        {deck.dueCards > 0 ? 'Estudar Agora' : 'Revisado!'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          }

          {/* Custom Study Modal */}
          <CustomStudyModal
            isOpen={showCustomStudyModal}
            onClose={() => setShowCustomStudyModal(false)}
            folderName={selectedFolder}
            onStartCustomStudy={startCustomStudy}
            availableOptions={customStudyOptions} />

        </div>
      </div>
    </TooltipProvider>);
}
