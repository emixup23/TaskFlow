import React, { useState, useMemo } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Upload,
  Trash2,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  X,
  Plus,
  Eye,
  Layers,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  Square,
  SquareDashed
} from 'lucide-react';
import {
  useTheme,
  PRESET_THEMES,
  FONT_FAMILY_MAP,
  RADIUS_MAP,
  TEXT_SIZE_MAP
} from '../context/ThemeContext';
import {
  FontFamilyOption,
  RadiusOption,
  DensityOption,
  TextSizeOption
} from '../types';
import { useTasks } from '../context/TaskContext';

// Vivid Accent Swatches
const ACCENT_SWATCHES = [
  { name: 'Electric Blue', hex: '#3b82f6' },
  { name: 'Sky Cyan', hex: '#0ea5e9' },
  { name: 'Indigo Violet', hex: '#6366f1' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Industrial Amber', hex: '#f59e0b' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Teal Mint', hex: '#14b8a6' },
  { name: 'Bright Orange', hex: '#f97316' },
  { name: 'Cobalt Sapphire', hex: '#2563eb' },
  { name: 'Monochrome Slate', hex: '#64748b' }
];

// Canvas Background Swatches
const BACKGROUND_SWATCHES_DARK = [
  { name: 'Obsidian #0d0d0d', hex: '#0d0d0d', surface: '#141414', border: '#262626' },
  { name: 'Midnight #090d16', hex: '#090d16', surface: '#0f172a', border: '#1e293b' },
  { name: 'Cyberpunk #0c0714', hex: '#0c0714', surface: '#150d24', border: '#2e1c52' },
  { name: 'Matrix #04100c', hex: '#04100c', surface: '#081c16', border: '#133e32' },
  { name: 'Foundry #120f0b', hex: '#120f0b', surface: '#1a1611', border: '#382f23' },
  { name: 'Burgundy #12080d', hex: '#12080d', surface: '#1a0d14', border: '#3b1b2d' },
  { name: 'Pitch OLED #000000', hex: '#000000', surface: '#0a0a0a', border: '#222222' }
];

const BACKGROUND_SWATCHES_LIGHT = [
  { name: 'Slate Light #f8fafc', hex: '#f8fafc', surface: '#ffffff', border: '#e2e8f0' },
  { name: 'Warm Sand #faf7f2', hex: '#faf7f2', surface: '#ffffff', border: '#e6ded3' },
  { name: 'Nordic Frost #f0f4f8', hex: '#f0f4f8', surface: '#ffffff', border: '#cbd5e1' },
  { name: 'Pure White #ffffff', hex: '#ffffff', surface: '#f8fafc', border: '#e4e4e7' }
];

// Calculate color contrast ratio (WCAG formula)
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return Math.round(ratio * 10) / 10;
  } catch {
    return 4.5;
  }
}

export const ThemeEditorModal: React.FC = () => {
  const {
    theme,
    isDark,
    themeConfig,
    activePresetId,
    isThemeEditorOpen,
    allPresets,
    customPresets,
    setTheme,
    setIsThemeEditorOpen,
    applyPreset,
    updateThemeConfig,
    resetToDefaultTheme,
    saveCustomPreset,
    deleteCustomPreset,
    exportThemeJson,
    importThemeJson
  } = useTheme();

  const { addToast } = useTasks();

  const [activeTab, setActiveTab] = useState<'presets' | 'palette' | 'typography' | 'custom'>('presets');
  const [customPresetName, setCustomPresetName] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(65);

  if (!isThemeEditorOpen) return null;

  // Calculate live contrast score
  const contrastRatio = getContrastRatio(themeConfig.primaryColor, themeConfig.backgroundColor);
  const isAccessibleAA = contrastRatio >= 4.5;
  const isAccessibleAAA = contrastRatio >= 7.0;

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) {
      addToast('error', 'Please enter a name for your preset');
      return;
    }
    saveCustomPreset(customPresetName.trim());
    setCustomPresetName('');
    addToast('success', `Theme preset "${customPresetName}" saved!`);
  };

  const handleCopyJson = () => {
    const json = exportThemeJson();
    navigator.clipboard.writeText(json);
    addToast('info', 'Theme JSON copied to clipboard');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const success = importThemeJson(importJsonText);
    if (success) {
      addToast('success', 'Custom theme configuration imported!');
      setIsImporting(false);
      setImportJsonText('');
    } else {
      addToast('error', 'Invalid theme JSON structure. Please check and try again.');
    }
  };

  return (
    <div
      id="theme-editor-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="theme-editor-modal"
        className="bg-[#121212] text-neutral-200 w-full max-w-4xl max-h-[92vh] rounded-lg border border-[#2b2b2b] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#161616] border-b border-[#262626] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Theme & Palette Studio</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold uppercase">
                  {themeConfig.name || 'Custom'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Customize colors, surface contrast, corner radius, and typography with real-time live preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark / Light Switcher */}
            <div className="flex items-center bg-[#202020] border border-[#333333] rounded p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-[#333333] text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#333333] text-blue-400 shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'system' ? 'bg-[#333333] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="System Default"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Borders On/Off Switcher in Header */}
            <button
              type="button"
              id="btn-quick-toggle-borders"
              onClick={() => updateThemeConfig({ borders: !(themeConfig.borders !== false) })}
              className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                themeConfig.borders !== false
                  ? 'bg-[#202020] border-[#333333] text-neutral-300 hover:text-white hover:border-[#444444]'
                  : 'bg-blue-950/40 border-blue-500/50 text-blue-400'
              }`}
              title={themeConfig.borders !== false ? 'Turn borders OFF' : 'Turn borders ON'}
            >
              {themeConfig.borders !== false ? (
                <Square className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <SquareDashed className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="hidden sm:inline">Borders:</span>
              <span className="font-bold">{themeConfig.borders !== false ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              id="btn-close-theme-editor"
              onClick={() => setIsThemeEditorOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#222222] rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-5 bg-[#141414] border-b border-[#262626] flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'presets', label: 'Preset Themes', icon: <Layers className="w-4 h-4" /> },
            { id: 'palette', label: 'Colors & Contrast', icon: <Sliders className="w-4 h-4" /> },
            { id: 'typography', label: 'Borders & Typography', icon: <Type className="w-4 h-4" /> },
            { id: 'custom', label: 'Save & Export JSON', icon: <Bookmark className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`btn-theme-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white bg-blue-500/5'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body & Interactive Preview */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Theme Controls */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* TAB 1: PRESET THEMES */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Curated Themes</h4>
                  <p className="text-xs text-neutral-400">Click any preset to instantly re-theme your TaskFlow workspace.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPresets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    const isCustom = preset.config.isCustom;

                    return (
                      <div
                        key={preset.id}
                        id={`theme-preset-card-${preset.id}`}
                        onClick={() => applyPreset(preset.id)}
                        className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer relative group ${
                          isActive
                            ? 'border-blue-500 bg-[#1e1e1e] shadow-lg ring-1 ring-blue-500/50'
                            : 'border-[#282828] bg-[#161616] hover:border-[#383838] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{preset.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                preset.mode === 'dark'
                                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {preset.badge}
                            </span>
                          </div>

                          {isActive ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomPreset(preset.id);
                                }}
                                className="p-1 text-neutral-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete preset"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-400 mb-3 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Color Swatch Preview Bar */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-[#0e0e0e] rounded border border-[#262626]">
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: preset.config.backgroundColor }}
                            title={`Background: ${preset.config.backgroundColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: preset.config.surfaceColor }}
                            title={`Surface: ${preset.config.surfaceColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: preset.config.primaryColor }}
                            title={`Accent: ${preset.config.primaryColor}`}
                          />
                          <div
                            className="w-5 h-5 rounded border"
                            style={{
                              backgroundColor: preset.config.surfaceSecondaryColor,
                              borderColor: preset.config.borderColor
                            }}
                            title={`Border: ${preset.config.borderColor}`}
                          />
                          <div className="ml-auto text-[10px] text-neutral-400 font-mono">
                            {RADIUS_MAP[preset.config.radius]?.px || '3px'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: COLORS & CONTRAST */}
            {activeTab === 'palette' && (
              <div className="space-y-5">
                {/* Accent Color Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Primary Accent Color
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">{themeConfig.primaryColor}</span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {ACCENT_SWATCHES.map((swatch) => {
                      const isSelected = themeConfig.primaryColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => updateThemeConfig({ primaryColor: swatch.hex, primaryHoverColor: swatch.hex })}
                          className={`h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
                            isSelected ? 'ring-2 ring-white scale-105 shadow-md' : 'hover:scale-105 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Picker Input */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="relative flex-1">
                      <input
                        type="color"
                        value={themeConfig.primaryColor}
                        onChange={(e) => updateThemeConfig({ primaryColor: e.target.value, primaryHoverColor: e.target.value })}
                        className="w-8 h-8 rounded border border-[#333333] cursor-pointer bg-transparent absolute left-1 top-1"
                      />
                      <input
                        type="text"
                        value={themeConfig.primaryColor}
                        onChange={(e) => updateThemeConfig({ primaryColor: e.target.value })}
                        placeholder="#3b82f6"
                        className="w-full pl-12 pr-3 py-1.5 text-xs bg-[#181818] border border-[#333333] rounded text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Canvas Background Color Tone */}
                <div className="space-y-2.5 pt-3 border-t border-[#262626]">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Canvas Background & Surface Tint
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(themeConfig.mode === 'dark' ? BACKGROUND_SWATCHES_DARK : BACKGROUND_SWATCHES_LIGHT).map((bg) => {
                      const isSelected = themeConfig.backgroundColor === bg.hex;
                      return (
                        <button
                          key={bg.hex}
                          type="button"
                          onClick={() =>
                            updateThemeConfig({
                              backgroundColor: bg.hex,
                              surfaceColor: bg.surface,
                              borderColor: bg.border
                            })
                          }
                          className={`p-2 rounded border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-[#222222] shadow-sm'
                              : 'border-[#2e2e2e] bg-[#161616] hover:border-[#444444]'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded border border-neutral-700 shrink-0"
                            style={{ backgroundColor: bg.hex }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-white truncate">{bg.name}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* WCAG Contrast Ratio Checker Gauge */}
                <div className="p-3 bg-[#161616] rounded border border-[#262626] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${
                        isAccessibleAA ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {isAccessibleAA ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">WCAG Color Contrast</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isAccessibleAAA
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : isAccessibleAA
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isAccessibleAAA ? 'AAA Pass' : isAccessibleAA ? 'AA Pass' : 'Caution'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {contrastRatio}:1 ratio between primary accent and canvas background.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-white">{contrastRatio}</span>
                    <span className="text-xs text-neutral-400">:1</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BORDERS & TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="space-y-5">
                {/* 1. Border On / Off Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                      <Square className="w-3.5 h-3.5 text-blue-400" />
                      <span>Interface Borders</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      themeConfig.borders !== false
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}>
                      {themeConfig.borders !== false ? 'Borders ON' : 'Borders OFF (Flat)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      id="theme-borders-on-btn"
                      onClick={() => updateThemeConfig({ borders: true })}
                      className={`p-3 rounded border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        themeConfig.borders !== false
                          ? 'border-blue-500 bg-blue-950/30 text-white shadow-sm'
                          : 'border-[#282828] bg-[#161616] text-neutral-400 hover:border-[#383838] hover:text-neutral-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Square className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Borders On</span>
                          {themeConfig.borders !== false && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                          Outlined cards, panels, tables, and dividers
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="theme-borders-off-btn"
                      onClick={() => updateThemeConfig({ borders: false })}
                      className={`p-3 rounded border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        themeConfig.borders === false
                          ? 'border-blue-500 bg-blue-950/30 text-white shadow-sm'
                          : 'border-[#282828] bg-[#161616] text-neutral-400 hover:border-[#383838] hover:text-neutral-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded border border-dashed border-neutral-600 bg-neutral-800/60 flex items-center justify-center shrink-0">
                        <SquareDashed className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Borders Off</span>
                          {themeConfig.borders === false && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                          Clean borderless surfaces for modern flat aesthetic
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Corner Radius Selection */}
                <div className="space-y-2.5 pt-3 border-t border-[#262626]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Corner Radius (Border-Radius)
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {RADIUS_MAP[themeConfig.radius]?.px || '3px'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {(['sharp', 'precision', 'modern', 'soft', 'round'] as RadiusOption[]).map((r) => {
                      const isSelected = themeConfig.radius === r;
                      const info = RADIUS_MAP[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateThemeConfig({ radius: r, radiusPx: info.px })}
                          className={`p-2.5 rounded border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                              : 'border-[#282828] bg-[#161616] text-neutral-300 hover:border-[#383838]'
                          }`}
                        >
                          <div
                            className="w-6 h-6 border-2 border-blue-400 bg-blue-500/20"
                            style={{ borderRadius: info.px }}
                          />
                          <span className="text-[10px] capitalize">{r}</span>
                          <span className="text-[9px] text-neutral-500 font-mono">{info.px}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Default Text Size Selection */}
                <div className="space-y-2.5 pt-3 border-t border-[#262626]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-blue-400" />
                      <span>Default Text Size</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {TEXT_SIZE_MAP[themeConfig.textSize || 'default']?.label} ({TEXT_SIZE_MAP[themeConfig.textSize || 'default']?.size})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['small', 'default', 'large', 'xl'] as TextSizeOption[]).map((sizeKey) => {
                      const isSelected = (themeConfig.textSize || 'default') === sizeKey;
                      const sizeInfo = TEXT_SIZE_MAP[sizeKey];

                      const sampleSizeClass =
                        sizeKey === 'small'
                          ? 'text-xs'
                          : sizeKey === 'default'
                          ? 'text-sm'
                          : sizeKey === 'large'
                          ? 'text-base font-medium'
                          : 'text-lg font-semibold';

                      return (
                        <button
                          key={sizeKey}
                          type="button"
                          id={`theme-text-size-${sizeKey}-btn`}
                          onClick={() => updateThemeConfig({ textSize: sizeKey })}
                          className={`p-2.5 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/30 text-white shadow-sm'
                              : 'border-[#282828] bg-[#161616] text-neutral-300 hover:border-[#383838]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{sizeInfo.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </div>

                          <div className="h-7 flex items-center">
                            <span className={`text-neutral-200 ${sampleSizeClass}`}>Aa 123</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#262626] text-[10px] text-neutral-400 font-mono">
                            <span>{sizeInfo.size}</span>
                            <span>{sizeInfo.rootFontSize}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Font Family Selection */}
                <div className="space-y-2.5 pt-3 border-t border-[#262626]">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Typography & Font Family
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(FONT_FAMILY_MAP) as FontFamilyOption[]).map((fontKey) => {
                      const isSelected = themeConfig.fontFamily === fontKey;
                      const fontInfo = FONT_FAMILY_MAP[fontKey];

                      return (
                        <button
                          key={fontKey}
                          type="button"
                          onClick={() => updateThemeConfig({ fontFamily: fontKey })}
                          className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                              : 'border-[#282828] bg-[#161616] text-neutral-300 hover:border-[#383838]'
                          }`}
                          style={{ fontFamily: fontInfo.family }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs">{fontInfo.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate opacity-80">
                            The quick brown fox jumps over the lazy dog. 12345
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. UI Density Selector */}
                <div className="space-y-2.5 pt-3 border-t border-[#262626]">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Layout Density
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Compact', desc: 'Maximum information density' },
                      { id: 'standard', label: 'Standard', desc: 'Balanced padding and spacing' },
                      { id: 'relaxed', label: 'Relaxed', desc: 'Spacious touch-friendly layout' }
                    ].map((d) => {
                      const isSelected = themeConfig.density === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => updateThemeConfig({ density: d.id as DensityOption })}
                          className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/30 text-white'
                              : 'border-[#282828] bg-[#161616] text-neutral-300 hover:border-[#383838]'
                          }`}
                        >
                          <p className="text-xs font-bold mb-0.5">{d.label}</p>
                          <p className="text-[10px] text-neutral-400 leading-tight">{d.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAVE & EXPORT JSON */}
            {activeTab === 'custom' && (
              <div className="space-y-5">
                {/* Save As Custom Preset Form */}
                <form onSubmit={handleSavePreset} className="space-y-2.5 p-4 bg-[#161616] rounded border border-[#262626]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Save Current Theme</h4>
                  <p className="text-xs text-neutral-400">Save your current color and radius tweaks as a permanent preset.</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPresetName}
                      onChange={(e) => setCustomPresetName(e.target.value)}
                      placeholder="e.g. Cyber Cobalt, Autumn Dusk..."
                      className="flex-1 px-3 py-1.5 text-xs bg-[#202020] border border-[#333333] rounded text-white placeholder:text-neutral-500"
                    />
                    <button
                      type="submit"
                      disabled={!customPresetName.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      Save Preset
                    </button>
                  </div>
                </form>

                {/* Export / Import Section */}
                <div className="p-4 bg-[#161616] rounded border border-[#262626] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Export / Import Palette JSON</h4>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#202020] hover:bg-[#282828] border border-[#333333] text-xs font-medium text-white rounded transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                      <span>Copy Theme JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsImporting(!isImporting)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#202020] hover:bg-[#282828] border border-[#333333] text-xs font-medium text-white rounded transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Import Theme JSON</span>
                    </button>
                  </div>

                  {isImporting && (
                    <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                      <textarea
                        rows={4}
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder="Paste custom theme JSON config here..."
                        className="w-full p-2.5 text-xs bg-[#0e0e0e] border border-[#333333] rounded text-neutral-200 font-mono"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsImporting(false)}
                          className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleImportSubmit}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Apply Imported Theme
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Section */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetToDefaultTheme();
                      addToast('info', 'Theme reset to Obsidian Dark default');
                    }}
                    className="flex items-center gap-2 text-xs text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to TaskFlow Default Theme</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Live Interactive Component Preview Card */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Live Component Preview</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    themeConfig.borders !== false
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {themeConfig.borders !== false ? 'Borders ON' : 'Borders OFF'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {TEXT_SIZE_MAP[themeConfig.textSize || 'default']?.label} ({TEXT_SIZE_MAP[themeConfig.textSize || 'default']?.size})
                </span>
              </div>
            </div>

            {/* Interactive Mock Workspace Card */}
            <div
              className="p-4 rounded-lg border shadow-xl flex-1 flex flex-col justify-between space-y-4 transition-all duration-200"
              style={{
                backgroundColor: themeConfig.surfaceColor,
                borderColor: themeConfig.borders !== false ? themeConfig.borderColor : 'transparent',
                borderRadius: themeConfig.radiusPx || '3px',
                fontSize: TEXT_SIZE_MAP[themeConfig.textSize || 'default']?.rootFontSize || '100%'
              }}
            >
              {/* Mock Task Card */}
              <div
                className="p-3.5 rounded border shadow-sm space-y-3"
                style={{
                  backgroundColor: themeConfig.surfaceSecondaryColor,
                  borderColor: themeConfig.borders !== false ? themeConfig.borderColor : 'transparent',
                  borderRadius: themeConfig.radiusPx || '3px'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: themeConfig.primaryLightColor || `${themeConfig.primaryColor}26`,
                        color: themeConfig.primaryColor,
                        borderRadius: themeConfig.radiusPx || '3px'
                      }}
                    >
                      In Progress
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">TASK-104</span>
                  </div>

                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeConfig.primaryColor }} />
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white mb-1">
                    Implement WebGL Particle Pipeline
                  </h5>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Optimize compute shaders for high-throughput frame buffers.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Milestone Progress</span>
                    <span className="font-bold text-white">{previewProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#2b2b2b] rounded overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${previewProgress}%`,
                        backgroundColor: themeConfig.primaryColor
                      }}
                    />
                  </div>
                </div>

                {/* Mentions Pill & Avatar */}
                <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5"
                    style={{
                      backgroundColor: themeConfig.primaryLightColor || `${themeConfig.primaryColor}26`,
                      color: themeConfig.primaryColor,
                      borderRadius: themeConfig.radiusPx || '3px'
                    }}
                  >
                    @Sarah Chen
                  </span>

                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Due in 2 days</span>
                  </div>
                </div>
              </div>

              {/* Sample Action Buttons Strip */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Button & Control States</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: themeConfig.primaryColor,
                      borderRadius: themeConfig.radiusPx || '3px'
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Primary Action</span>
                  </button>

                  <button
                    type="button"
                    className="flex-1 py-1.5 text-xs font-semibold border text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: themeConfig.surfaceSecondaryColor,
                      borderColor: themeConfig.borders !== false ? themeConfig.borderColor : 'transparent',
                      borderRadius: themeConfig.radiusPx || '3px'
                    }}
                  >
                    <span>Secondary</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#161616] border-t border-[#262626] flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            Changes are saved locally and persist automatically.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetToDefaultTheme();
                addToast('info', 'Reset to Obsidian Dark');
              }}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button
              type="button"
              id="btn-done-theme-editor"
              onClick={() => {
                setIsThemeEditorOpen(false);
                addToast('success', 'Theme settings applied!');
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
