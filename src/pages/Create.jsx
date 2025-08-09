
import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowLeft, Wand2, Sparkles, Brain, Zap, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/api/entities";
import { getLevelForXp } from '@/components/gamification/utils';

// New imports for network error handling and data persistence
import { saveTemporaryData, getTemporaryData, clearTemporaryData } from '../components/network/DataPersistence.jsxxss';
import { useNetwork } from '../components/network/NetworkErrorHandler.js';

import FlashcardPreview from "../components/create/FlashcardPreview";
import GenerationProgress from "../components/create/GenerationProgress";

// Função utilitária para retry automático (fallback if useNetwork is not used or not providing retryWithBackoff)
const retryRequest = async (requestFn, retries = 3, delay = 2000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries) {
        console.error(`A requisição falhou após ${retries + 1} tentativas:`, error);
        throw error;
      }

      const nextAttemptIn = delay * (i + 1); // Exponential backoff for delay
      console.warn(`Requisição falhou. Tentando novamente em ${nextAttemptIn}ms... (Tentativa ${i + 1}/${retries + 1})`);

      await new Promise(res => setTimeout(res, nextAttemptIn));
    }
  }
};

// ID do usuário problemático para logging detalhado
const PROBLEMATIC_USER_ID = '688cfdddb66d2ffc2b1cff40';

// Função de logging específica para o usuário problemático
const logForProblematicUser = (userId, message, data = null) => {
  if (userId === PROBLEMATIC_USER_ID) {
    console.log(`🔍 [USUÁRIO ${PROBLEMATIC_USER_ID}] ${message}`, data || '');
  }
};

export default function Create() {
  const navigate = useNavigate();
  const network = useNetwork(); // Initialize the network error handler hook
  const [inputText, setInputText] = useState("");
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState("input");
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        logForProblematicUser(userData.id, 'Usuário carregado', userData);
      } catch (error) {
        console.log("Usuário não logado ou erro ao carregar.", error);
      }

      // Recuperar dados temporários se existirem
      const tempInputText = getTemporaryData('inputText');
      if (tempInputText) {
        setInputText(tempInputText);
        showNotification("Texto recuperado de uma sessão anterior", "success");
      }

      const tempFlashcards = getTemporaryData('generatedFlashcards');
      if (tempFlashcards && tempFlashcards.length > 0) {
        setGeneratedFlashcards(tempFlashcards);
        setCurrentStep("preview");
        showNotification("Flashcards recuperados de uma sessão anterior", "success");
      }
    };
    loadUserAndData();
  }, []);

  // Auto-save do texto digitado
  useEffect(() => {
    if (inputText.trim()) {
      saveTemporaryData('inputText', inputText);
    } else {
      // Clear if input becomes empty (e.g., user clears it manually)
      clearTemporaryData('inputText');
    }
  }, [inputText]);

  const generateFlashcards = async () => {
    if (!inputText.trim()) {
      setError("Por favor, insira um texto para gerar flashcards");
      return;
    }

    setIsGenerating(true);
    setCurrentStep("generating");
    setError("");
    setGenerationProgress(0);

    try {
      // Progress for LLM part
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const prompt = `Analise o seguinte texto médico e extraia informações para criar flashcards. Regras: - Foque em definições, causas, sintomas, tratamentos e conclusões. - Use perguntas diretas. - Mantenha as respostas concisas. - Identifique a categoria (ex: Cardiologia, Neurologia). - Classifique a dificuldade (facil, medio, dificil). Texto: "${inputText}" Crie entre 5 a 15 flashcards.`;

      const response = await (network?.retryWithBackoff || retryRequest)(() => InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string", enum: ["facil", "medio", "dificil"] },
                  tags: { type: "array", items: { type: "string" } }
                },
                required: ["question", "answer", "category", "difficulty"]
              }
            }
          },
          required: ["flashcards"]
        }
      }));

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setTimeout(() => {
        if (response.flashcards && response.flashcards.length > 0) {
          setGeneratedFlashcards(response.flashcards);
          saveTemporaryData('generatedFlashcards', response.flashcards); // Save generated flashcards temporarily
          setCurrentStep("preview");
        } else {
          setError("Não foi possível gerar flashcards a partir deste texto. Tente com um texto mais detalhado.");
          setCurrentStep("input");
        }
        setIsGenerating(false);
      }, 200);

    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);

      let errorMessage = "Erro de comunicação com a IA. Por favor, tente novamente.";

      if (network?.handleNetworkError) {
        errorMessage = network.handleNetworkError(error, 'generateFlashcards');
      } else if (error.message?.includes('ServerSelectionTimeoutError')) {
        errorMessage = "O sistema de IA está temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }

      setError(errorMessage);
      setCurrentStep("input");
      setIsGenerating(false);
    }
  };

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 5000);
  };

  // Função robusta para salvar flashcards inspirada na sua sugestão
  const saveFlashcardWithRetry = async (flashcardData, maxAttempts = 3) => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Tentativa ${attempts}/${maxAttempts} para salvar flashcard:`, flashcardData.question?.substring(0, 50) + '...');

        logForProblematicUser(user?.id, `Salvando flashcard - Tentativa ${attempts}/${maxAttempts}`, {
          question: flashcardData.question?.substring(0, 50) + '...',
          folder: flashcardData.folder
        });

        // Usar o sistema de retry da network se disponível
        const result = await (network?.retryWithBackoff || retryRequest)(() => Flashcard.create(flashcardData));

        logForProblematicUser(user?.id, `Flashcard salvo com sucesso - Tentativa ${attempts}`, {
          id: result.id
        });

        return result;

      } catch (error) {
        console.error(`Tentativa ${attempts}/${maxAttempts} falhou:`, error.message);

        logForProblematicUser(user?.id, `ERRO na tentativa ${attempts}/${maxAttempts}`, {
          erro: error.message,
          status: error.response?.status,
          flashcard: flashcardData.question?.substring(0, 50) + '...'
        });

        if (attempts >= maxAttempts) {
          // Fallback: salva no localStorage para não perder os dados
          const unsavedKey = `unsaved_flashcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(unsavedKey, JSON.stringify({
            ...flashcardData,
            timestamp: new Date().toISOString(),
            userId: user?.id
          }));

          console.warn('Dados salvos no localStorage como fallback:', unsavedKey);
          throw error; // Re-throw para que o erro seja tratado no nível superior
        }

        // Aguarda antes de tentar novamente (backoff progressivo)
        const delay = 1000 * attempts; // 1s, 2s, 3s...
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const handleSaveFlashcards = async (flashcards) => {
    if (isSaving) return;
    if (!flashcards || flashcards.length === 0) {
      showNotification("Nenhum flashcard para salvar.", "error");
      return;
    }
    if (!user) {
      showNotification("Usuário não encontrado. Faça login novamente.", "error");
      return;
    }

    logForProblematicUser(user.id, 'Iniciando salvamento robusto', { total: flashcards.length });
    setIsSaving(true);
    setError("");

    try {
      const flashcardsToSave = flashcards.map(card => ({
        ...card,
        folder: card.folder?.trim() || card.category?.trim() || 'Geral'
      }));

      const results = [];
      const errors = [];

      for (let i = 0; i < flashcardsToSave.length; i++) {
        try {
          showNotification(`Salvando flashcard ${i + 1}/${flashcardsToSave.length}...`, "info");
          const result = await saveFlashcardWithRetry(flashcardsToSave[i]);
          results.push(result);
        } catch (error) {
          console.error(`Erro definitivo ao salvar flashcard ${i + 1}:`, error);
          errors.push({ index: i, error, flashcard: flashcardsToSave[i] });
        }
      }

      if (errors.length > 0) {
        showNotification(`✅ ${results.length} salvos! ⚠️ ${errors.length} falharam e foram guardados.`, "warning");
        errors.forEach((err, idx) => {
          localStorage.setItem(`failed_flashcard_${Date.now()}_${idx}`, JSON.stringify(err.flashcard));
        });
      } else {
        showNotification(`🎉 Todos os ${results.length} flashcards foram salvos!`, "success");
      }

      if (results.length > 0) {
        clearTemporaryData('inputText');
        clearTemporaryData('generatedFlashcards');
      }

      // Atualizar dados do usuário
      try {
        logForProblematicUser(user.id, 'Iniciando atualização dos dados do usuário');

        const currentUser = await (network?.retryWithBackoff || retryRequest)(() => User.me());
        if (!currentUser) {
          throw new Error("Não foi possível recuperar dados do usuário após salvamento.");
        }

        const xpPerCard = 10;
        const xpGained = xpPerCard * results.length; // Usa apenas os que foram salvos com sucesso
        const newXp = Math.max(0, (currentUser.xp || 0) + xpGained);
        const newLevel = getLevelForXp(newXp);
        const totalCardsCreated = Math.max(0, (currentUser.total_cards_created || 0) + results.length);

        logForProblematicUser(user.id, 'Tentando atualizar dados do usuário', {
          xpAntes: currentUser.xp,
          xpGained,
          newXp,
          newLevel,
          totalCardsCreated
        });

        await (network?.retryWithBackoff || retryRequest)(() => User.updateMyUserData({
          xp: newXp,
          level: newLevel,
          total_cards_created: totalCardsCreated,
        }));

        setUser(prevUser => ({
          ...prevUser,
          xp: newXp,
          level: newLevel,
          total_cards_created: totalCardsCreated
        }));

        logForProblematicUser(user.id, 'Dados do usuário atualizados com sucesso');
        console.log("Dados do usuário atualizados com sucesso");

      } catch (userUpdateError) {
        console.error("Erro ao atualizar dados do usuário:", userUpdateError);
        logForProblematicUser(user.id, 'ERRO ao atualizar dados do usuário', {
          erro: userUpdateError.message,
          status: userUpdateError.response?.status
        });
        showNotification("Flashcards salvos! Porém, houve erro ao atualizar seu progresso.", "warning");
      }

      setTimeout(() => navigate(createPageUrl("Dashboard")), 2000);

    } catch (error) {
      logForProblematicUser(user.id, 'ERRO GERAL no salvamento', { error: error.message });
      let errorMessage = "Erro ao salvar. ";
      const unsavedKeys = Object.keys(localStorage).filter(key => key.startsWith('failed_flashcard_') || key.startsWith('unsaved_flashcard_'));
      if (unsavedKeys.length > 0) {
        errorMessage += `Seus dados foram preservados localmente. Tente novamente ou contate o suporte.`;
      } else {
        errorMessage += "Verifique sua conexão e tente novamente.";
      }
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsSaving(false);
      logForProblematicUser(user?.id, 'Processo de salvamento finalizado');
      console.log("Processo de salvamento finalizado");
    }
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("input");
      setGeneratedFlashcards([]);
      clearTemporaryData('generatedFlashcards'); // Clear temporary flashcards if user goes back
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  // Renderização especial se houver erro persistente
  if (error && error.includes("sistema está temporariamente indisponível")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md text-white"
        >
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sistema Temporariamente Indisponível</h2>
          <p className="text-orange-200 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setError("");
                setCurrentStep("input");
              }}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                setError("");
                setCurrentStep("input");
              }}
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
      <div className="max-w-4xl mx-auto w-full p-2 sm:p-4 md:p-8">

        {/* Notification Toast */}
        <AnimatePresence>
          {notification.message && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl font-medium max-w-md ${
                notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                notification.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                'bg-gradient-to-r from-green-500 to-emerald-600'
              } text-white`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                 notification.type === 'info' ? <Zap className="w-5 h-5" /> :
                 <Sparkles className="w-5 h-5" />}
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">

          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700 hover:border-slate-500 shrink-0">

            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-full">
            <h1 className="text-white text-xl md:text-4xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 responsive-title">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>

                <Wand2 className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
              </motion.div>
              Criar Flashcards
            </h1>
            <p className="text-blue-100 text-sm md:text-lg responsive-text">
              Transforme seu conteúdo em flashcards interativos
            </p>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mb-6">

              <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentStep === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-4 sm:p-6 md:p-8">
                  <CardTitle className="text-lg md:text-2xl font-bold text-[#0a223b] flex items-center gap-3">
                    <Brain className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    Criar Flashcards com IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="space-y-6">
                    <div className="relative">
                      <Textarea
                        placeholder="Cole aqui seu texto de estudo... (ex: resumos, definições, etc.)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[250px] text-sm md:text-base border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl resize-none"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                        {inputText.length} caracteres
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={generateFlashcards}
                        disabled={isGenerating || !inputText.trim()}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 py-3 text-base md:py-4 md:text-lg font-bold disabled:opacity-50"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Gerar Flashcards com IA
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}>

              <GenerationProgress progress={generationProgress} />
            </motion.div>
          )}

          {currentStep === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}>

              <FlashcardPreview
                flashcards={generatedFlashcards}
                onSave={handleSaveFlashcards}
                onBack={() => {
                  setCurrentStep("input");
                  clearTemporaryData('generatedFlashcards'); // Clear if user cancels from preview
                }}
                user={user}
                isSaving={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
