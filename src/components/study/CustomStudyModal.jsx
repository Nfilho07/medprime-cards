import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, FastForward, AlertTriangle, RefreshCcw, X, Target, Shuffle, ListOrdered } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const studyOptionsConfig = {
  review_all: { title: "Revisar todos os cards", icon: RotateCcw },
  new_cards: { title: "Apenas cards novos", icon: FastForward },
  difficult_cards: { title: "Reforçar cards difíceis", icon: AlertTriangle },
  recent_mistakes: { title: "Revisar erros recentes", icon: RefreshCcw }
};

export default function CustomStudyModal({ 
  isOpen, 
  onClose, 
  folderName, 
  onStartCustomStudy,
  availableOptions 
}) {
  const [studyType, setStudyType] = useState("review_all");
  const [count, setCount] = useState(20);
  const [isRandom, setIsRandom] = useState(true);

  const maxAvailable = availableOptions[
    studyType === 'review_all' ? 'total' :
    studyType === 'new_cards' ? 'newCards' :
    studyType === 'difficult_cards' ? 'difficultCards' :
    'recentMistakes'
  ] || 0;

  useEffect(() => {
    if (isOpen) {
        // Reset count when modal opens or filter changes, capped by max available
        const newMax = availableOptions[
            studyType === 'review_all' ? 'total' :
            studyType === 'new_cards' ? 'newCards' :
            studyType === 'difficult_cards' ? 'difficultCards' :
            'recentMistakes'
        ] || 0;
        setCount(Math.min(20, newMax > 0 ? newMax : 20));
    }
  }, [isOpen, studyType, availableOptions]);

  const handleStart = () => {
    const finalCount = Math.min(count, maxAvailable > 0 ? maxAvailable : count);
    onStartCustomStudy({ studyType, count: finalCount, isRandom });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-[#0a223b] flex items-center gap-3">
                    <Target className="w-6 h-6 text-purple-600" />
                    Estudo Personalizado
                  </CardTitle>
                  <p className="text-slate-600 mt-2">
                    Você ativou o Estudo Personalizado! Escolha como deseja revisar agora, sem alterar o seu cronograma principal.
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-slate-700 flex-shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Tipo de Estudo</Label>
                <Select value={studyType} onValueChange={setStudyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de estudo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(studyOptionsConfig).map(([key, { title, icon: Icon }]) => (
                        <SelectItem key={key} value={key} disabled={!availableOptions[
                            key === 'review_all' ? 'total' :
                            key === 'new_cards' ? 'newCards' :
                            key === 'difficult_cards' ? 'difficultCards' :
                            'recentMistakes'
                        ] > 0}>
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4"/>
                                {title} (Disponíveis: {availableOptions[
                                    key === 'review_all' ? 'total' :
                                    key === 'new_cards' ? 'newCards' :
                                    key === 'difficult_cards' ? 'difficultCards' :
                                    'recentMistakes'
                                ] || 0})
                            </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-count" className="font-semibold text-slate-700">Quantidade de Flashcards</Label>
                <Input
                  id="card-count"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={maxAvailable > 0 ? maxAvailable : undefined}
                  disabled={maxAvailable === 0}
                />
                {maxAvailable > 0 && <p className="text-xs text-slate-500">Máximo disponível para este filtro: {maxAvailable}</p>}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                <Label className="font-semibold text-slate-700 flex items-center gap-2">
                  {isRandom ? <Shuffle className="w-4 h-4" /> : <ListOrdered className="w-4 h-4" />}
                  Ordem Aleatória
                </Label>
                <Switch checked={isRandom} onCheckedChange={setIsRandom} />
              </div>
              
              <Button
                onClick={handleStart}
                disabled={maxAvailable === 0}
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                Iniciar Estudo
              </Button>

            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}