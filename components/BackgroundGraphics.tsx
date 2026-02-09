
import React from 'react';
import { motion } from 'framer-motion';

const BackgroundGraphics: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-grid-forensic opacity-[0.03]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(0,255,156,0.03)_0%,transparent_100%)]"></div>
      
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-neon/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0
          }}
          animate={{ 
            y: ["0%", "100%"],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundGraphics;
