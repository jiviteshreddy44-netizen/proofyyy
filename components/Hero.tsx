
import React from 'react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <div className="text-center space-y-8 pt-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-3 px-4 py-1.5 glass rounded-full border-neon/20 mb-6"
      >
        <div className="w-2 h-2 bg-neon rounded-full animate-pulse shadow-neon"></div>
        <span className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">Protocol V2.0 Operational</span>
      </motion.div>
      
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
        Real media needs<br />
        <span className="text-neon">Real Proof.</span>
      </h1>
      
      <p className="text-2xl text-white/40 font-light italic max-w-3xl mx-auto leading-relaxed">
        Autonomous neural interrogation of digital assets. Detect deepfakes, verify origin, and audit pixel integrity.
      </p>
    </div>
  );
};

export default Hero;
