import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Wand2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function TextInput({ inputText, setInputText, onGenerate, isGenerating }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const exampleTexts = [
    "Diabetes mellitus é uma doença metabólica caracterizada por níveis elevados de glicose no sangue. As principais causas incluem deficiência de insulina ou resistência à insulina.",
    "Hipertensão arterial é definida como pressão arterial sistólica ≥140 mmHg ou diastólica ≥90 mmHg. Os fatores de risco incluem idade, obesidade, sedentarismo e consumo excessivo de sal.",
    "Infarto do miocárdio é a necrose do músculo cardíaco causada por obstrução coronariana. Os sintomas incluem dor torácica, sudorese, náusea e dispneia."
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Inserir Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Texto para Análise</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui o conteúdo médico que você deseja transformar em flashcards..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            <p className="text-sm text-slate-500">
              {inputText.length} caracteres
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" />
              Upload .txt
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={onGenerate}
              disabled={!inputText.trim() || isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar Flashcards
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#0a223b] text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Exemplos de Textos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {exampleTexts.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => setInputText(example)}
              >
                <p className="bg-slate-50 text-slate-950 text-sm">{example}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}