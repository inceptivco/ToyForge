import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Key, Trash2, Copy, Check, Plus, AlertTriangle } from 'lucide-react';

interface ApiKey {
    id: string;
    label: string;
    created_at: string;
    last_used_at: string | null;
}

export const ApiKeyManager: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [label, setLabel] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        const { data } = await supabase
            .from('api_keys')
            .select('id, label, created_at, last_used_at')
            .order('created_at', { ascending: false });

        if (data) setKeys(data);
        setIsLoading(false);
    };

    const createKey = async () => {
        if (!label.trim()) return;
        setIsCreating(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-api-key', {
                body: { label }
            });

            if (error) throw error;

            setNewKey(data.apiKey);
            fetchKeys();
            setLabel('');
        } catch (err) {
            console.error('Failed to create key:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;

        await supabase.from('api_keys').delete().eq('id', id);
        setKeys(keys.filter(k => k.id !== id));
    };

    const handleCopy = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Key size={20} className="text-brand-500" />
                    API Keys
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Manage keys to access the CharacterForge API programmatically.
                </p>
            </div>

            <div className="p-6">
                {/* Create New Key */}
                <div className="flex gap-3 mb-8">
                    <input
                        type="text"
                        placeholder="Key Label (e.g. My App)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                    <button
                        onClick={createKey}
                        disabled={isCreating || !label.trim()}
                        className="px-6 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isCreating ? 'Creating...' : <><Plus size={18} /> Create Key</>}
                    </button>
                </div>

                {/* New Key Display (Ephemeral) */}
                {newKey && (
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-full text-green-600">
                                <Check size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-green-800 mb-1">Key Created Successfully!</h4>
                                <p className="text-sm text-green-700 mb-3">
                                    Copy this key now. You won't be able to see it again.
                                </p>
                                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-2">
                                    <code className="flex-1 font-mono text-sm text-slate-600 break-all">
                                        {newKey}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 text-xs font-medium transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check size={14} className="text-green-600" />
                                                <span className="text-green-600">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Key List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading keys...</div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No API keys found. Create one to get started.
                        </div>
                    ) : (
                        keys.map(key => (
                            <div key={key.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-800">{key.label}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                                        {key.last_used_at && (
                                            <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                        sk_characterforge_...
                                    </div>
                                    <button
                                        onClick={() => deleteKey(key.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Revoke Key"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
