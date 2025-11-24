/**
 * Config Panel Component - Character configuration with tabs
 */

import React, { useState } from 'react';
import { User, Sparkles, Shirt, Smile } from 'lucide-react';
import type { CharacterConfig, Gender, AgeGroupId, AccessoryId } from '../types';
import type { AssetOption } from '../types';
import { SKIN_TONES, EYE_COLORS, HAIR_COLORS, CLOTHING_COLORS } from '../constants';
import { ColorGrid } from './ColorGrid';
import { AssetGrid } from './AssetGrid';
import { AgeSlider } from './AgeSlider';
import { AccessorySelector } from './AccessorySelector';

interface ConfigPanelProps {
  config: CharacterConfig;
  availableHairStyles: AssetOption[];
  availableClothing: AssetOption[];
  onConfigChange: (updates: Partial<CharacterConfig>) => void;
  onGenderChange: (gender: Gender) => void;
}

type TabId = 'identity' | 'hair' | 'wardrobe' | 'extras';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'hair', label: 'Hair', icon: Sparkles },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'extras', label: 'Extras', icon: Smile },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  availableHairStyles,
  availableClothing,
  onConfigChange,
  onGenderChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-2xs text-slate-500 font-medium mb-1.5">{children}</label>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-2xs font-medium transition-all ${
              activeTab === tab.id
                ? 'text-brand-600 border-b-2 border-brand-500 -mb-px'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Identity Tab */}
        {activeTab === 'identity' && (
          <>
            {/* Gender */}
            <div>
              <SectionLabel>Gender</SectionLabel>
              <div className="flex gap-1 p-0.5 bg-slate-100 rounded-md">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => onGenderChange(g)}
                    className={`flex-1 py-1 rounded text-2xs font-bold uppercase tracking-wider transition-all ${
                      config.gender === g
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div>
              <SectionLabel>Age Group</SectionLabel>
              <AgeSlider
                value={config.ageGroup || 'teen'}
                onChange={(age: AgeGroupId) => onConfigChange({ ageGroup: age })}
              />
            </div>

            {/* Skin Tone */}
            <div>
              <SectionLabel>Skin Tone</SectionLabel>
              <ColorGrid
                options={SKIN_TONES}
                selected={config.skinTone}
                onSelect={(v) => onConfigChange({ skinTone: v as CharacterConfig['skinTone'] })}
                size="sm"
              />
            </div>

            {/* Eye Color */}
            <div>
              <SectionLabel>Eye Color</SectionLabel>
              <ColorGrid
                options={EYE_COLORS}
                selected={config.eyeColor}
                onSelect={(v) => onConfigChange({ eyeColor: v as CharacterConfig['eyeColor'] })}
                size="sm"
              />
            </div>
          </>
        )}

        {/* Hair Tab */}
        {activeTab === 'hair' && (
          <>
            {/* Hair Color */}
            <div>
              <SectionLabel>Hair Color</SectionLabel>
              <ColorGrid
                options={HAIR_COLORS}
                selected={config.hairColor}
                onSelect={(v) => onConfigChange({ hairColor: v as CharacterConfig['hairColor'] })}
                size="sm"
              />
            </div>

            {/* Hair Style */}
            <div>
              <SectionLabel>Hair Style</SectionLabel>
              <AssetGrid
                options={availableHairStyles}
                selected={config.hairStyle}
                onSelect={(v) => onConfigChange({ hairStyle: v as CharacterConfig['hairStyle'] })}
              />
            </div>
          </>
        )}

        {/* Wardrobe Tab */}
        {activeTab === 'wardrobe' && (
          <>
            {/* Clothing Color */}
            <div>
              <SectionLabel>Clothing Color</SectionLabel>
              <ColorGrid
                options={CLOTHING_COLORS}
                selected={config.clothingColor}
                onSelect={(v) => onConfigChange({ clothingColor: v as CharacterConfig['clothingColor'] })}
                size="sm"
              />
            </div>

            {/* Clothing Item */}
            <div>
              <SectionLabel>Clothing Style</SectionLabel>
              <AssetGrid
                options={availableClothing}
                selected={config.clothing}
                onSelect={(v) => onConfigChange({ clothing: v as CharacterConfig['clothing'] })}
              />
            </div>
          </>
        )}

        {/* Extras Tab */}
        {activeTab === 'extras' && (
          <>
            {/* Accessories */}
            <div>
              <SectionLabel>Accessories (can select multiple)</SectionLabel>
              <AccessorySelector
                selected={config.accessories}
                onChange={(accessories) => onConfigChange({ accessories: accessories as AccessoryId[] })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
