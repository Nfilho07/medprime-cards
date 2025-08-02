import React, { useState, useEffect } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function EstudoPersonalizado() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const user = await User.me();
      const userFlashcards = await Flashcard.filter({ created_by: user.email });
      
      const folderNames = userFlashcards
        .filter(card => card.folder && card.folder.trim() !== "")
        .map(card => card.folder)
        .filter((folder, index, arr) => arr.indexOf(folder) === index)
        .sort();
      
      setFolders(folderNames);
    } catch (error) {
      console.error("Erro ao carregar pastas:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-purple-100 text-lg">Carregando estudo personalizado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Study"))}
            className="border-slate-300 text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-400" />
              Estudo Personalizado
            </h1>
            <p className="text-purple-100 text-lg">Estude fora do cronograma automático, no seu ritmo.</p>
          </div>
        </motion.div>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0a223b] flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Funcionalidade em Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-24 h-24 text-purple-400 mx-auto mb-6" />
            </motion.div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0a223b]">
                🎯 Estudo Personalizado está chegando!
              </h3>
              <p className="text-slate-600 text-lg">
                Em breve você poderá:
              </p>
              <ul className="text-left text-slate-600 space-y-2 max-w-md mx-auto">
                <li>• Escolher quantos cards revisar</li>
                <li>• Estudar cards difíceis ou errados recentemente</li>
                <li>• Revisar sem afetar seu cronograma automático</li>
                <li>• Usar antes de provas como reforço extra</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-blue-800 font-medium">
                ⚡ Por enquanto, você pode usar a função de "Estudar" normal para revisar seus cards programados.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate(createPageUrl("Study"))}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Ir para Estudo Normal
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}