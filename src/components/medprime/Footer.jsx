import React from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="w-full py-4 px-4 md:px-8 mt-auto"
    >
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs text-slate-400" translate="no">
          Powered by MedPrime
        </p>
      </div>
    </motion.footer>
  );
}