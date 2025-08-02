import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Sparkles } from 'lucide-react';

const UpdateChecker = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Guardamos a registration para uso posterior
        setServiceWorkerRegistration(registration);

        // Opcional: Força a verificação de uma nova versão do service worker no servidor
        registration.update();

        // Escuta por uma nova versão do service worker encontrada
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão instalada e pronta para ativar
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });
      
      // Escuta por uma mudança no controller, que acontece após o skipWaiting
      // e recarrega a página para que o novo service worker assuma.
      const handleControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
      // Envia a mensagem para o novo service worker (que está em 'waiting') para ele se ativar.
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <AnimatePresence>
      {isUpdateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
        >
          <div className="p-5 rounded-2xl shadow-2xl bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 border border-blue-700 text-white">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-full">
                <Sparkles className="w-6 h-6 text-purple-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">Nova versão disponível!</h4>
                <p className="text-sm text-blue-200 mb-4">
                  Uma atualização com melhorias e correções está pronta para ser instalada.
                </p>
                <Button 
                  onClick={handleUpdate}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
                >
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Atualizar Agora
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateChecker;