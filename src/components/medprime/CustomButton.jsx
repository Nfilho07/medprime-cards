import React from 'react';
import { Button } from '@/components/ui/button';
import { useMedPrimeTheme } from './ThemeProvider';

export const MedPrimeButton = ({ 
  variant = 'primary', 
  size = 'default',
  children, 
  className = '',
  ...props 
}) => {
  const theme = useMedPrimeTheme();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `medprime-button-primary text-white shadow-lg font-medium`;
      case 'secondary':
        return `border-2 border-[${theme.colors.primary}] text-[${theme.colors.primary}] hover:bg-[${theme.colors.primary}] hover:text-white`;
      case 'accent':
        return `bg-[${theme.colors.accent}] hover:bg-[${theme.colors.accentHover}] text-white`;
      case 'success':
        return `bg-[${theme.colors.success}] hover:bg-green-600 text-white`;
      case 'warning':
        return `bg-[${theme.colors.warning}] hover:bg-yellow-600 text-white`;
      case 'error':
        return `bg-[${theme.colors.error}] hover:bg-red-600 text-white`;
      default:
        return '';
    }
  };
  
  return (
    <Button 
      className={`${getVariantStyles()} transition-all duration-300 ${className}`}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
};

export default MedPrimeButton;