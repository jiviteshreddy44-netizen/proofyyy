
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  return (
    <motion.div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]); }}
      className={`max-w-4xl mx-auto glass rounded-[4rem] p-32 border-2 border-dashed flex flex-col items-center gap-12 cursor-pointer transition-all duration-700 ${isDragging ? 'border-neon bg-neon/5 scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}
    >
      <input type="file" ref={fileRef} className="hidden" onChange={handleFile} accept="image/*,video/*" />
      
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 border border-neon/20 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-4 border border-cyber/30 rounded-full animate-reverse-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-neon">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black italic uppercase tracking-tighter">Ingest Signal</h3>
        <p className="text-white/40 italic font-light">Drag & drop or click to upload forensic evidence</p>
      </div>

      <button className="px-12 py-5 bg-white text-charcoal font-black rounded-2xl text-xs uppercase tracking-[0.4em] hover:bg-neon transition-all">
        Access Local Storage
      </button>
      
      <style>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-reverse-spin { animation: reverse-spin 10s linear infinite; }
      `}</style>
    </motion.div>
  );
};

export default UploadZone;
