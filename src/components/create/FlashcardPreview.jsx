
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2, Plus, Brain, Copy, Check, Sparkles, AlertCircle, FolderPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLevelForXp } from '@/components/gamification/utils';
import { User } from '@/api/entities';

const FlashcardItem = ({ card, index, onUpdate, onRemove, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(card);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-md overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-[#0a223b] to-blue-700 text-white shadow-md">
              Flashcard #{index + 1}
            </Badge>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onRemove(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Pergunta</label>
            <Textarea
              value={card.question}
              onChange={(e) => onUpdate(index, 'question', e.target.value)}
              className="w-full border-slate-200"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Resposta</label>
            <Textarea
              value={card.answer}
              onChange={(e) => onUpdate(index, 'answer', e.target.value)}
              className="w-full border-slate-200"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Categoria</label>
              <Input
                value={card.category}
                onChange={(e) => onUpdate(index, 'category', e.target.value)}
                className="w-full border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Dificuldade</label>
              <Select
                value={card.difficulty}
                onValueChange={(value) => onUpdate(index, 'difficulty', value)}
              >
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function FlashcardPreview({ flashcards, onSave, onBack, user, isSaving }) {
  const [editableFlashcards, setEditableFlashcards] = useState(flashcards);
  const [folderName, setFolderName] = useState('');
  const [folderError, setFolderError] = useState('');

  const handleUpdateCard = (index, field, value) => {
    const updatedCards = [...editableFlashcards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setEditableFlashcards(updatedCards);
  };

  const handleRemoveCard = (index) => {
    const updatedCards = editableFlashcards.filter((_, i) => i !== index);
    setEditableFlashcards(updatedCards);
  };

  const handleCopyCard = (cardToCopy) => {
    const newCard = { ...cardToCopy };
    setEditableFlashcards(prev => [...prev, newCard]);
  };
  
  const handleSaveAll = () => {
    // Validação local antes de enviar
    if (!folderName.trim()) {
      setFolderError("É obrigatório nomear a pasta para salvar os flashcards.");
      return;
    }
    
    if (editableFlashcards.length === 0) {
      setFolderError("Nenhum flashcard para salvar.");
      return;
    }
    
    // Validação de conteúdo dos flashcards
    const invalidCards = editableFlashcards.filter(card => 
      !card.question?.trim() || !card.answer?.trim()
    );
    
    if (invalidCards.length > 0) {
      setFolderError(`${invalidCards.length} flashcard(s) têm pergunta ou resposta vazia. Por favor, preencha-as.`);
      return;
    }
    
    setFolderError(''); // Clear any previous errors if all validations pass
    
    // Prepara os dados com validação adicional
    const flashcardsToSave = editableFlashcards.map(card => {
      const cleanCard = {
        question: card.question?.trim() || '',
        answer: card.answer?.trim() || '',
        category: card.category?.trim() || 'Geral',
        difficulty: card.difficulty || 'medio',
        folder: folderName.trim(),
        tags: Array.isArray(card.tags) ? card.tags : [],
        times_studied: 0,
        correct_answers: 0,
        review_level: 0,
        ease_factor: 2.5,
        interval: 1,
        interval_unit: 'dias',
        is_favorite: false
      };
      
      return cleanCard;
    });
    
    console.log("Enviando flashcards para salvamento:", flashcardsToSave.length);
    onSave(flashcardsToSave);
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-[#0a223b]">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Flashcards Gerados
              </CardTitle>
              <p className="text-slate-600 mt-2">
                Revise, edite e nomeie a pasta antes de salvar.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving || editableFlashcards.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> 
                    Salvar {editableFlashcards.length} Cards
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Nome da nova pasta (obrigatório)"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (folderError) setFolderError('');
                }}
                disabled={isSaving}
                className={`pl-10 h-12 text-lg ${
                  folderError ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            {folderError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> 
                {folderError}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {editableFlashcards.map((card, index) => (
                <FlashcardItem
                  key={index}
                  card={card}
                  index={index}
                  onUpdate={handleUpdateCard}
                  onRemove={handleRemoveCard}
                  onCopy={handleCopyCard}
                />
              ))}
            </AnimatePresence>
          </div>
          {editableFlashcards.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#0a223b]">Nenhum flashcard para mostrar</h3>
              <p className="text-slate-500 mt-2">Volte e gere novos flashcards a partir do seu texto.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
