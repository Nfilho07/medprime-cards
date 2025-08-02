import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, RotateCcw, Settings as SettingsIcon, Clock, Brain, Lightbulb, Sparkles, Zap, Bell, Smartphone, Lock, Crown, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

// Função utilitária para retry automático
const retryRequest = async (requestFn, retries = 3, delay = 1500) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries) {
        console.error(`A requisição falhou após ${retries + 1} tentativas:`, error);
        throw error;
      }
      
      const nextAttemptIn = delay * Math.pow(1.5, i); // Delay exponencial
      console.warn(`Requisição falhou. Tentando novamente em ${nextAttemptIn}ms... (Tentativa ${i + 1}/${retries})`);
      
      await new Promise(res => setTimeout(res, nextAttemptIn));
    }
  }
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    interval_wrong: { value: 1, unit: 'dias' },
    interval_doubt: { value: 3, unit: 'dias' },
    interval_correct: { value: 6, unit: 'dias' },
    interval_easy: { value: 15, unit: 'dias' }
  });
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    time: "20:00",
    days: ["monday", "wednesday", "friday"],
    minCards: 3,
    permission: "default"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadUserSettings();
    checkNotificationPermission();
  }, []);

  const loadUserSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar retry com configuração mais robusta para Settings
      const userData = await retryRequest(() => User.me(), 3, 2000);
      setUser(userData);

      const defaultInterval = (value, unit) => ({ value, unit });

      const reviewSettings = {
        interval_wrong: userData.review_settings?.interval_wrong ?? defaultInterval(1, 'dias'),
        interval_doubt: userData.review_settings?.interval_doubt ?? defaultInterval(3, 'dias'),
        interval_correct: userData.review_settings?.interval_correct ?? defaultInterval(6, 'dias'),
        interval_easy: userData.review_settings?.interval_easy ?? defaultInterval(15, 'dias')
      };

      setSettings(reviewSettings);

      const notifSettings = {
        enabled: userData.notification_settings?.enabled ?? false,
        time: userData.notification_settings?.time ?? "20:00",
        days: userData.notification_settings?.days ?? ["monday", "wednesday", "friday"],
        minCards: userData.notification_settings?.minCards ?? 3,
        permission: userData.notification_settings?.permission ?? "default"
      };

      setNotificationSettings(notifSettings);
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setError("Não foi possível carregar suas configurações. Verifique sua conexão com a internet.");
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadUserSettings();
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationSettings((prev) => ({ ...prev, permission }));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationSettings((prev) => ({ ...prev, permission }));

        if (permission === 'granted') {
          showNotification("✅ Notificações ativadas com sucesso!", 'success');
          setHasChanges(true);
        } else {
          showNotification("❌ Permissão para notificações negada.", 'error');
        }
      } catch (error) {
        console.error("Erro ao solicitar permissão:", error);
        showNotification("❌ Erro ao solicitar permissão para notificações.", 'error');
      }
    } else {
      showNotification("❌ Seu navegador não suporta notificações.", 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const settingsToSave = {
        interval_wrong: {
          value: parseInt(settings.interval_wrong.value) || 1,
          unit: settings.interval_wrong.unit || 'dias'
        },
        interval_doubt: {
          value: parseInt(settings.interval_doubt.value) || 3,
          unit: settings.interval_doubt.unit || 'dias'
        },
        interval_correct: {
          value: parseInt(settings.interval_correct.value) || 6,
          unit: settings.interval_correct.unit || 'dias'
        },
        interval_easy: {
          value: parseInt(settings.interval_easy.value) || 15,
          unit: settings.interval_easy.unit || 'dias'
        }
      };

      await retryRequest(() => User.updateMyUserData({
        review_settings: settingsToSave,
        notification_settings: notificationSettings
      }), 2, 1000);

      showNotification("✅ Configurações salvas com sucesso!", 'success');
      setHasChanges(false);

    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setError("Erro ao salvar configurações. Verifique sua conexão e tente novamente.");
      showNotification("❌ Erro ao salvar configurações. Tente novamente.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, type, value) => {
    setHasChanges(true);
    if (type === 'value') {
      const numValue = Math.max(1, parseInt(value) || 1);
      setSettings((prev) => ({
        ...prev,
        [field]: { ...prev[field], value: numValue }
      }));
    } else if (type === 'unit') {
      setSettings((prev) => ({
        ...prev,
        [field]: { ...prev[field], unit: value }
      }));
    }
  };

  const handleNotificationChange = (field, value) => {
    setHasChanges(true);
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day) => {
    setHasChanges(true);
    setNotificationSettings((prev) => ({
      ...prev,
      days: prev.days.includes(day) ?
        prev.days.filter((d) => d !== day) :
        [...prev.days, day]
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      interval_wrong: { value: 1, unit: 'dias' },
      interval_doubt: { value: 3, unit: 'dias' },
      interval_correct: { value: 6, unit: 'dias' },
      interval_easy: { value: 15, unit: 'dias' }
    });
    setNotificationSettings({
      enabled: false,
      time: "20:00",
      days: ["monday", "wednesday", "friday"],
      minCards: 3,
      permission: notificationSettings.permission
    });
    setHasChanges(true);
    showNotification("🔄 Configurações restauradas para o padrão", 'info');
  };

  const formatIntervalPreview = (interval) => {
    const { value, unit } = interval;
    if (!value || !unit) return '';
    let unitText;
    switch (unit) {
      case 'minutos':
        unitText = value === 1 ? 'minuto' : 'minutos';
        break;
      case 'horas':
        unitText = value === 1 ? 'hora' : 'horas';
        break;
      case 'dias':
        unitText = value === 1 ? 'dia' : 'dias';
        break;
      default:
        unitText = 'dias';
    }
    return `${value} ${unitText}`;
  };

  const getIntervalColor = (field) => {
    const colors = {
      interval_wrong: 'from-red-500 to-pink-500',
      interval_doubt: 'from-orange-500 to-yellow-500',
      interval_correct: 'from-green-500 to-emerald-500',
      interval_easy: 'from-blue-500 to-indigo-500'
    };
    return colors[field] || 'from-gray-500 to-gray-600';
  };

  const dayLabels = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  // Loading state with error handling
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-2">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"
          />
          <p className="text-slate-600">Carregando suas configurações...</p>
        </motion.div>
      </div>
    );
  }

  // Error state with retry option
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-slate-500 mt-4">
              Tentativas: {retryCount}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 px-2 py-3">
      <div className="max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className={`fixed top-2 left-2 right-2 z-50 p-2 rounded-lg shadow-lg text-white font-medium text-xs ${
                notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span className="text-xs leading-tight">{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRetry}
              className="ml-auto text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentar Novamente
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("Dashboard"))} 
            className="bg-slate-50 text-slate-950 p-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-slate-300 hover:bg-slate-700 hover:border-slate-500 shrink-0">
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <SettingsIcon className="w-8 h-8 text-blue-400" />
              </motion.div>
              Configurações
            </h1>
            <p className="text-blue-100 text-lg">Personalizar estudos</p>
          </div>
        </motion.div>

        {/* Dica Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-start gap-2 md:gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}>
                  <Lightbulb className="w-4 h-4 md:w-6 md:h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm md:text-lg font-bold mb-1 flex items-center gap-1">
                    💡 Dica Importante
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                  </h3>
                  <div className="space-y-1 text-blue-100 text-xs md:text-sm leading-tight">
                    <p><strong>Intervalos menores = mais revisões</strong></p>
                    <p>• <strong>Minutos/horas</strong> para provas</p>
                    <p>• <strong>Dias</strong> para memorização longa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-3 md:space-y-6">
          {/* Notificações */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-2 md:p-4">
              <CardTitle className="flex items-center gap-2 text-sm md:text-lg">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <Bell className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </motion.div>
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6 space-y-3 md:space-y-4">
              {/* Ativar Notificações */}
              <div className="flex items-center justify-between p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Smartphone className="w-3 h-3 md:w-4 md:h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Label className="text-xs md:text-sm font-semibold text-slate-800 block leading-tight">
                      Ativar Notificações
                    </Label>
                    <p className="text-xs md:text-sm text-slate-600 leading-tight">
                      Receber lembretes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.enabled && notificationSettings.permission === 'granted'}
                  onCheckedChange={(checked) => {
                    if (checked && notificationSettings.permission !== 'granted') {
                      requestNotificationPermission();
                    } else {
                      handleNotificationChange('enabled', checked);
                    }
                  }}
                />
              </div>

              {notificationSettings.permission !== 'granted' && notificationSettings.enabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Bell className="w-3 h-3 text-yellow-600" />
                    <span className="font-medium text-yellow-800 text-xs">Permissão Necessária</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2 leading-tight">
                    Permitir no navegador para receber notificações.
                  </p>
                  <Button
                    onClick={requestNotificationPermission}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white w-full text-xs py-1">
                    Ativar Notificações
                  </Button>
                </motion.div>
              )}

              {notificationSettings.enabled && notificationSettings.permission === 'granted' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 md:space-y-3">

                  {/* Horário e Cards */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-slate-700 block mb-1">
                        Horário
                      </Label>
                      <Input
                        type="time"
                        value={notificationSettings.time}
                        onChange={(e) => handleNotificationChange('time', e.target.value)}
                        className="border text-xs md:text-sm h-8 md:h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-slate-700 block mb-1">
                        Min Cards
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={notificationSettings.minCards}
                        onChange={(e) => handleNotificationChange('minCards', parseInt(e.target.value) || 1)}
                        className="border text-xs md:text-sm h-8 md:h-9"
                      />
                    </div>
                  </div>

                  {/* Dias da Semana */}
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-slate-700 block mb-1">
                      Dias da Semana
                    </Label>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {Object.entries(dayLabels).map(([day, label]) => (
                        <Button
                          key={day}
                          variant={notificationSettings.days.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(day)}
                          className={`text-xs md:text-sm px-1.5 py-0.5 h-6 md:h-7 ${
                            notificationSettings.days.includes(day) ?
                            "bg-blue-600 hover:bg-blue-700 text-white" :
                            "border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {label.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Preview da Notificação */}
                  <div className="p-2 md:p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <Label className="text-xs md:text-sm font-medium text-slate-700 block mb-1">
                      Preview:
                    </Label>
                    <div className="bg-white p-2 md:p-3 rounded border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Brain className="w-2 h-2 md:w-3 md:h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs md:text-sm text-slate-800">MedPrime Cards</p>
                          <p className="text-xs md:text-sm text-slate-600 leading-tight">
                            Hora de revisar {notificationSettings.minCards}+ cards 🔁
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Separator className="bg-slate-300" />

          {/* Intervalos de Revisão */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-2 md:p-4">
              <CardTitle className="flex items-center gap-2 text-sm md:text-lg">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </motion.div>
                Intervalos de Revisão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6 space-y-2 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {[
                  {
                    key: 'interval_wrong',
                    emoji: '😫',
                    label: 'ERREI',
                    description: 'Errou totalmente',
                    color: 'from-red-500 to-pink-500',
                    bgColor: 'from-red-50 to-pink-50',
                    borderColor: 'border-red-200'
                  },
                  {
                    key: 'interval_doubt',
                    emoji: '😐',
                    label: 'DIFÍCIL',
                    description: 'Hesitou ou teve dúvidas',
                    color: 'from-orange-500 to-yellow-500',
                    bgColor: 'from-orange-50 to-yellow-50',
                    borderColor: 'border-orange-200'
                  },
                  {
                    key: 'interval_correct',
                    emoji: '🙂',
                    label: 'BOM',
                    description: 'Acertou com esforço',
                    color: 'from-green-500 to-emerald-500',
                    bgColor: 'from-green-50 to-emerald-50',
                    borderColor: 'border-green-200'
                  },
                  {
                    key: 'interval_easy',
                    emoji: '😎',
                    label: 'FÁCIL',
                    description: 'Resposta imediata',
                    color: 'from-blue-500 to-indigo-500',
                    bgColor: 'from-blue-50 to-indigo-50',
                    borderColor: 'border-blue-200'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-2 md:p-4 rounded-lg border ${item.borderColor} bg-gradient-to-br ${item.bgColor} hover:shadow-md transition-all duration-300`}>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="text-lg md:text-xl">
                          {item.emoji}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs md:text-sm font-bold text-slate-800 block leading-tight">
                            {item.label}
                          </Label>
                          <p className="text-xs md:text-sm text-slate-600 leading-tight">{item.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label className="text-xs md:text-sm font-medium text-slate-700 whitespace-nowrap">
                          Revisar em:
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={settings[item.key].value}
                          onChange={(e) => handleInputChange(item.key, 'value', e.target.value)}
                          className="w-12 md:w-16 text-center font-bold border text-xs md:text-sm h-6 md:h-8"
                        />
                        <Select
                          value={settings[item.key].unit}
                          onValueChange={(value) => handleInputChange(item.key, 'unit', value)}>
                          <SelectTrigger className="w-20 md:w-24 border text-xs md:text-sm h-6 md:h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutos">Min</SelectItem>
                            <SelectItem value="horas">Hrs</SelectItem>
                            <SelectItem value="dias">Dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <motion.div
                        className={`p-1.5 md:p-2 rounded bg-gradient-to-r ${item.color} text-white text-center shadow-sm`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="font-semibold text-xs md:text-sm">
                            Próxima: {formatIntervalPreview(settings[item.key])}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-2 md:gap-4 pt-2">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="border border-slate-300 text-slate-700 hover:bg-slate-100 flex-1 font-semibold shadow text-xs md:text-sm py-1.5 md:py-2"
              disabled={isSaving}>
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Restaurar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`flex-1 font-semibold shadow text-xs md:text-sm py-1.5 md:py-2 transition-all duration-300 ${
                hasChanges ?
                'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25' :
                'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}>
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 md:w-4 md:h-4 border border-white border-t-transparent rounded-full mr-1"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {hasChanges ? 'Salvar' : 'Salvo'}
                </>
              )}
            </Button>
          </motion.div>

          {/* Indicador de Mudanças */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center">
                <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}>
                    ⚠️
                  </motion.div>
                  <span className="font-medium text-xs md:text-sm">Alterações não salvas</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}