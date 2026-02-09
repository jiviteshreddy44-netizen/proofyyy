
import React from 'react';
import { AnalysisResult, Verdict } from '../types';
import { motion } from 'framer-motion';

interface ResultsScreenProps {
  result: AnalysisResult;
  onReupload: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onReupload }) => {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`lg:col-span-8 p-12 glass rounded-[3rem] border transition-all ${result.verdict === Verdict.REAL ? 'border-emerald-500/20' : 'border-danger/20'}`}>
          <div className="space-y-6">
            <div className={`w-fit px-8 py-3 rounded-2xl border-2 font-black italic uppercase tracking-[0.3em] text-xl ${result.verdict === Verdict.REAL ? 'border-emerald-500 text-emerald-500' : 'border-danger text-danger'}`}>
              {result.verdict}
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Technical Summary</h2>
            <p className="text-xl text-white/60 italic font-light leading-relaxed">{result.summary}</p>
          </div>
        </div>

        <div className="lg:col-span-4 glass rounded-[3rem] p-12 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4">AI PROBABILITY</span>
          <div className="text-9xl font-black italic tracking-tighter text-neon">{result.deepfakeProbability}%</div>
          <p className="text-[11px] font-mono text-white/20 mt-4 uppercase tracking-widest">Confidence: {result.confidence}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {result.explanations.map((exp, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 glass rounded-[2.5rem] space-y-4 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-neon rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{exp.category}</span>
            </div>
            <h4 className="text-lg font-bold italic uppercase tracking-tight">{exp.point}</h4>
            <p className="text-sm text-white/50 leading-relaxed italic font-light">{exp.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-10">
        <button onClick={onReupload} className="px-16 py-6 bg-white text-charcoal font-black rounded-2xl text-xs uppercase tracking-[0.4em] hover:bg-neon transition-all">
          Discard & New Scan
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
