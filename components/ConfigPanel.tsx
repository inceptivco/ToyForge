
import React, { useMemo } from 'react';
import { CharacterConfig, AssetOption } from '../types';
import {
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  CLOTHING_ITEMS,
  CLOTHING_COLORS,
  ACCESSORIES,
  EYE_COLORS
} from '../constants';
import { Shuffle, RotateCcw, User, Shirt, Sparkles, Wand2, Smile } from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants';

interface ConfigPanelProps {
  config: CharacterConfig;
  onChange: (newConfig: CharacterConfig) => void;
  onGenerate: () => void;
  onRandomize: () => void;
  isGenerating: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  onGenerate,
  onRandomize,
  isGenerating
}) => {

  // Filter assets based on gender
  const availableHairStyles = useMemo(() =>
    HAIR_STYLES.filter(h => !h.gender || h.gender === config.gender),
    [config.gender]
  );

  const availableClothing = useMemo(() =>
    CLOTHING_ITEMS.filter(c => !c.gender || c.gender === config.gender),
    [config.gender]
  );

  const handleChange = (key: keyof CharacterConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const handleGenderChange = (newGender: 'male' | 'female') => {
    // When gender changes, we might need to reset hair or clothing if the current selection isn't valid
    const validHair = HAIR_STYLES.filter(h => !h.gender || h.gender === newGender);
    const validClothes = CLOTHING_ITEMS.filter(c => !c.gender || c.gender === newGender);

    const newHairId = validHair.find(h => h.id === config.hairStyleId) ? config.hairStyleId : validHair[0].id;
    const newClothingId = validClothes.find(c => c.id === config.clothingId) ? config.clothingId : validClothes[0].id;

    onChange({
      ...config,
      gender: newGender,
      hairStyleId: newHairId,
      clothingId: newClothingId
    });
  };

  const SectionTitle = ({ icon: Icon, children }: { icon: any, children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold text-sm uppercase tracking-wide mt-2">
      <Icon size={16} className="text-brand-500" />
      {children}
    </div>
  );

  const ColorGrid = ({
    options,
    selected,
    onSelect
  }: {
    options: any[],
    selected: string,
    onSelect: (val: string) => void
  }) => (
    <div className="flex flex-wrap gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`w-8 h-8 rounded-full shadow-sm transition-all border-2 ${selected === opt.id
            ? 'border-brand-500 scale-110'
            : 'border-transparent hover:scale-105 hover:border-slate-300'
            }`}
          style={{ backgroundColor: opt.hex }}
          title={opt.name}
        />
      ))}
    </div>
  );

  const AssetGrid = ({
    options,
    selected,
    onSelect
  }: {
    options: AssetOption[],
    selected: string,
    onSelect: (val: string) => void
  }) => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`py-2.5 px-3 rounded-lg text-xs font-medium text-left transition-all border ${selected === opt.id
            ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
            : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-base font-bold text-slate-800">Configurator</h2>
        {/* The buttons previously here are moved to the bottom action bar */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

        {/* Identity */}
        <section>
          <SectionTitle icon={User}>Identity</SectionTitle>
          <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => handleGenderChange(g)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${config.gender === g
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-2 block">Skin Tone</label>
            <ColorGrid options={SKIN_TONES} selected={config.skinToneId} onSelect={(v) => handleChange('skinToneId', v)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-2 block">Eye Color</label>
            <ColorGrid options={EYE_COLORS} selected={config.eyeColorId} onSelect={(v) => handleChange('eyeColorId', v)} />
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Hair */}
        <section>
          <SectionTitle icon={Sparkles}>Hair</SectionTitle>
          <ColorGrid options={HAIR_COLORS} selected={config.hairColorId} onSelect={(v) => handleChange('hairColorId', v)} />
          <AssetGrid options={availableHairStyles} selected={config.hairStyleId} onSelect={(v) => handleChange('hairStyleId', v)} />
        </section>

        <hr className="border-slate-100" />

        {/* Outfit */}
        <section>
          <SectionTitle icon={Shirt}>Wardrobe</SectionTitle>
          <ColorGrid options={CLOTHING_COLORS} selected={config.clothingColorId} onSelect={(v) => handleChange('clothingColorId', v)} />
          <AssetGrid options={availableClothing} selected={config.clothingId} onSelect={(v) => handleChange('clothingId', v)} />
        </section>

        <hr className="border-slate-100" />

        {/* Expressions & Extras */}
        <section>
          <SectionTitle icon={Smile}>Extras</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block">Accessory</label>
              <select
                value={config.accessoryId}
                onChange={(e) => handleChange('accessoryId', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
              >
                {ACCESSORIES.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </section>

      </div>

      {/* Generate Action Bar */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3">
        {/* Transparent Background Toggle */}
        <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-sm">Transparent Background</div>
            <div className="text-xs text-slate-500 mt-0.5">Remove background (costs more)</div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={config.transparent !== false}
              onChange={(e) => onChange({ ...config, transparent: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
          </div>
        </label>

        {/* Cache Toggle */}
        <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-sm">Use Cache</div>
            <div className="text-xs text-slate-500 mt-0.5">Faster if config exists</div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={config.cache === true}
              onChange={(e) => onChange({ ...config, cache: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
          </div>
        </label>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all ${isGenerating
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-brand-500 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98]'
            }`}
        >
          <Wand2 size={20} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? 'Sculpting Toy...' : 'Generate Character'}
        </button>
      </div>
    </div>
  );
};
