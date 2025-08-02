
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Upload, Image as ImageIcon, Trash2, Loader2, Crown, Folder } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";


const ImageUploader = ({ label, imageUrl, onUpload, onRemove, isUploading, user }) => {
    if (user?.plan === 'gratuito') {
        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-500">{label}</Label>
                <div className="p-3 bg-slate-100 rounded-lg text-sm text-slate-600 border border-slate-200">
                    <Link to={createPageUrl('Pricing')} className="flex items-center gap-2 font-medium text-purple-600 hover:underline">
                        <Crown className="w-4 h-4" />
                        <span>Adicionar Imagens é um recurso Pro. Faça Upgrade!</span>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">{label}</Label>
            {imageUrl ? (
                <div className="relative w-fit">
                    <img src={imageUrl} alt="preview" className="max-w-xs h-auto rounded-md border" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={onRemove}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                     {/* Use a unique ID for the file input, derived from the label */}
                     <Input type="file" id={`upload-image-${label.replace(/\s+/g, '-')}`} accept="image/*" onChange={onUpload} className="hidden" />
                     {/* Link the label to the hidden input using htmlFor */}
                     <Label htmlFor={`upload-image-${label.replace(/\s+/g, '-')}`} className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                         <Upload className="w-4 h-4" />
                         {isUploading ? 'Enviando...' : 'Adicionar Imagem'}
                     </Label>
                     {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
            )}
        </div>
    )
};


export default function EditFlashcardForm({ flashcard, onSave, onCancel, user, isSaving }) {
  const [editedData, setEditedData] = useState({
    question: flashcard.question || "",
    answer: flashcard.answer || "",
    category: flashcard.category || "",
    difficulty: flashcard.difficulty || "medio",
    folder: flashcard.folder || "",
    image_question: flashcard.image_question || null,
    image_answer: flashcard.image_answer || null,
  });
  const [isUploading, setIsUploading] = useState({ question: false, answer: false });

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, field) => {
      const file = e.target.files[0];
      if (!file) return;

      const uploadFieldKey = field === 'image_question' ? 'question' : 'answer';
      setIsUploading(prev => ({ ...prev, [uploadFieldKey]: true }));
      try {
          // Assuming UploadFile is an async function that returns { file_url: string }
          const { file_url } = await UploadFile({ file });
          handleInputChange(field, file_url);
      } catch (error) {
          console.error("Image upload failed:", error);
          alert("Falha no upload da imagem.");
      } finally {
          setIsUploading(prev => ({ ...prev, [uploadFieldKey]: false }));
          // Clear the file input value to allow re-uploading the same file after removal
          e.target.value = '';
      }
  };

  const removeImage = (field) => {
      handleInputChange(field, null);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return; // Prevent submission while saving
    if (!editedData.question.trim() || !editedData.answer.trim()) {
      alert("Pergunta e resposta não podem estar vazias.");
      return;
    }
    
    const finalData = { ...editedData };
    if (user?.plan === 'gratuito' && !finalData.folder?.trim()) {
      finalData.folder = 'Geral';
    }

    if (!finalData.folder?.trim()) {
      alert("⚠️ Por favor, preencha o campo Pasta. É obrigatório.");
      return;
    }
    onSave(flashcard.id, finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="space-y-1">
        <Label htmlFor={`question-${flashcard.id}`}>Pergunta</Label>
        <Textarea
          id={`question-${flashcard.id}`}
          value={editedData.question}
          onChange={(e) => handleInputChange("question", e.target.value)}
          className="min-h-[60px]"
        />
      </div>
      <ImageUploader
        label="Imagem da Pergunta"
        imageUrl={editedData.image_question}
        onUpload={(e) => handleImageUpload(e, 'image_question')}
        onRemove={() => removeImage('image_question')}
        isUploading={isUploading.question}
        user={user}
      />

      <div className="space-y-1">
        <Label htmlFor={`answer-${flashcard.id}`}>Resposta</Label>
        <Textarea
          id={`answer-${flashcard.id}`}
          value={editedData.answer}
          onChange={(e) => handleInputChange("answer", e.target.value)}
          className="min-h-[80px]"
        />
      </div>
       <ImageUploader
        label="Imagem da Resposta"
        imageUrl={editedData.image_answer}
        onUpload={(e) => handleImageUpload(e, 'image_answer')}
        onRemove={() => removeImage('image_answer')}
        isUploading={isUploading.answer}
        user={user}
      />


      <div className="space-y-1">
        <Label htmlFor={`folder-${flashcard.id}`}>Pasta</Label>
        <Input
          id={`folder-${flashcard.id}`}
          value={editedData.folder}
          onChange={(e) => handleInputChange("folder", e.target.value)}
          placeholder="Ex: Cardiologia, Prova 1"
          required
          disabled={user?.plan === 'gratuito'}
          className={user?.plan === 'gratuito' ? 'bg-slate-100 cursor-not-allowed' : ''}
        />
        {user?.plan === 'gratuito' && (
            <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <Crown className="w-3 h-3 text-purple-500" />
                Organização por pastas é um recurso Pro.
            </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor={`category-${flashcard.id}`}>Categoria</Label>
          <Input
            id={`category-${flashcard.id}`}
            value={editedData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`difficulty-${flashcard.id}`}>Dificuldade</Label>
          <Select
            value={editedData.difficulty}
            onValueChange={(value) => handleInputChange("difficulty", value)}
          >
            <SelectTrigger id={`difficulty-${flashcard.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facil">Fácil</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="dificil">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 min-w-[100px]" disabled={isSaving}>
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
