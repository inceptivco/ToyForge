
import React, { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { ImageDisplay } from './components/ImageDisplay';
import { CharacterConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { generateCharacterPipeline } from './services/geminiService';
import { Box, Download, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setStatusMessage("Initializing...");
    
    try {
      const imageUrl = await generateCharacterPipeline(config, (status) => {
        setStatusMessage(status);
      });
      setGeneratedImage(imageUrl);
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `toy-forge-character-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform rotate-3">
              <Box size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                Toy<span className="text-brand-500">Forge</span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">3D Vinyl Generator</span>
            </div>
          </div>
          
          {generatedImage && (
             <button 
               onClick={handleDownload}
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-md"
             >
               <Download size={16} />
               Save Toy
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7rem)] min-h-[600px]">
          
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-4 flex flex-col h-full">
             <ConfigPanel 
               config={config} 
               onChange={setConfig}
               onGenerate={handleGenerate}
               isGenerating={isLoading}
             />
          </div>

          {/* Right Panel: Preview */}
          <div className="lg:col-span-8 flex flex-col h-full">
             <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 overflow-hidden relative flex flex-col">
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium border border-red-100 flex items-center gap-2 shadow-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                {/* Pass the specific status message to the display */}
                <ImageDisplay imageUrl={generatedImage} isLoading={isLoading} />
                
                {isLoading && (
                   <div className="absolute bottom-8 left-0 right-0 text-center z-20">
                      <span className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-brand-600 shadow-sm border border-brand-100 animate-pulse">
                        {statusMessage}
                      </span>
                   </div>
                )}
             </div>
             <p className="text-center text-xs text-slate-400 mt-3">
                AI-generated preview with automated background removal.
             </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
