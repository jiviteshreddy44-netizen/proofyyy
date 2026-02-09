
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProcessingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => (p < 99 ? p + Math.random() * 0.5 : p));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-40 flex flex-col items-center justify-center text-center space-y-12">
      <div className="relative">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[12rem] font-black tracking-tighter italic leading-none text-white tabular-nums"
        >
          {Math.floor(progress)}
        </motion.div>
        <span className="absolute -top-4 -right-12 text-4xl font-black text-white/20 italic">%</span>
      </div>

      <div className="space-y-6 w-full max-w-md">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white shadow-[0_0_20px_white]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[1em] text-white/40 animate-pulse italic">
          Interrogating Neural Layers...
        </p>
      </div>
    </div>
  );
};

export default ProcessingScreen;
