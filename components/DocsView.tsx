import React, { useState } from 'react';
import { Copy, Check, Terminal, Code, Globe, ChevronUp, ChevronDown, Zap, Settings } from 'lucide-react';
import { HAIR_STYLES, CLOTHING_ITEMS, ACCESSORIES, SKIN_TONES, HAIR_COLORS, CLOTHING_COLORS, EYE_COLORS } from '../constants';

export const DocsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'react' | 'react-native' | 'curl'>('react');
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const highlightCode = (code: string, language: string) => {
        // Escape HTML first to prevent XSS and make regex easier
        let safeCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        if (language === 'bash') {
            return safeCode
                .replace(/(curl|npm|install)/g, '<span class="text-pink-400">$1</span>')
                // Only match flags that are preceded by a space or start of line, and not inside a span tag
                .replace(/(?<=^|\s)(-[a-zA-Z]+)/g, '<span class="text-orange-400">$1</span>')
                .replace(/(https?:\/\/[^\s\\]+)/g, '<span class="text-green-400">$1</span>')
                .replace(/('.*?')/g, '<span class="text-green-400">$1</span>');
        }

        // TypeScript/JavaScript
        return safeCode
            .replace(/\b(import|from|const|let|var|async|await|function|return|if|else|new|export|interface|type)\b/g, '<span class="text-pink-400">$1</span>')
            .replace(/\b(true|false)\b/g, '<span class="text-orange-400">$1</span>')
            .replace(/('.*?')/g, '<span class="text-green-400">$1</span>')
            .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
            .replace(/\b(console|log)\b/g, '<span class="text-blue-400">$1</span>')
            .replace(/\b(CharacterForge)\b/g, '<span class="text-yellow-400">$1</span>');
    };

    const CodeBlock = ({ code, language, id }: { code: string, language: string, id: string }) => (
        <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A]">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                <span className="text-xs font-medium text-slate-400">{language}</span>
                <button
                    onClick={() => handleCopy(code, id)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-800"
                >
                    {copied === id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-slate-300 leading-relaxed">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
                </pre>
            </div>
        </div>
    );

    const reactCode = `import { CharacterForge } from 'character-forge';

// 1. Configure the client
const client = new CharacterForge({
  apiKey: 'sk_...'
});

// 2. Best Practice: Check cache first
const generateCharacter = async (config) => {
  // Check local storage (or your DB)
  const cachedUrl = localStorage.getItem('my_character');
  if (cachedUrl) return cachedUrl;

  // 3. Generate if not cached
  const character = await client.generate({
    gender: 'female',
    hairStyle: 'bob',
    hairColor: 'blonde',
    clothing: 'hoodie',
    clothingColor: 'pink',
    skinTone: 'fair',
    eyeColor: 'blue',
    accessories: ['glasses'],
    transparent: true
  });

  // 4. Save for future use
  localStorage.setItem('my_character', character.url);
  return character.url;
};`;

    const reactNativeCode = `import { CharacterForge } from 'character-forge';

// 1. Configure the client
const client = new CharacterForge({
  apiKey: 'sk_...'
});

// 2. Best Practice: Check cache first
const generateCharacter = async (config) => {
  // Check AsyncStorage or DB
  const cached = await AsyncStorage.getItem('user_avatar');
  if (cached) return cached;

  // 3. Generate if not cached
  const character = await client.generate({
    gender: 'male',
    hairStyle: 'undercut',
    hairColor: 'black',
    clothing: 'jacket',
    clothingColor: 'black',
    skinTone: 'medium',
    eyeColor: 'brown',
    accessories: ['earring'],
    transparent: true
  });

  // 4. Save for future use
  await AsyncStorage.setItem('user_avatar', character.url);
  return character.url;
};`;

    const curlCode = `# Generate a character
curl -X POST https://api.characterforge.com/v1/generate \\
  -H "Authorization: Bearer sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "gender": "female",
    "hairStyle": "long_straight",
    "hairColor": "red",
    "clothing": "tshirt",
    "clothingColor": "white",
    "skinTone": "light",
    "eyeColor": "green",
    "accessories": ["hat"],
    "transparent": true
  }'

# Response:
# {
#   "url": "https://api.characterforge.com/assets/...",
#   "id": "gen_123..."
# }

# Recommendation: Download and store the image
# curl -o character.png <url_from_response>`;

    // Import constants (assuming they are available, if not we'll hardcode for now but ideally import)
    // Since we can't easily import in this replace block without seeing imports, I'll define the data structure here
    // and we can refactor to use imports later if needed.

    const configOptions = [
        {
            param: 'gender',
            type: 'string',
            desc: 'Character gender identity',
            options: ['male', 'female']
        },
        {
            param: 'skinTone',
            type: 'string',
            desc: 'Skin complexion',
            options: SKIN_TONES.map(o => o.id)
        },
        {
            param: 'hairStyle',
            type: 'string',
            desc: 'Hair style',
            options: HAIR_STYLES, // Pass full objects
            isAsset: true
        },
        {
            param: 'hairColor',
            type: 'string',
            desc: 'Hair color',
            options: HAIR_COLORS.map(o => o.id)
        },
        {
            param: 'clothing',
            type: 'string',
            desc: 'Outfit type',
            options: CLOTHING_ITEMS, // Pass full objects
            isAsset: true
        },
        {
            param: 'clothingColor',
            type: 'string',
            desc: 'Primary clothing color',
            options: CLOTHING_COLORS.map(o => o.id)
        },
        {
            param: 'eyeColor',
            type: 'string',
            desc: 'Eye color',
            options: EYE_COLORS.map(o => o.id)
        },
        {
            name: 'accessories',
            type: 'Array<string>',
            description: 'Array of accessory IDs',
            options: ACCESSORIES.map(o => o.id)
        },
        {
            param: 'transparent',
            type: 'boolean',
            desc: 'Remove background (returns PNG)',
            options: ['true', 'false']
        }
    ];

    const [expandedRow, setExpandedRow] = useState<string | null>('gender');

    const toggleRow = (param: string) => {
        if (expandedRow === param) {
            setExpandedRow(null);
        } else {
            setExpandedRow(param);
        }
    };

    // New ConfigRow component to encapsulate the row logic
    const ConfigRow: React.FC<{ option: any, renderOptions: (option: any) => React.ReactElement }> = ({ option, renderOptions }) => (
        <React.Fragment key={option.param || option.name}>
            <tr
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === (option.param || option.name) ? 'bg-slate-50' : ''}`}
                onClick={() => toggleRow(option.param || option.name)}
            >
                <td className="p-4 font-mono text-sm text-brand-600 font-medium flex items-center gap-2">
                    {expandedRow === (option.param || option.name) ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    {option.param || option.name}
                </td>
                <td className="p-4 text-sm text-slate-500 font-mono">{option.type}</td>
                <td className="p-4 text-sm text-slate-600">{option.desc || option.description}</td>
            </tr>
            {expandedRow === (option.param || option.name) && (
                <tr className="bg-slate-50/50">
                    <td colSpan={3} className="px-6 pb-4 pt-0">
                        <div className="pl-6 border-l-2 border-brand-200 ml-1.5">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Options</p>
                            {renderOptions(option)}
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );

    const renderOptions = (option: any) => {
        if (option.isAsset) {
            // Group by gender
            const universal = option.options.filter((o: any) => !o.gender);
            const maleSpecific = option.options.filter((o: any) => o.gender === 'male');
            const femaleSpecific = option.options.filter((o: any) => o.gender === 'female');

            const male = [...universal, ...maleSpecific];
            const female = [...universal, ...femaleSpecific];

            return (
                <div className="space-y-4">
                    {female.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Female</p>
                            <div className="flex flex-wrap gap-2">
                                {female.map((opt: any) => (
                                    <code key={opt.id} className="px-2 py-1 bg-pink-50 border border-pink-100 rounded text-xs font-mono text-pink-700" title={opt.label}>
                                        {opt.id}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                    {male.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Male</p>
                            <div className="flex flex-wrap gap-2">
                                {male.map((opt: any) => (
                                    <code key={opt.id} className="px-2 py-1 bg-blue-50 border border-blue-100 rounded text-xs font-mono text-blue-700" title={opt.label}>
                                        {opt.id}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Simple string array
        return (
            <div className="flex flex-wrap gap-2">
                {option.options.map((opt: string) => (
                    <code key={opt} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600">
                        {opt}
                    </code>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Documentation</h1>
                    <p className="text-lg text-slate-600">
                        Complete reference for the CharacterForge API and SDKs.
                    </p>
                </div>
                <a
                    href="https://github.com/character-forge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    <span>View on GitHub</span>
                </a>
            </div>

            {/* Installation */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Terminal size={24} className="text-brand-500" />
                    Installation
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6">
                    <p className="text-slate-600 mb-4">
                        Install the universal JavaScript client. Works with Node.js, React, React Native, and browser environments.
                    </p>
                    <CodeBlock code="npm install character-forge" language="bash" id="install-pkg" />
                </div>
            </section>

            {/* Quick Start */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Zap size={24} className="text-brand-500" />
                    Quick Start
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="border-b border-slate-200 flex">
                        <button
                            onClick={() => setActiveTab('js')}
                            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'js' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            JavaScript / TypeScript
                        </button>
                        <button
                            onClick={() => setActiveTab('curl')}
                            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'curl' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            cURL
                        </button>
                    </div>
                    <div className="p-6 bg-slate-50">
                        {activeTab === 'js' && (
                            <CodeBlock
                                code={`import { CharacterForge } from 'character-forge';

const client = new CharacterForge('YOUR_API_KEY');

// Generate a character
const character = await client.generate({
  gender: 'female',
  skinTone: 'light',
  hairStyle: 'pixie',
  hairColor: 'blonde',
  clothing: 'tshirt',
  clothingColor: 'white',
  eyeColor: 'blue',
  accessories: ['glasses'],
  transparent: true
});

console.log(character.url); // https://api.characterforge.com/v1/assets/...`}
                                language="typescript"
                                id="js-code"
                            />
                        )}
                        {activeTab === 'curl' && <CodeBlock code={curlCode} language="bash" id="curl-code" />}
                    </div>
                </div>
            </section>

            {/* Integration Examples */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Code size={24} className="text-brand-500" />
                    Integration Examples
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* React Native Example */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">React Native</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Use standard React hooks to manage state and display the generated image.
                        </p>
                        <CodeBlock
                            code={`import React, { useState } from 'react';
import { View, Image, Button } from 'react-native';
import { CharacterForge } from 'character-forge';

const client = new CharacterForge('API_KEY');

export default function AvatarCreator() {
  const [imageUrl, setImageUrl] = useState(null);

  const handleGenerate = async () => {
    const char = await client.generate({
      gender: 'male',
      // ... other config
    });
    setImageUrl(char.url);
  };

  return (
    <View>
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: 200, height: 200 }} 
        />
      )}
      <Button title="Generate" onPress={handleGenerate} />
    </View>
  );
}`}
                            language="tsx"
                            id="rn-example"
                        />
                    </div>

                    {/* React Example */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">React</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Similar implementation for web using standard HTML elements.
                        </p>
                        <CodeBlock
                            code={`import React, { useState } from 'react';
import { CharacterForge } from 'character-forge';

const client = new CharacterForge('API_KEY');

export function AvatarCreator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    const char = await client.generate({
      gender: 'female',
      // ... other config
    });
    setImageUrl(char.url);
  };

  return (
    <div>
      {imageUrl && (
        <img src={imageUrl} alt="Character" width={200} />
      )}
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}`}
                            language="tsx"
                            id="react-example"
                        />
                    </div>
                </div>
            </section>

            {/* Configuration Options */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings size={24} className="text-brand-500" />
                    Configuration Options
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-900 text-sm uppercase tracking-wider w-1/4">Parameter</th>
                                <th className="p-4 font-semibold text-slate-900 text-sm uppercase tracking-wider w-1/6">Type</th>
                                <th className="p-4 font-semibold text-slate-900 text-sm uppercase tracking-wider">Description & Options</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {configOptions.map((option: any) => (
                                <ConfigRow key={option.param || option.name} option={option} renderOptions={renderOptions} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Best Practices & Storage */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Code size={24} className="text-brand-500" />
                    Best Practices & Storage
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-8">
                    <div className="prose prose-slate max-w-none mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Caching & Asset Management</h3>
                        <p className="text-slate-600">
                            Character generation is a resource-intensive process. To ensure optimal performance and cost-efficiency,
                            we recommend a "Generate Once, Cache Forever" strategy.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Example 1: Browser Storage */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-mono">Example 1</span>
                                Browser Storage (Temporary)
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                <strong>Warning:</strong> <code>localStorage</code> can be cleared by the user or browser.
                                Use this only for temporary caching or development.
                            </p>
                            <CodeBlock
                                code={`// Check local storage first
const cachedUrl = localStorage.getItem('char_1');
if (cachedUrl) return cachedUrl;

// Generate and save
const char = await client.generate({...});
localStorage.setItem('char_1', char.url);`}
                                language="typescript"
                                id="ex-1"
                            />
                        </div>

                        {/* Example 2: File System */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">Example 2</span>
                                File System (Node.js Backend)
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                For backend apps, save the image directly to your project's assets folder.
                                This ensures the image is part of your deployment.
                            </p>
                            <CodeBlock
                                code={`import fs from 'fs';
import https from 'https';

// Generate character
const char = await client.generate({...});

// Download and save to assets
const file = fs.createWriteStream('./assets/character.png');
https.get(char.url, function(response) {
  response.pipe(file);
});`}
                                language="typescript"
                                id="ex-2"
                            />
                        </div>

                        {/* Example 3: Cloud Storage */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">Example 3</span>
                                Cloud Storage (Production)
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                For production apps, upload to S3, Cloudinary, or Supabase Storage.
                                Store the URL in your database.
                            </p>
                            <CodeBlock
                                code={`// Generate character
const char = await client.generate({...});

// Upload to S3 (pseudo-code)
const response = await fetch(char.url);
const blob = await response.blob();

await s3.upload({
  Bucket: 'my-app-assets',
  Key: 'avatars/user_123.png',
  Body: blob
});`}
                                language="typescript"
                                id="ex-3"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
