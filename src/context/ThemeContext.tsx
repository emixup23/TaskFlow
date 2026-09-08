import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ThemeMode,
  CustomThemeConfig,
  ThemePreset,
  FontFamilyOption,
  RadiusOption,
  DensityOption
} from '../types';

export const FONT_FAMILY_MAP: Record<FontFamilyOption, { label: string; family: string }> = {
  system: {
    label: 'System Default',
    family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  inter: {
    label: 'Inter Sans',
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  jakarta: {
    label: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  mono: {
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  },
  space: {
    label: 'Space Grotesk',
    family: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  fira: {
    label: 'Fira Code',
    family: "'Fira Code', ui-monospace, monospace"
  }
};

export const RADIUS_MAP: Record<RadiusOption, { label: string; px: string }> = {
  sharp: { label: 'Sharp (0px)', px: '0px' },
  precision: { label: 'Precision (3px)', px: '3px' },
  modern: { label: 'Modern (6px)', px: '6px' },
  soft: { label: 'Soft (10px)', px: '10px' },
  round: { label: 'Round (14px)', px: '14px' }
};

export const PRESET_THEMES: ThemePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Deep violet darkness ignited with striking magenta and ultraviolet highlights.',
    mode: 'dark',
    badge: 'Default',
    config: {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      mode: 'dark',
      primaryColor: '#ec4899',
      primaryHoverColor: '#db2777',
      primaryLightColor: 'rgba(236, 72, 153, 0.15)',
      backgroundColor: '#0c0714',
      surfaceColor: '#150d24',
      surfaceSecondaryColor: '#1f1338',
      borderColor: '#2e1c52',
      textColor: '#faf5ff',
      textMutedColor: '#c084fc',
      radius: 'modern',
      radiusPx: '6px',
      fontFamily: 'space',
      density: 'standard',
      highContrast: false
    }
  },
    {
    id: 'obsidian',
    name: 'Obsidian Dark',
    description: 'High-contrast studio dark with deep obsidian black and vibrant electric blue.',
    mode: 'dark',
    badge: 'Obsidian',
    config: {
      id: 'obsidian',
      name: 'Obsidian Dark',
      mode: 'dark',
      primaryColor: '#3b82f6',
      primaryHoverColor: '#2563eb',
      primaryLightColor: 'rgba(59, 130, 246, 0.15)',
      backgroundColor: '#0d0d0d',
      surfaceColor: '#141414',
      surfaceSecondaryColor: '#1a1a1a',
      borderColor: '#262626',
      textColor: '#f8fafc',
      textMutedColor: '#a1a1aa',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Cobalt',
    description: 'Deep navy-slate matrix with crisp cyan-blue accents and elevated contrast.',
    mode: 'dark',
    badge: 'Navy',
    config: {
      id: 'midnight',
      name: 'Midnight Cobalt',
      mode: 'dark',
      primaryColor: '#0ea5e9',
      primaryHoverColor: '#0284c7',
      primaryLightColor: 'rgba(14, 165, 233, 0.15)',
      backgroundColor: '#090d16',
      surfaceColor: '#0f172a',
      surfaceSecondaryColor: '#1e293b',
      borderColor: '#1e293b',
      textColor: '#f8fafc',
      textMutedColor: '#94a3b8',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  },
  {
    id: 'matrix',
    name: 'Emerald Matrix',
    description: 'Bioluminescent terminal green with deep pine and forest undertones.',
    mode: 'dark',
    badge: 'Matrix',
    config: {
      id: 'matrix',
      name: 'Emerald Matrix',
      mode: 'dark',
      primaryColor: '#10b981',
      primaryHoverColor: '#059669',
      primaryLightColor: 'rgba(16, 185, 129, 0.15)',
      backgroundColor: '#04100c',
      surfaceColor: '#081c16',
      surfaceSecondaryColor: '#0d2b22',
      borderColor: '#133e32',
      textColor: '#ecfdf5',
      textMutedColor: '#6ee7b7',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'mono',
      density: 'compact',
      highContrast: false
    }
  },
  {
    id: 'sunset',
    name: 'Industrial Amber',
    description: 'Warm charcoal foundry dark with glowing industrial amber and gold accents.',
    mode: 'dark',
    badge: 'Amber',
    config: {
      id: 'sunset',
      name: 'Industrial Amber',
      mode: 'dark',
      primaryColor: '#f59e0b',
      primaryHoverColor: '#d97706',
      primaryLightColor: 'rgba(245, 158, 11, 0.15)',
      backgroundColor: '#120f0b',
      surfaceColor: '#1a1611',
      surfaceSecondaryColor: '#241f18',
      borderColor: '#382f23',
      textColor: '#fffbeb',
      textMutedColor: '#fcd34d',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  },
  {
    id: 'crimson',
    name: 'Crimson Shadow',
    description: 'Dramatic velvet burgundy black with ruby red and rose highlights.',
    mode: 'dark',
    badge: 'Rose',
    config: {
      id: 'crimson',
      name: 'Crimson Shadow',
      mode: 'dark',
      primaryColor: '#f43f5e',
      primaryHoverColor: '#e11d48',
      primaryLightColor: 'rgba(244, 63, 94, 0.15)',
      backgroundColor: '#12080d',
      surfaceColor: '#1a0d14',
      surfaceSecondaryColor: '#26121d',
      borderColor: '#3b1b2d',
      textColor: '#fff1f2',
      textMutedColor: '#fda4af',
      radius: 'modern',
      radiusPx: '6px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  },
  {
    id: 'oled',
    name: 'Pitch OLED Minimalist',
    description: 'True black #000000 canvas with ultra-crisp monochrome & ice blue borders.',
    mode: 'dark',
    badge: 'OLED',
    config: {
      id: 'oled',
      name: 'Pitch OLED Minimalist',
      mode: 'dark',
      primaryColor: '#60a5fa',
      primaryHoverColor: '#3b82f6',
      primaryLightColor: 'rgba(96, 165, 250, 0.15)',
      backgroundColor: '#000000',
      surfaceColor: '#080808',
      surfaceSecondaryColor: '#121212',
      borderColor: '#222222',
      textColor: '#ffffff',
      textMutedColor: '#a3a3a3',
      radius: 'sharp',
      radiusPx: '0px',
      fontFamily: 'mono',
      density: 'compact',
      highContrast: true
    }
  },
  {
    id: 'daylight',
    name: 'Daylight Clean',
    description: 'Pristine light theme with high-contrast slate cards and crisp sapphire buttons.',
    mode: 'light',
    badge: 'Light',
    config: {
      id: 'daylight',
      name: 'Daylight Clean',
      mode: 'light',
      primaryColor: '#2563eb',
      primaryHoverColor: '#1d4ed8',
      primaryLightColor: 'rgba(37, 99, 235, 0.1)',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      surfaceSecondaryColor: '#f1f5f9',
      borderColor: '#e2e8f0',
      textColor: '#0f172a',
      textMutedColor: '#64748b',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  },
  {
    id: 'warm-sand',
    name: 'Warm Solar Sand',
    description: 'Cozy editorial parchment background with rich warm terracotta amber accents.',
    mode: 'light',
    badge: 'Warm Light',
    config: {
      id: 'warm-sand',
      name: 'Warm Solar Sand',
      mode: 'light',
      primaryColor: '#d97706',
      primaryHoverColor: '#b45309',
      primaryLightColor: 'rgba(217, 119, 6, 0.1)',
      backgroundColor: '#faf7f2',
      surfaceColor: '#ffffff',
      surfaceSecondaryColor: '#f4efe6',
      borderColor: '#e6ded3',
      textColor: '#292524',
      textMutedColor: '#78716c',
      radius: 'modern',
      radiusPx: '6px',
      fontFamily: 'jakarta',
      density: 'relaxed',
      highContrast: false
    }
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    description: 'Cool glacial light slate with crisp arctic cyan highlights.',
    mode: 'light',
    badge: 'Cool Light',
    config: {
      id: 'nordic',
      name: 'Nordic Frost',
      mode: 'light',
      primaryColor: '#0284c7',
      primaryHoverColor: '#0369a1',
      primaryLightColor: 'rgba(2, 132, 199, 0.1)',
      backgroundColor: '#f0f4f8',
      surfaceColor: '#ffffff',
      surfaceSecondaryColor: '#e2e8f0',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      textMutedColor: '#475569',
      radius: 'precision',
      radiusPx: '3px',
      fontFamily: 'system',
      density: 'standard',
      highContrast: false
    }
  }
];

const THEME_MODE_STORAGE_KEY = 'quarkflow_theme_mode';
const THEME_CONFIG_STORAGE_KEY = 'quarkflow_theme_config';
const CUSTOM_PRESETS_STORAGE_KEY = 'quarkflow_custom_theme_presets';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  themeConfig: CustomThemeConfig;
  activePresetId: string;
  isThemeEditorOpen: boolean;
  customPresets: ThemePreset[];
  allPresets: ThemePreset[];
  setTheme: (theme: ThemeMode) => void;
  toggleDarkMode: () => void;
  setIsThemeEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  applyPreset: (presetId: string) => void;
  updateThemeConfig: (updates: Partial<CustomThemeConfig>) => void;
  resetToDefaultTheme: () => void;
  saveCustomPreset: (name: string) => void;
  deleteCustomPreset: (presetId: string) => void;
  exportThemeJson: () => string;
  importThemeJson: (jsonString: string) => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Mode (light / dark / system)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Custom Presets created by user
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Active theme configuration
  const [themeConfig, setThemeConfig] = useState<CustomThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(THEME_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If stored theme was the old obsidian default, seamlessly upgrade to the new Cyberpunk Neon default
        if (parsed && parsed.id && parsed.id !== 'obsidian') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return PRESET_THEMES[0].config;
  });

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return themeConfig.id || 'cyberpunk';
  });

  const [isDark, setIsDark] = useState<boolean>(true);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState<boolean>(false);

  // All presets combined (default + custom)
  const allPresets = useMemo(() => {
    return [...PRESET_THEMES, ...customPresets];
  }, [customPresets]);

  // Apply CSS Variables, Theme Attributes, and Dark Mode class to Document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateActualTheme = () => {
      let activeIsDark = true;
      if (themeConfig.mode === 'light' || theme === 'light') {
        activeIsDark = false;
      } else if (themeConfig.mode === 'dark' || theme === 'dark') {
        activeIsDark = true;
      } else if (theme === 'system') {
        activeIsDark = mediaQuery.matches;
      }

      setIsDark(activeIsDark);

      if (activeIsDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
        root.style.colorScheme = 'dark';
        root.setAttribute('data-theme-mode', 'dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        body.classList.remove('dark');
        body.classList.add('light');
        root.style.colorScheme = 'light';
        root.setAttribute('data-theme-mode', 'light');
      }

      root.setAttribute('data-theme-preset', themeConfig.id || 'custom');
      root.setAttribute('data-theme-font', themeConfig.fontFamily || 'system');
      root.setAttribute('data-theme-radius', themeConfig.radius || 'precision');
    };

    updateActualTheme();

    const handleSystemChange = () => {
      if (theme === 'system') {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, themeConfig.mode, themeConfig.id, themeConfig.fontFamily, themeConfig.radius]);

  // Sync theme configuration CSS variables to DOM
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    const applyVar = (name: string, value: string) => {
      root.style.setProperty(name, value);
      body.style.setProperty(name, value);
    };

    // Inject dynamic CSS custom properties
    applyVar('--app-primary', themeConfig.primaryColor);
    applyVar('--app-primary-hover', themeConfig.primaryHoverColor || themeConfig.primaryColor);
    applyVar('--app-primary-light', themeConfig.primaryLightColor || `${themeConfig.primaryColor}26`);
    applyVar('--app-bg', themeConfig.backgroundColor);
    applyVar('--app-surface', themeConfig.surfaceColor);
    applyVar('--app-surface-secondary', themeConfig.surfaceSecondaryColor);
    applyVar('--app-border', themeConfig.borderColor);
    applyVar('--app-text', themeConfig.textColor);
    applyVar('--app-text-muted', themeConfig.textMutedColor);
    applyVar('--app-radius', themeConfig.radiusPx || RADIUS_MAP[themeConfig.radius]?.px || '3px');
    
    const fontInfo = FONT_FAMILY_MAP[themeConfig.fontFamily];
    if (fontInfo) {
      applyVar('--app-font', fontInfo.family);
      root.style.fontFamily = fontInfo.family;
      body.style.fontFamily = fontInfo.family;
    }

    // Save to LocalStorage
    try {
      localStorage.setItem(THEME_CONFIG_STORAGE_KEY, JSON.stringify(themeConfig));
    } catch {
      // ignore
    }
  }, [themeConfig]);

  // Set Theme Mode (light/dark/system)
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }

    // If switching explicitly to light and current config is dark, choose default light preset
    if (newTheme === 'light' && themeConfig.mode === 'dark') {
      applyPreset('daylight');
    } else if (newTheme === 'dark' && themeConfig.mode === 'light') {
      applyPreset('cyberpunk');
    }
  };

  const toggleDarkMode = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Apply a preset theme
  const applyPreset = (presetId: string) => {
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setThemeConfig({ ...preset.config });
    setActivePresetId(preset.id);
    if (preset.config.mode === 'light' && theme !== 'light') {
      setThemeState('light');
      localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light');
    } else if (preset.config.mode === 'dark' && theme !== 'dark') {
      setThemeState('dark');
      localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    }
  };

  // Update specific fields of theme config
  const updateThemeConfig = (updates: Partial<CustomThemeConfig>) => {
    setThemeConfig((prev) => {
      const next = { ...prev, ...updates, isCustom: true };
      // Auto-update radiusPx if radius enum changed
      if (updates.radius && RADIUS_MAP[updates.radius]) {
        next.radiusPx = RADIUS_MAP[updates.radius].px;
      }
      return next;
    });
    setActivePresetId('custom');
  };

  // Reset to default theme
  const resetToDefaultTheme = () => {
    applyPreset('cyberpunk');
  };

  // Save current theme as a custom preset
  const saveCustomPreset = (name: string) => {
    const newId = `custom-preset-${Date.now()}`;
    const newPreset: ThemePreset = {
      id: newId,
      name: name.trim() || 'My Custom Theme',
      description: 'Custom user crafted theme palette',
      mode: themeConfig.mode,
      badge: 'Custom',
      config: {
        ...themeConfig,
        id: newId,
        name: name.trim() || 'My Custom Theme',
        isCustom: true
      }
    };

    setCustomPresets((prev) => {
      const updated = [...prev, newPreset];
      try {
        localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setActivePresetId(newId);
  };

  // Delete a custom preset
  const deleteCustomPreset = (presetId: string) => {
    setCustomPresets((prev) => {
      const filtered = prev.filter((p) => p.id !== presetId);
      try {
        localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(filtered));
      } catch {
        // ignore
      }
      return filtered;
    });
    if (activePresetId === presetId) {
      applyPreset('obsidian');
    }
  };

  // Export theme as JSON
  const exportThemeJson = (): string => {
    return JSON.stringify(themeConfig, null, 2);
  };

  // Import theme from JSON
  const importThemeJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.primaryColor || !parsed.backgroundColor || !parsed.surfaceColor) {
        return false;
      }
      setThemeConfig({
        ...PRESET_THEMES[0].config,
        ...parsed,
        id: `imported-${Date.now()}`,
        isCustom: true
      });
      setActivePresetId('custom');
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        themeConfig,
        activePresetId,
        isThemeEditorOpen,
        customPresets,
        allPresets,
        setTheme,
        toggleDarkMode,
        setIsThemeEditorOpen,
        applyPreset,
        updateThemeConfig,
        resetToDefaultTheme,
        saveCustomPreset,
        deleteCustomPreset,
        exportThemeJson,
        importThemeJson
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
