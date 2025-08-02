
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Target, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CustomStudyCompletionScreen({
  sessionStats,
  studyType,
  folderName,
  onBackToStudy,
  onBackToDashboard
}) {
  const studyTypeLabels = {
    review_all: "🔁 Revisão Completa",
    new_cards: "⏩ Cards Novos",
    difficult_cards: "⚠️ Reforço de Dificuldades",
    recent_mistakes: "🧹 Revisão de Erros"
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-2xl border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 py-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-4"
          >
            <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
          </motion.div>
          <CardTitle className="text-3xl font-bold text-[#0a223b] mb-2">
            ✅ Estudo Personalizado concluído!
          </CardTitle>
          <p className="text-lg text-slate-600">
            <strong>{studyTypeLabels[studyType]}</strong> na pasta "{folderName}"
          </p>
        </CardHeader>
        
        <CardContent className="p-8 text-center space-y-8">
          {/* Estatísticas da Sessão */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">{sessionStats.correct}</div>
              <div className="text-sm text-green-600">Acertos</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-700">{sessionStats.incorrect}</div>
              <div className="text-sm text-red-600">Erros</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
              </div>
              <div className="text-sm text-blue-600">Precisão</div>
            </div>
          </div>

          {/* Aviso sobre não afetar algoritmo */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">ℹ️ Importante lembrar</span>
            </div>
            <p className="text-slate-600">
              Os cards revisados aqui <strong>não foram reagendados</strong> e continuam no seu 
              plano normal de revisão. Esta foi uma sessão extra de reforço!
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4">
            <Button
              onClick={onBackToStudy}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl py-4 text-lg font-semibold"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Voltar ao Estudo Normal
            </Button>
            
            <Button
              variant="outline"
              onClick={onBackToDashboard}
              className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-100 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
