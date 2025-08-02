import React from 'react';
import { motion } from 'framer-motion';

export default function Watermark({ position = 'bottom-right', opacity = 0.12 }) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: opacity }}
      transition={{ duration: 2, delay: 1 }}
      className={`fixed ${getPositionClasses()} z-10 pointer-events-none select-none`}
      style={{ 
        opacity: opacity,
        filter: 'grayscale(10%)'
      }}
    >
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10b52184c_MedPrime_Logo_Transparent.png"
        alt="MedPrime"
        className="h-8 md:h-12 w-auto object-contain mix-blend-multiply dark:mix-blend-screen"
        draggable={false}
      />
    </motion.div>
  );
}