
import React from 'react';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-64 h-64 rounded-full bg-slate-200 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <p className="text-slate-400 font-medium">Generating 3D assets...</p>
          </div>
        ) : imageUrl ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity duration-500" />
            <img 
              src={imageUrl} 
              alt="Generated Vinyl Toy" 
              className="relative max-h-[500px] w-auto rounded-2xl shadow-2xl shadow-slate-200/50 border-4 border-white transition-transform duration-300 group-hover:scale-[1.01]" 
            />
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <div className="w-32 h-32 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
               <span className="text-4xl opacity-20">?</span>
            </div>
            <p className="text-sm">Configure your character<br/>and click Generate</p>
          </div>
        )}
      </div>
      
      {/* Fake branding watermark */}
      <div className="absolute bottom-6 right-6 opacity-20 select-none pointer-events-none">
         <span className="text-4xl font-black tracking-tighter text-slate-900">TOY<span className="text-brand-500">FORGE</span></span>
      </div>
    </div>
  );
};
