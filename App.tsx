import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, AnalysisResult } from './types.ts';
import { analyzeMedia } from './services/geminiService.ts';

// Components mapped to the uploaded source directory
import Hero from './proofy-web-master-main/components/Hero.tsx';
import TrustStrip from './proofy-web-master-main/components/TrustStrip.tsx';
import UploadZone from './proofy-web-master-main/components/UploadZone.tsx';
import HowItWorks from './proofy-web-master-main/components/HowItWorks.tsx';
import AnalysisDeepDive from './proofy-web-master-main/components/AnalysisDeepDive.tsx';
import ResultsPreview from './proofy-web-master-main/components/ResultsPreview.tsx';
import ProcessingScreen from './proofy-web-master-main/components/ProcessingScreen.tsx';
import ResultsScreen from './proofy-web-master-main/components/ResultsScreen.tsx';
import LiveScanner from './proofy-web-master-main/components/LiveScanner.tsx';
import SignalLibrary from './proofy-web-master-main/components/SignalLibrary.tsx';
import BackgroundGraphics from './proofy-web-master-main/components/BackgroundGraphics.tsx';
import HistoryPanel from './proofy-web-master-main/components/HistoryPanel.tsx';
import TextInterrogator from './proofy-web-master-main/components/TextInterrogator.tsx';
import ReverseGrounding from './proofy-web-master-main/components/ReverseGrounding.tsx';
import JudicialReport from './proofy-web-master-main/components/JudicialReport.tsx';
import BatchTriage from './proofy-web-master-main/components/BatchTriage.tsx';
import Sidebar from './proofy-web-master-main/components/Sidebar.tsx';
import Logo from './proofy-web-master-main/components/Logo.tsx';
import FloatingAssistant from './proofy-web-master-main/components/FloatingAssistant.tsx';

import { ZapOff, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Lifted state for Batch Triage persistence
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('proofy_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveToHistory = (result: AnalysisResult) => {
    const newHistory = [result, ...history].slice(0, 15);
    setHistory(newHistory);
    localStorage.setItem('proofy_history', JSON.stringify(newHistory));
  };

  const handleUpload = useCallback(async (file: File) => {
    setCurrentView(View.PROCESSING);
    setError(null);
    const metadata = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type,
      preview: URL.createObjectURL(file)
    };

    try {
      const result = await analyzeMedia(file, metadata);
      setAnalysisResult(result);
      saveToHistory(result);
      setCurrentView(View.RESULTS);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "Error: The system ran into a problem.");
      setCurrentView(View.HOME);
    }
  }, [history]);

  const reset = () => {
    setCurrentView(View.HOME);
    setAnalysisResult(null);
    setError(null);
    // Clear batch state on full reset
    setBatchFiles([]);
    setBatchResults([]);
    setIsBatchMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-charcoal text-white flex flex-col selection:bg-neon selection:text-charcoal font-sans relative">
      <BackgroundGraphics />

      {currentView === View.HOME && (
        <header className="fixed top-0 inset-x-0 h-24 z-[50] px-10 flex items-center justify-between print:hidden">
          <button
            onClick={() => setSidebarExpanded(true)}
            className="pointer-events-auto flex items-center justify-center group bg-white/10 backdrop-blur-3xl w-14 h-14 rounded-[1.25rem] border border-white/5 hover:border-neon transition-all shadow-xl"
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-6 h-[2.5px] bg-white group-hover:bg-neon transition-colors rounded-full"></div>
              <div className="w-6 h-[2.5px] bg-white group-hover:bg-neon transition-colors rounded-full"></div>
              <div className="w-3 h-[2.5px] bg-white group-hover:bg-neon transition-colors self-start rounded-full"></div>
            </div>
          </button>
          <Logo size="md" onClick={reset} className="pointer-events-auto hover:scale-105 transition-transform" />
        </header>
      )}

      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onReset={reset}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />

      <main className={`flex-grow container mx-auto px-6 md:px-12 ${currentView === View.HOME ? 'pt-24' : ''} pb-24 max-w-7xl relative z-10`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {currentView === View.HOME && (
              <div className="space-y-40">
                <Hero />
                <TrustStrip />
                <div className="max-w-6xl mx-auto space-y-40">
                  <UploadZone onUpload={handleUpload} />
                  {error && (
                    <div className="p-10 glass border border-danger/20 rounded-[2.5rem] bg-danger/5 text-danger flex items-center gap-6">
                      <ZapOff size={32} />
                      <p className="text-xl italic font-light">{error}</p>
                    </div>
                  )}
                  <HowItWorks />
                  <AnalysisDeepDive />
                  <ResultsPreview />
                </div>
              </div>
            )}

            {currentView === View.PROCESSING && <ProcessingScreen />}
            {currentView === View.RESULTS && analysisResult && (
              <ResultsScreen 
                result={analysisResult} 
                onReupload={reset} 
                onOpenReport={() => setCurrentView(View.JUDICIAL_REPORT)} 
                onOpenTimeline={() => setCurrentView(View.FORENSIC_TIMELINE)} 
                onBack={isBatchMode ? () => setCurrentView(View.BATCH_TRIAGE) : undefined}
              />
            )}
            {currentView === View.BATCH_TRIAGE && (
              <BatchTriage 
                onBack={reset} 
                onResultSelect={(res) => { 
                  setAnalysisResult(res); 
                  setIsBatchMode(true);
                  setCurrentView(View.RESULTS); 
                }} 
                files={batchFiles}
                setFiles={setBatchFiles}
                results={batchResults}
                setResults={setBatchResults}
              />
            )}
            {currentView === View.REVERSE_GROUNDING && <ReverseGrounding onBack={reset} />}
            {currentView === View.TEXT_LAB && <TextInterrogator onBack={reset} />}
            {currentView === View.LIVE && <LiveScanner onBack={reset} onResult={(res) => { setAnalysisResult(res); saveToHistory(res); setCurrentView(View.RESULTS); }} />}
            {currentView === View.HISTORY && <HistoryPanel history={history} onSelect={(res) => { setAnalysisResult(res); setCurrentView(View.RESULTS); }} />}
            {currentView === View.SIGNAL_LIBRARY && <SignalLibrary />}
            {currentView === View.JUDICIAL_REPORT && analysisResult && <JudicialReport result={analysisResult} onBack={() => setCurrentView(View.RESULTS)} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <FloatingAssistant currentView={currentView} analysisResult={analysisResult} />
    </div>
  );
};

export default App;