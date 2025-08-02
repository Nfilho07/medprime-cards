import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnlockNotification({ achievement, onClose, isVisible }) {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.5, rotateY: -90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotateY: 90, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.6 
            }}
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white max-w-md w-full">
              {/* Efeito de confetes animados */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/80 rounded-full"
                    initial={{
                      x: Math.random() * 400,
                      y: -20,
                      rotate: 0,
                      opacity: 1
                    }}
                    animate={{
                      x: Math.random() * 400,
                      y: 400,
                      rotate: 360,
                      opacity: 0
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>

              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
              >
                <X className="w-4 h-4" />
              </Button>

              <CardContent className="relative p-8 text-center">
                {/* Ícone principal animado */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 10 }}
                  className="relative mb-6"
                >
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <Trophy className="w-12 h-12 text-yellow-200" />
                  </motion.div>

                  {/* Efeito de brilho ao redor */}
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-yellow-300/30 rounded-full"
                  />
                </motion.div>

                {/* Texto da conquista */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-2xl font-bold mb-2">🎉 Conquista Desbloqueada!</h2>
                  <h3 className="text-xl font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-white/90 mb-4">{achievement.description}</p>
                  
                  {/* XP Reward */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-200" />
                    <span className="font-bold">+{achievement.xp_reward} XP</span>
                  </motion.div>
                </motion.div>

                {/* Botão de ação */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6"
                >
                  <Button
                    onClick={onClose}
                    className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-8 py-2"
                  >
                    Incrível!
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}