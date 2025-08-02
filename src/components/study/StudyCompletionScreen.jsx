import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Repeat, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function StudyCompletionScreen({ score, total, timeTaken, onRestart, onBackToDashboard }) {
    // Ensure we have valid numbers
    const validScore = Number(score) || 0;
    const validTotal = Number(total) || 0;
    const validTimeTaken = Number(timeTaken) || 0;
    
    const accuracy = validTotal > 0 ? Math.round((validScore / validTotal) * 100) : 0;

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return "0s";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        let timeString = "";
        if (minutes > 0) timeString += `${minutes}m `;
        if (remainingSeconds > 0 || minutes === 0) timeString += `${remainingSeconds}s`;
        return timeString.trim();
    };

    const getPerformanceMessage = () => {
        if (accuracy >= 90) return { text: "Excelente Desempenho!", color: "text-green-500", emoji: "🏆" };
        if (accuracy >= 70) return { text: "Muito Bom Trabalho!", color: "text-blue-500", emoji: "🎉" };
        if (accuracy >= 50) return { text: "Bom Esforço!", color: "text-yellow-500", emoji: "👍" };
        return { text: "Continue Estudando!", color: "text-orange-500", emoji: "🧠" };
    };
    
    const performance = getPerformanceMessage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-full max-w-lg"
            >
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 text-center py-8">
                        <CardTitle className="text-2xl md:text-3xl font-bold text-green-700 flex items-center justify-center gap-3">
                            <Award className="w-8 h-8"/>
                            Sessão Concluída!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                            className="text-center"
                        >
                            <h3 className={`text-xl font-bold ${performance.color}`}>{performance.emoji} {performance.text}</h3>
                            <p className="text-slate-600 mt-1">Você concluiu sua sessão de estudos na <span translate="no">MedPrime</span>.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Acertos</p>
                                <p className="text-2xl font-bold text-[#0a223b]">{validScore}/{validTotal}</p>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Precisão</p>
                                <p className="text-2xl font-bold text-[#0a223b]">{accuracy}%</p>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Tempo</p>
                                <p className="text-2xl font-bold text-[#0a223b]">{formatTime(validTimeTaken)}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button onClick={onRestart} variant="outline" className="w-full">
                                <Repeat className="w-4 h-4 mr-2" />
                                Estudar Novamente
                            </Button>
                            <Button onClick={onBackToDashboard} className="w-full bg-blue-600 hover:bg-blue-700">
                                <Home className="w-4 h-4 mr-2" />
                                Voltar ao Início
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}