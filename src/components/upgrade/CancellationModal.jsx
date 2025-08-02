import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

export default function CancellationModal({ isOpen, onClose, onConfirm, user }) {
  if (!isOpen) {
    return null;
  }

  const isWithin7Days = () => {
    if (!user || !user.plan_activated_date) return false;
    // Apenas para usuários Pro
    if (user.plan !== 'pro_mensal' && user.plan !== 'pro_anual') return false;

    const activatedDate = new Date(user.plan_activated_date);
    const now = new Date();
    const diffTime = Math.abs(now - activatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const showRefundMessage = isWithin7Days();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl shadow-2xl p-0">
        <DialogHeader className="p-6 text-center">
          <DialogTitle className="text-2xl font-bold text-slate-900">Deseja mesmo cancelar?</DialogTitle>
          <DialogDescription className="text-slate-500 pt-2">
            Você terá acesso aos recursos Pro até o final do seu período de faturamento.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          {showRefundMessage && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Você está dentro da <strong>garantia de 7 dias!</strong> Ao cancelar, você pode solicitar o reembolso total.
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-500 text-center">
            Seus flashcards e progresso continuarão salvos.
          </p>
        </div>
        <DialogFooter className="bg-slate-50 p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:bg-slate-200">
            Voltar
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}