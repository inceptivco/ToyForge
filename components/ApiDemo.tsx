import React, { useState } from 'react';
import { Play, Terminal, Check, Copy } from 'lucide-react';
import { getStorageUrl } from '../utils/storage';

export const ApiDemo: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Fixed values for canned demo
    const gender = 'female';
    const skinTone = 'light';
    const hairStyle = 'bob';
    const clothingColor = 'blue';

    // Fixed response for consistent demo
    const DEMO_RESPONSE = {
        "image": getStorageUrl('demo/example_character.png'),
        "cached": false,
        "transparent": true,
        "credits_remaining": 42,
        "config": {
            gender,
            skinTone: skinTone,
            hairStyle: hairStyle,
            clothingColor: clothingColor
        }
    };

    const sampleCurl = `curl -X POST \${VITE_SUPABASE_URL}/functions/v1/generate-character \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gender": "${gender}",
    "clothingColor": "${clothingColor}"
  }'`;

    const handleRun = () => {
        setIsRunning(true);
        setResponse(null);

        // Simulate network delay with fixed response for canned demo
        setTimeout(() => {
            setResponse(JSON.stringify(DEMO_RESPONSE, null, 2));
            setIsRunning(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(sampleCurl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-slate-800 font-mono text-sm">
            {/* Window Controls */}
            <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="text-slate-500 text-xs">bash — 80x24</div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Column */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <span>Request</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="flex-1 bg-[#1e1e1e] text-blue-400 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                            <span className="text-purple-400">curl</span> -X POST <span className="text-green-400">.../generate-character</span> {'\\'}<br />
                            {'  '}-H <span className="text-orange-400">"Authorization: Bearer KEY"</span> {'\\'}<br />
                            {'  '}-H <span className="text-orange-400">"Content-Type: application/json"</span> {'\\'}<br />
                            {'  '}-d <span className="text-yellow-300">{'\''}{'{'}<br />
                                {'"gender"'}:
                            </span>
                            <span className="text-yellow-300 underline font-bold">
                                "{gender}"
                            </span>
                            <span className="text-yellow-300">,<br />
                                {'"accessories"'}:
                            </span>
                            <span className="text-yellow-300 font-bold">
                                ["none"]
                            </span>
                            <span className="text-yellow-300">,<br />
                                {'"hairStyle"'}:
                            </span>
                            <span className="text-yellow-300 underline font-bold">
                                "{hairStyle}"
                            </span>
                            <span className="text-yellow-300">,<br />
                                {'"clothingColor"'}:
                            </span>
                            <span className="text-yellow-300 underline font-bold">
                                "{clothingColor}"
                            </span>
                            <span className="text-yellow-300"><br />
                                {'}'}{'\''}</span>
                        </pre>
                    </div>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="mt-6 w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-sans font-medium flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play size={16} fill="currentColor" />
                        )}
                        Run Request
                    </button>
                </div>

                {/* Response Column */}
                <div className="border-l border-slate-800 pl-6 flex flex-col">
                    <div className="mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        Response
                    </div>
                    <div className="flex-1 relative min-h-[200px]">
                        {response ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-2 text-green-400 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    200 OK
                                </div>
                                <pre className="text-slate-300 overflow-auto custom-scrollbar">
                                    {response}
                                </pre>
                                {(() => {
                                    try {
                                        const responseData = JSON.parse(response);
                                        return (
                                            <div className="mt-4 p-2 bg-slate-800/50 rounded border border-slate-700/50 inline-block">
                                                <div className="text-[10px] text-slate-500 mb-1">Preview (from URL)</div>
                                                {/* Preview Image */}
                                                <div className="w-24 h-24 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                                                    <img
                                                        src={responseData.image}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    } catch {
                                        return null;
                                    }
                                })()}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <Terminal size={32} className="mb-2 opacity-50" />
                                <p className="font-mono">Waiting for request...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
