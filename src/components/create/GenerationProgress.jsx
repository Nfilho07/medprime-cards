
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function GenerationProgress({ progress }) {
  const getProgressMessage = () => {
    if (progress < 30) return "Analisando conteúdo...";
    if (progress < 60) return "Identificando conceitos-chave...";
    if (progress < 90) return "Criando perguntas e respostas...";
    return "Finalizando flashcards...";
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Brain className="w-5 h-5 text-purple-600" />
          Gerando Flashcards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-center py-4 md:py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-slate-700 font-medium text-sm md:text-base">
              {getProgressMessage()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Nossa IA está processando seu conteúdo para criar flashcards otimizados para memorização
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
