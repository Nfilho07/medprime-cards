
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Star, ArrowLeft, ShieldCheck, Sparkles, Crown, Gem, Rocket, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { User } from '@/api/entities';
import { Badge } from '@/components/ui/badge';

const PricingCard = ({ plan, isFeatured, onSelectPlan, isLoading }) => {
  const { name, price, yearlyPrice, features, proFeatures, cta, id, subtitle } = plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      className={`relative w-full max-w-sm ${isFeatured ? 'border-4 border-purple-500 shadow-2xl' : 'border-slate-200'}`}>

      <Card className="flex flex-col h-full bg-white/95 backdrop-blur-md border-0 rounded-2xl overflow-hidden">
        {isFeatured &&
        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 text-sm font-bold shadow-lg border-purple-300">
            <Star className="w-4 h-4 mr-2" />
            Mais Popular
          </Badge>
        }
        <CardHeader className="pt-12 pr-8 pb-8 pl-8 flex flex-col space-y-1.5">
          <CardTitle className={`text-3xl font-bold ${isFeatured ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' : 'text-[#0a223b]'}`}>
            {isFeatured ?
            <div className="flex items-center gap-2">
                <Gem className="w-8 h-8 text-purple-600" />
                {name}
              </div> :

            name
            }
          </CardTitle>
          {subtitle &&
          <p className="text-sm text-slate-600 mt-1 font-medium">{subtitle}</p>
          }
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-extrabold text-[#0a223b] tracking-tight">{price}</span>
            <span className="text-xl text-slate-500">/mês</span>
          </div>
          {yearlyPrice &&
          <div className="mt-2">
              <p className="text-slate-500">{yearlyPrice}</p>
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full border border-green-200 mt-2">
                <span className="text-lg">💸</span>
                <span className="font-bold text-sm">Economize 45% no plano anual!</span>
              </div>
            </div>
          }
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-8 pt-0">
          <div className="space-y-4">
            <ul className="space-y-3 text-slate-600">
              {features.map((feature, index) =>
              <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              )}
            </ul>
            {proFeatures &&
            <div className="pt-6">
                <h4 className="text-sm font-semibold uppercase text-purple-600 tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Benefícios PRO Anual Exclusivos
                </h4>
                <ul className="space-y-3 text-slate-600 mt-4">
                  {proFeatures.map((feature, index) => {
                  let icon;
                  if (feature.includes('Consultoria')) {
                    icon = <span className="text-lg">🧑‍🏫</span>;
                  } else if (feature.includes('Acesso antecipado')) {
                    icon = <Rocket className="w-5 h-5 text-blue-500" />;
                  } else if (feature.includes('Selo')) {
                    icon = <Shield className="w-5 h-5 text-purple-500" />;
                  } else {
                    icon = <Crown className="w-5 h-5 text-purple-500" />;
                  }

                  return (
                    <li key={index} className="flex items-start gap-3">
                        {icon}
                        <span className="font-medium">{feature}</span>
                      </li>);

                })}
                </ul>
              </div>
            }
          </div>
          <div className="mt-8">
             <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">Garantia incondicional de 7 dias</p>
            </div>
            <Button
              onClick={() => onSelectPlan(id)}
              disabled={isLoading}
              className={`w-full h-12 text-lg font-bold shadow-xl transition-all duration-300 transform hover:scale-105 ${
              isFeatured ?
              'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' :
              'bg-[#0a223b] hover:bg-blue-900 text-white'}`
              }>

              {isLoading ? 'Aguarde...' : cta}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>);

};

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    User.me().then(setUser).catch(() => console.log("Usuário não logado."));
  }, []);

  const plans = [
  {
    id: 'pro_mensal',
    name: 'Mensal',
    subtitle: 'Ideal para começar',
    price: 'R$19,90',
    features: [
    'Acesso completo ao MedPrime Cards',
    'Criação ilimitada de flashcards',
    'Estudo com repetição espaçada (SRS)',
    'Estatísticas detalhadas de progresso'],

    cta: 'Assinar Plano Mensal'
  },
  {
    id: 'pro_anual',
    name: 'PRO Anual',
    price: 'R$10,82',
    yearlyPrice: 'Cobrado R$129,90 anualmente',
    features: [
    'Todos os benefícios do plano Mensal',
    'Acesso completo sem limitações'],

    proFeatures: [
    'Consultoria de estudos individual via e-mail',
    'Acesso antecipado a novas funcionalidades',
    'Selo "PRO Anual" exclusivo no perfil'],

    cta: 'Assinar Plano PRO Anual',
    isFeatured: true
  }];


  const handleSelectPlan = async (planId) => {
    if (!user) {
      alert("Você precisa estar logado para assinar um plano.");
      return;
    }
    setIsLoading(true);
    // Simulação da chamada de API
    console.log(`Iniciando checkout para o plano: ${planId}`);
    setTimeout(() => {
      // Aqui iria a lógica de redirecionamento para o Stripe
      alert(`Redirecionando para o checkout do plano ${planId === 'pro_anual' ? 'Anual' : 'Mensal'}.`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12">

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700">


            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-4xl text-3xl font-extrabold md:text-5xl tracking-tight">Planos <span translate="no">MedPrime Cards</span></h1>
        </motion.div>

        <motion.p initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-16">

          Escolha o plano ideal para turbinar seus estudos e alcançar a aprovação dos seus sonhos.
        </motion.p>

        <div className="flex flex-col lg:flex-row justify-center items-center lg:items-stretch gap-12">
          {plans.map((plan) =>
          <PricingCard
            key={plan.id}
            plan={plan}
            isFeatured={plan.isFeatured}
            onSelectPlan={handleSelectPlan}
            isLoading={isLoading} />

          )}
        </div>
      </div>
    </div>);

}
