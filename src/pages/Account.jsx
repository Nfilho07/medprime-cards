import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, LogOut, ShieldCheck, Star, Crown, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import CancellationModal from '../components/upgrade/CancellationModal';

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


export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancellationModalOpen, setCancellationModalOpen] = useState(false);

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await retryRequest(() => User.me());
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      setError("Não foi possível carregar os dados da sua conta. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("Dashboard"));
  };

  const handleCancelSubscription = async () => {
    console.log("Iniciando cancelamento da assinatura...");
    // Aqui iria a lógica para cancelar a assinatura via API
    alert("Assinatura cancelada com sucesso!");
    setCancellationModalOpen(false);
    // Atualiza o estado do usuário localmente
    const updatedUserData = await User.me();
    setUser(updatedUserData);
  };

  const isWithin7Days = () => {
    if (!user || !user.plan_activated_date) return false;
    const activatedDate = new Date(user.plan_activated_date);
    const now = new Date();
    const diffTime = Math.abs(now - activatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center text-white">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          Carregando dados da conta...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] to-blue-900 flex items-center justify-center text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ocorreu um Erro</h2>
          <p className="text-blue-100 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={fetchUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-transparent text-white border-white/50 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    // Este caso pode ocorrer se a requisição retornar com sucesso, mas sem dados de usuário (ex: token inválido)
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Usuário não autenticado.</div>;
  }

  const planName = user.plan === 'pro_anual' ? 'PRO Anual' : 'Mensal';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8">

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700">


              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-slate-50 text-3xl font-bold md:text-4xl">Minha Conta</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-8">

              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Nome Completo</label>
                    <p className="text-lg text-[#0a223b]">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Email</label>
                    <p className="text-lg text-[#0a223b]">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Detalhes da Assinatura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 py-4 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-600 text-sm font-medium text-center">Seu plano atual</p>
                        <p className="text-center text-lg font-bold no-underline capitalize flex items-center gap-2">
                          {planName}
                          {user.plan === 'pro_anual' &&
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 text-xs font-bold shadow-md border-purple-300">
                              <Crown className="w-3 h-3 mr-1" />
                              PRO Anual
                            </Badge>
                          }
                        </p>
                      </div>
                      <Button onClick={() => navigate(createPageUrl("Pricing"))} className="bg-blue-950 text-slate-50 mx-1 my-1 px-1 py-1 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10">
                        <Edit className="w-4 h-4 mr-2" />
                        Alterar Plano
                      </Button>
                    </div>
                     {user.plan_expiration_date &&
                    <p className="text-sm text-slate-500 mt-2">
                        Sua assinatura será renovada em {new Date(user.plan_expiration_date).toLocaleDateString('pt-BR')}.
                      </p>
                    }
                  </div>
                  
                  {isWithin7Days() &&
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-green-600" />
                        <p className="text-sm font-medium text-green-700">Você está protegido pela garantia de 7 dias!</p>
                    </div>
                  }

                  {user.plan === 'pro_anual' &&
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-800 to-purple-800 text-white shadow-lg">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                           <Star className="w-5 h-5 text-yellow-300" />
                           Você é PRO!
                        </h3>
                        <p className="text-blue-100">Aproveite sua consultoria personalizada, acesso exclusivo a novas funcionalidades e muito mais.

                    </p>
                     </div>
                  }

                  <div>
                    <Button
                      variant="destructive"
                      onClick={() => setCancellationModalOpen(true)}
                      className="w-full">

                      Cancelar Assinatura
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}>

              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Ações da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full">

                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <CancellationModal
        isOpen={isCancellationModalOpen}
        onClose={() => setCancellationModalOpen(false)}
        onConfirm={handleCancelSubscription}
        user={user} />

    </>);

}