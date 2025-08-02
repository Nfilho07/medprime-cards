import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useMedPrimeTheme } from './ThemeProvider';

export const MedPrimeCard = ({ 
  title, 
  children, 
  className = '',
  headerClassName = '',
  variant = 'default',
  ...props 
}) => {
  const theme = useMedPrimeTheme();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `bg-gradient-to-br from-[${theme.colors.primary}] to-[${theme.colors.primaryHover}] text-white`;
      case 'glass':
        return `medprime-card backdrop-blur-md`;
      case 'accent':
        return `bg-gradient-to-br from-[${theme.colors.accent}] to-[${theme.colors.accentHover}] text-white`;
      default:
        return `medprime-card`;
    }
  };
  
  return (
    <Card 
      className={`${getVariantStyles()} border-0 shadow-xl transition-all duration-300 hover:shadow-2xl ${className}`}
      {...props}
    >
      {title && (
        <CardHeader className={headerClassName}>
          <CardTitle className="text-xl font-bold tracking-tight">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default MedPrimeCard;