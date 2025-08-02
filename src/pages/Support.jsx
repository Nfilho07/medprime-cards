
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Mail, MessageSquarePlus, Lightbulb, Send, Loader2, CheckCircle, Smartphone, Instagram, Globe, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SendEmail } from '@/api/integrations';

export default function Support() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedbackType: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(4000));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.feedbackType || !formData.message) {
      showNotification('Por favor, preencha os campos obrigatórios.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await SendEmail({
        to: 'medprime2026@gmail.com', // Updated email recipient
        subject: `Novo Feedback (${formData.feedbackType}) de ${formData.name || 'Usuário'}`,
        body: `
          <p>Um novo feedback foi enviado através do app <span translate="no">MedPrime Cards</span>.</p>
          <ul>
            <li><strong>Nome:</strong> ${formData.name || 'Não informado'}</li>
            <li><strong>E-mail para Retorno:</strong> ${formData.email}</li>
            <li><strong>Tipo:</strong> ${formData.feedbackType}</li>
          </ul>
          <hr>
          <p><strong>Mensagem:</strong></p>
          <p>${formData.message}</p>
        `
      });
      showNotification('Sua mensagem foi enviada com sucesso! Agradecemos seu contato.', 'success');
      setFormData({ name: '', email: '', feedbackType: '', message: '' });
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      showNotification('Ocorreu um erro ao enviar sua mensagem. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
  { icon: Mail, label: 'E-mail', value: 'medprime2026@gmail.com', href: 'mailto:medprime2026@gmail.com' },
  { icon: Smartphone, label: 'WhatsApp', value: '(63) 985008317 / (38) 998134242', href: '#' },
  { icon: Instagram, label: 'Instagram', value: '@medprime.oficial', href: 'https://instagram.com/medprime.oficial' }];


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence>
          {notification &&
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl text-white font-medium ${
            notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`
            }>

              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {notification.message}
              </div>
            </motion.div>
          }
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8">

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700 hover:border-slate-500">


            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-white text-2xl md:text-4xl font-bold flex items-center gap-3">
              Suporte & Contato
            </h1>
            <p className="text-blue-100 text-lg">Precisa de ajuda? Fale com a gente.</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Quem Somos */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-2xl text-[#0a223b]">
                    <Users className="w-6 h-6 text-blue-600" />
                    Quem Somos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-slate-700 leading-relaxed">
                  <p>
                    O MedPrime é uma plataforma feita por estudantes de medicina apaixonados em estudar e em tecnologia. Nosso objetivo é transformar seu estudo cada vez mais dinâmico, prático e direto.
                  </p>
                  <br />
                  <p>
                    Seja com nossos conhecimentos, dicas, inteligência artificial, queremos ajudar você a aprender com clareza, confiança e constância.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fale Conosco */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-2xl text-[#0a223b]">
                    <Mail className="w-6 h-6 text-purple-600" />
                    Fale Conosco
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {contactInfo.map((item, index) =>
                  <a key={index} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <item.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{item.label}</p>
                        <p className="text-slate-600 group-hover:text-blue-600 transition-colors">{item.value}</p>
                      </div>
                    </a>
                  )}
                  <div className="pt-4 mt-4 border-t border-slate-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Horário de atendimento</p>
                      <p className="text-slate-600">Segunda a sexta, das 8h às 18h (Brasília)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Formulário */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-md overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-3 text-2xl text-[#0a223b]">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  Sugestões ou Reclame Aqui
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Nome (opcional)</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">E-mail para retorno</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedbackType" className="text-slate-700">Tipo de feedback</Label>
                    <Select value={formData.feedbackType} onValueChange={(value) => handleInputChange('feedbackType', value)}>
                      <SelectTrigger id="feedbackType">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sugestão">Sugestão</SelectItem>
                        <SelectItem value="Reclamação">Reclamação</SelectItem>
                        <SelectItem value="Elogio">Elogio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-700">Mensagem</Label>
                    <Textarea id="message" value={formData.message} onChange={(e) => handleInputChange('message', e.target.value)} rows={5} required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-lg py-6 font-bold">
                    {isSubmitting ?
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> :
                    <Send className="w-5 h-5 mr-2" />
                    }
                    Enviar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>);

}
