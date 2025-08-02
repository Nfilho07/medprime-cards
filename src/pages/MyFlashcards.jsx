
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flashcard } from "@/api/entities";
import { User } from "@/api/entities";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Brain, Edit, Trash2, Folder, Star, Sparkles, UserSquare, FolderKanban, Crown, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EditFlashcardForm from "../components/myflashcards/EditFlashcardForm";
import FolderManager from "../components/myflashcards/FolderManager";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const FlashcardSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse rounded-xl overflow-hidden">
        <div className="h-16 bg-slate-200/80 w-full"></div>
        <div className="p-2 bg-slate-100/80 space-y-3">
          <div className="h-20 bg-slate-200/80 rounded-lg"></div>
          <div className="h-20 bg-slate-200/80 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function MyFlashcards() {
  const navigate = useNavigate();
  const location = useLocation();
  const loadingRef = useRef(false);
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFlashcardId, setEditingFlashcardId] = useState(null);
  const [isMutating, setIsMutating] = useState(false); // For edit/delete operations
  const [notification, setNotification] = useState({ message: null, type: 'success' });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [location.key]);

  const loadData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      // Usa o wrapper de retry para as requisições críticas
      const userData = await retryRequest(() => User.me());
      setUser(userData);
      const data = await retryRequest(() => Flashcard.filter({ created_by: userData.email }, "-created_date"));
      setFlashcards(data || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar seus flashcards. Verifique sua conexão e tente novamente.");
      setFlashcards([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const groupedFlashcards = useMemo(() => {
    let filtered = showFavoritesOnly ? flashcards.filter((f) => f.is_favorite) : flashcards;

    // Filtrar apenas cards que têm pasta definida (não nulos, não vazios, não apenas espaços)
    filtered = filtered.filter((card) => card.folder && card.folder.trim() !== "");

    console.log("Flashcards filtrados por pasta:", filtered.map((f) => ({ id: f.id, folder: f.folder })));

    const groups = filtered.reduce((acc, card) => {
      const folderName = card.folder.trim(); // Remove espaços extras
      if (!acc[folderName]) {
        acc[folderName] = [];
      }
      acc[folderName].push(card);
      return acc;
    }, {});

    console.log("Grupos de pastas criados:", Object.keys(groups));

    const sortedFolders = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    const sortedGroupedFlashcards = {};
    for (const folder of sortedFolders) {
      sortedGroupedFlashcards[folder] = groups[folder];
    }
    return sortedGroupedFlashcards;
  }, [flashcards, showFavoritesOnly]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: null, type: 'success' }), 3000);
  };

  const loadMyFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await User.me();
      const data = await Flashcard.filter({ created_by: user.email }, "-created_date");
      setFlashcards(data || []);
    } catch (err) {
      console.error("Erro ao carregar flashcards:", err);
      setError("Não foi possível recarregar seus flashcards. Por favor, tente novamente.");
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este flashcard?")) {
      setIsMutating(true);
      try {
        await Flashcard.delete(id);
        showNotification("Flashcard excluído com sucesso!");
        await loadMyFlashcards(); // Re-fetch data to ensure consistency
      } catch (error) {
        console.error("Erro ao excluir flashcard:", error);
        showNotification("Erro ao excluir. Tente novamente.", "error");
      } finally {
        setIsMutating(false);
      }
    }
  };

  const handleUpdate = async (id, data) => {
    setIsMutating(true);
    try {
      await Flashcard.update(id, data);
      showNotification("Flashcard atualizado com sucesso!");
      setEditingFlashcardId(null);
      await loadMyFlashcards(); // Re-fetch data to show the latest version
    } catch (error) {
      console.error("Erro ao atualizar flashcard:", error);
      showNotification("Erro ao atualizar. Tente novamente.", "error");
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleFavorite = async (flashcard) => {
    try {
      setFlashcards((prev) => prev.map((card) =>
        card.id === flashcard.id ? { ...card, is_favorite: !flashcard.is_favorite } : card
      ));
      await Flashcard.update(flashcard.id, { is_favorite: !flashcard.is_favorite });
      showNotification(`Flashcard ${flashcard.is_favorite ? 'removido dos' : 'adicionado aos'} favoritos!`);
    } catch (error) {
      console.error("Erro ao favoritar flashcard:", error);
      loadMyFlashcards();
      showNotification("Erro ao favoritar. Tente novamente.", "error");
    }
  };

  const handleRenameFolder = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName) {
      setIsFolderManagerOpen(false);
      return;
    }

    showNotification(`Renomeando pasta de "${oldName}" para "${newName}"...`);
    setIsMutating(true);
    try {
      const cardsToUpdate = await Flashcard.filter({ folder: oldName });
      const updates = cardsToUpdate.map((card) => Flashcard.update(card.id, { folder: newName.trim() }));
      await Promise.all(updates);
      showNotification("Pasta renomeada com sucesso!");
      loadMyFlashcards();
    } catch (error) {
      console.error("Erro ao renomear pasta:", error);
      showNotification("Erro ao renomear a pasta.", "error");
    } finally {
      setIsMutating(false);
      setIsFolderManagerOpen(false);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (window.confirm(`Tem certeza que deseja excluir a pasta "${folderName}"? Os flashcards dentro dela ficarão sem pasta e não serão mais visíveis aqui.`)) {
      showNotification(`Excluindo pasta "${folderName}"...`);
      setIsMutating(true);
      try {
        const cardsToUpdate = await Flashcard.filter({ folder: folderName });
        // Set folder to an empty string instead of null for better database compatibility
        const updates = cardsToUpdate.map((card) => Flashcard.update(card.id, { folder: '' }));
        await Promise.all(updates);
        showNotification("Pasta excluída com sucesso! Os cards foram movidos para 'Sem Pasta'.");
        loadMyFlashcards();
      } catch (error) {
        console.error("Erro ao excluir pasta:", error);
        showNotification("Erro ao excluir a pasta.", "error");
      } finally {
        setIsMutating(false);
        setIsFolderManagerOpen(false);
      }
    }
  };

  if (error) {
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
            onClick={loadData}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-slate-200/80 rounded-md animate-pulse"></div>
                <div>
                    <div className="h-8 w-64 bg-slate-200/80 rounded animate-pulse"></div>
                    <div className="h-4 w-48 bg-slate-200/80 rounded mt-2 animate-pulse"></div>
                </div>
            </motion.div>
            <FlashcardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
          <AnimatePresence>
            {notification.message && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl font-medium ${
                  notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'
                } text-white`}
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  {notification.message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* This error display block is now redundant because of the new `if (error)` block above,
              but keeping it for clarity as per previous structure if no full-page error was intended.
              However, the outline implies the full-page error replaces this. */}
          {/* {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500 text-white p-4 rounded-lg shadow-md mb-8 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )} */}
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700 hover:border-slate-500"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <UserSquare className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  Meus Flashcards
                </h1>
                <p className="text-blue-100 text-lg">Gerencie e estude seu conteúdo</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <div className="bg-white/10 px-1 py-1 flex items-center space-x-2 backdrop-blur-md rounded-full border border-white/20">
                <Switch id="favorites-only" checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} />
                <Label htmlFor="favorites-only" className="flex items-center gap-1 text-white font-medium">
                  <Star className="w-4 h-4 text-yellow-400" /> 
                  Apenas Favoritos
                </Label>
              </div>
              <Dialog open={isFolderManagerOpen} onOpenChange={setIsFolderManagerOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-black/80 text-white border-black/80 hover:bg-black" disabled={isMutating}>
                        <FolderKanban className="w-4 h-4 mr-2" />
                        Gerenciar Pastas
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-white rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#0a223b]">Gerenciar Pastas</DialogTitle>
                    </DialogHeader>
                    <FolderManager
                    folders={Object.keys(groupedFlashcards).filter((f) => f !== 'Sem Pasta')}
                    onRename={handleRenameFolder}
                    onDelete={handleDeleteFolder} />
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => navigate(createPageUrl("Study"))}
                disabled={flashcards.length === 0 || isMutating}
                className="bg-black text-white border-black hover:bg-black disabled:opacity-50 disabled:bg-gray-400"
              >
                <Brain className="w-4 h-4 mr-2" />
                Estudar
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Create"))}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                disabled={isMutating}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo
              </Button>
            </div>
          </motion.div>

          {Object.keys(groupedFlashcards).length > 0 ? (
            <Accordion type="multiple" className="w-full space-y-4">
              <AnimatePresence>
                {Object.entries(groupedFlashcards).map(([folderName, cardsInFolder]) => (
                  <motion.div
                    key={folderName}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AccordionItem value={folderName} className="border-none">
                      <AccordionTrigger className="text-lg font-bold hover:no-underline px-6 py-4 bg-gradient-to-r from-white/95 to-slate-50/90 backdrop-blur-md rounded-xl shadow-lg data-[state=open]:rounded-b-none transition-all border-0">
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg"
                          >
                            <Folder className="w-6 h-6 text-blue-600" />
                          </motion.div>
                          <span className="text-[#0a223b]">{folderName}</span>
                          <Badge className="bg-gradient-to-r from-[#0a223b] to-blue-700 text-white shadow-md">
                            {cardsInFolder.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 p-2 bg-gradient-to-br from-slate-50/90 to-white/80 backdrop-blur-md rounded-b-xl shadow-inner border-0">
                        <div className="space-y-4 pt-4">
                          {cardsInFolder.map((flashcard) => (
                            <Card key={flashcard.id} className={`${isMutating ? 'opacity-50 pointer-events-none' : ''}`}>
                              <CardContent className="p-4">
                                {editingFlashcardId === flashcard.id ? (
                                  <EditFlashcardForm
                                    flashcard={flashcard}
                                    onSave={handleUpdate}
                                    onCancel={() => setEditingFlashcardId(null)}
                                    user={user}
                                    isSaving={isMutating} // Pass down the saving state
                                  />
                                ) : (
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      {flashcard.image_question && <img src={flashcard.image_question} alt="Imagem da pergunta" className="max-w-xs rounded-md mb-2" />}
                                      <p className="font-semibold text-slate-800">{flashcard.question}</p>
                                      
                                      {flashcard.image_answer && <img src={flashcard.image_answer} alt="Imagem da resposta" className="max-w-xs rounded-md mt-4 mb-2" />}
                                      <p className="text-slate-600">{flashcard.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                      <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(flashcard)} disabled={isMutating}>
                                        <Star className={`w-5 h-5 transition-colors ${flashcard.is_favorite ? 'text-yellow-500 fill-yellow-400' : 'text-slate-400'}`} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingFlashcardId(flashcard.id)}
                                        disabled={isMutating}
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(flashcard.id)}
                                        disabled={isMutating}
                                      >
                                        {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-600" />}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Accordion>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md">
                <CardContent className="p-12">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <UserSquare className="w-24 h-24 text-slate-300 mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[#0a223b] mb-3">
                    {showFavoritesOnly ? 'Nenhum favorito em pastas' : 'Nenhuma pasta para mostrar'}
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg">
                    {showFavoritesOnly 
                      ? 'Nenhum dos seus flashcards favoritos está organizado em uma pasta.'
                      : 'Crie flashcards e organize-os em pastas para vê-los aqui. Cards sem pasta não são exibidos.'
                    }
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("Create"))}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg px-8 py-3 text-lg"
                    disabled={isMutating}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Flashcard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
