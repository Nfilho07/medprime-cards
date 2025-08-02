import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles, CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProFeatureLock({ title, description, featuresList, ctaText }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#0a223b] flex items-center justify-center gap-2">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 p-6">
          <p className="text-slate-600 text-lg leading-relaxed">
            {description}
          </p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            {featuresList.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200 mt-6">
            <p className="text-purple-700 font-semibold text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                {ctaText}
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              className="w-full mt-4 h-12 text-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl"
            >
              <Crown className="w-5 h-5 mr-2" />
              Assinar o plano Pro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}