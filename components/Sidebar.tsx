
import React from 'react';
import { View } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  expanded: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, expanded, onToggle, onReset }) => {
  const items = [
    { id: View.HOME, label: 'Core Terminal', icon: '◰' },
    { id: View.BATCH_TRIAGE, label: 'Batch Triage', icon: '☰' },
    { id: View.REVERSE_GROUNDING, label: 'Source Origin', icon: '⊕' },
    { id: View.TEXT_LAB, label: 'Text Lab', icon: '⧉' },
    { id: View.HISTORY, label: 'Archives', icon: '↺' },
  ];

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: expanded ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-screen w-80 glass border-r border-white/5 z-[200] p-10 flex flex-col"
      >
        <div className="mb-20 space-y-2" onClick={() => { onReset(); onToggle(); }}>
          <div className="w-12 h-12 bg-neon rounded-2xl flex items-center justify-center text-charcoal font-black text-2xl italic">P</div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">System ID: NODE_01</div>
        </div>

        <nav className="flex-grow space-y-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onToggle(); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${currentView === item.id ? 'bg-white/5 text-neon border border-white/10' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={onToggle}
          className="mt-auto py-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors"
        >
          Close Terminal
        </button>
      </motion.aside>
    </>
  );
};

export default Sidebar;
