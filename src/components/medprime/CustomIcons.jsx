import React from 'react';
import { 
  GraduationCap, 
  Brain, 
  BookOpen, 
  Star, 
  Heart, 
  Zap,
  Target,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Settings,
  Home,
  BarChart3,
  Crown,
  CreditCard
} from 'lucide-react';

// Ícones personalizados do MedPrime
export const MedPrimeIcons = {
  // Navegação
  dashboard: Home,
  create: Plus,
  flashcards: BookOpen,
  review: Calendar,
  stats: BarChart3,
  settings: Settings,
  account: CreditCard,
  
  // Ações
  edit: Edit,
  delete: Trash2,
  favorite: Star,
  heart: Heart,
  view: Eye,
  hide: EyeOff,
  
  // Status
  success: CheckCircle,
  error: XCircle,
  target: Target,
  award: Award,
  crown: Crown,
  trending: TrendingUp,
  
  // Marca
  logo: GraduationCap,
  brain: Brain,
  zap: Zap,
  clock: Clock,
  
  // Customizáveis
  primary: GraduationCap,
  secondary: Brain,
  accent: Zap
};

// Componente de ícone customizável
export const MedPrimeIcon = ({ 
  name = 'logo', 
  size = 'default', 
  color = 'current',
  className = '',
  ...props 
}) => {
  const IconComponent = MedPrimeIcons[name] || MedPrimeIcons.logo;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'w-3 h-3';
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      case 'xl': return 'w-8 h-8';
      case '2xl': return 'w-10 h-10';
      default: return 'w-5 h-5';
    }
  };
  
  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'text-[#0a223b]';
      case 'accent': return 'text-[#10b981]';
      case 'white': return 'text-white';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return '';
    }
  };
  
  return (
    <IconComponent 
      className={`${getSizeClasses()} ${getColorClasses()} ${className}`}
      {...props}
    />
  );
};

export default MedPrimeIcon;