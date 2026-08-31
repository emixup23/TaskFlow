// SVG avatar generation utility producing crisp, modern vector avatars

export interface SvgAvatarStyle {
  id: string;
  name: string;
  category: 'cyber' | 'geometric' | 'coder' | 'modern';
  description: string;
}

export const SVG_AVATAR_STYLES: SvgAvatarStyle[] = [
  { id: 'tech-matrix', name: 'Tech Matrix', category: 'cyber', description: 'Cyberpunk hexagonal nodes & neon grid' },
  { id: 'gradient-gem', name: 'Prism Gem', category: 'geometric', description: 'Multifaceted 3D isometric crystal' },
  { id: 'circuit-bot', name: 'Cyber Bot', category: 'cyber', description: 'Futuristic AI visor and cybernetic circuits' },
  { id: 'code-bracket', name: 'Code Master', category: 'coder', description: 'Developer terminal with curly syntax brackets' },
  { id: 'quantum-orbit', name: 'Quantum Orbit', category: 'modern', description: 'Orbital energy rings with glowing core' },
  { id: 'cosmic-shield', name: 'Security Aegis', category: 'cyber', description: 'High-security vector shield matrix' },
  { id: 'designer-bauhaus', name: 'Bauhaus Art', category: 'geometric', description: 'Minimalist Bauhaus geometric composition' },
  { id: 'neural-mesh', name: 'Neural Mesh', category: 'modern', description: 'Interconnected AI neural network nodes' },
  { id: 'neon-synth', name: 'Neon Synth', category: 'cyber', description: 'Retro synthwave vector geometry' },
  { id: 'speed-runner', name: 'Speed Runner', category: 'modern', description: 'High-velocity angular vector chevron' }
];

const COLOR_PALETTES = [
  { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#60A5FA', bg1: '#1E1B4B', bg2: '#0F172A' },
  { primary: '#10B981', secondary: '#06B6D4', accent: '#34D399', bg1: '#064E3B', bg2: '#0F172A' },
  { primary: '#F59E0B', secondary: '#EF4444', accent: '#FBBF24', bg1: '#78350F', bg2: '#18181B' },
  { primary: '#EC4899', secondary: '#8B5CF6', accent: '#F472B6', bg1: '#701A75', bg2: '#0F172A' },
  { primary: '#6366F1', secondary: '#EC4899', accent: '#818CF8', bg1: '#312E81', bg2: '#18181B' },
  { primary: '#14B8A6', secondary: '#3B82F6', accent: '#2DD4BF', bg1: '#134E4A', bg2: '#0F172A' },
  { primary: '#8B5CF6', secondary: '#F43F5E', accent: '#A78BFA', bg1: '#4C1D95', bg2: '#18181B' },
  { primary: '#0ea5e9', secondary: '#10b981', accent: '#38bdf8', bg1: '#0c4a6e', bg2: '#0f172a' }
];

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return 'TF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates raw SVG markup for a given user/seed and style
 */
export function generateAvatarSvgMarkup(
  seed: string,
  styleId?: string,
  size: number = 100
): string {
  const hash = stringToHash(seed);
  const palette = COLOR_PALETTES[hash % COLOR_PALETTES.length];
  const chosenStyle = styleId || SVG_AVATAR_STYLES[hash % SVG_AVATAR_STYLES.length].id;
  const initials = getInitials(seed);

  const gradId = `grad_${hash}_${Math.floor(Math.random() * 1000)}`;
  const filterId = `glow_${hash}`;

  let innerContent = '';

  switch (chosenStyle) {
    case 'tech-matrix':
      innerContent = `
        <defs>
          <pattern id="grid_${hash}" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="${palette.accent}" stroke-width="0.5" stroke-opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid_${hash})" />
        <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="none" stroke="${palette.accent}" stroke-width="2.5" />
        <polygon points="50,25 75,40 75,70 50,85 25,70 25,40" fill="${palette.primary}" fill-opacity="0.35" stroke="${palette.secondary}" stroke-width="1.5" />
        <circle cx="50" cy="50" r="14" fill="${palette.secondary}" />
        <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="4" fill="${palette.bg1}" />
        <circle cx="50" cy="15" r="3" fill="${palette.accent}" />
        <circle cx="85" cy="35" r="3" fill="${palette.accent}" />
        <circle cx="85" cy="75" r="3" fill="${palette.accent}" />
        <circle cx="50" cy="95" r="3" fill="${palette.accent}" />
        <circle cx="15" cy="75" r="3" fill="${palette.accent}" />
        <circle cx="15" cy="35" r="3" fill="${palette.accent}" />
      `;
      break;

    case 'circuit-bot':
      innerContent = `
        <!-- Robot Head Shell -->
        <rect x="22" y="24" width="56" height="52" rx="14" fill="${palette.primary}" stroke="${palette.accent}" stroke-width="2" />
        <!-- Eye Visor -->
        <rect x="28" y="38" width="44" height="18" rx="7" fill="${palette.bg2}" stroke="${palette.secondary}" stroke-width="1.5" />
        <circle cx="40" cy="47" r="5" fill="#38BDF8" />
        <circle cx="60" cy="47" r="5" fill="#38BDF8" />
        <circle cx="42" cy="45" r="1.5" fill="#FFFFFF" />
        <circle cx="62" cy="45" r="1.5" fill="#FFFFFF" />
        <!-- Antenna -->
        <line x1="50" y1="24" x2="50" y2="12" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round" />
        <circle cx="50" cy="10" r="4" fill="${palette.secondary}" />
        <!-- Mouth Grill -->
        <line x1="36" y1="64" x2="64" y2="64" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" />
        <line x1="42" y1="60" x2="42" y2="68" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="50" y1="60" x2="50" y2="68" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="58" y1="60" x2="58" y2="68" stroke="${palette.accent}" stroke-width="1.5" />
      `;
      break;

    case 'code-bracket':
      innerContent = `
        <rect x="15" y="15" width="70" height="70" rx="16" fill="${palette.bg2}" stroke="${palette.primary}" stroke-width="2" />
        <!-- Terminal Header -->
        <circle cx="27" cy="26" r="3" fill="#EF4444" />
        <circle cx="36" cy="26" r="3" fill="#F59E0B" />
        <circle cx="45" cy="26" r="3" fill="#10B981" />
        <!-- Code Curly Brackets -->
        <path d="M 38 40 C 30 40 30 48 30 52 C 30 56 26 58 24 58 C 26 58 30 60 30 64 C 30 68 30 76 38 76" fill="none" stroke="${palette.accent}" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 62 40 C 70 40 70 48 70 52 C 70 56 74 58 76 58 C 74 58 70 60 70 64 C 70 68 70 76 62 76" fill="none" stroke="${palette.accent}" stroke-width="3.5" stroke-linecap="round" />
        <!-- Slash -->
        <line x1="54" y1="44" x2="46" y2="72" stroke="${palette.secondary}" stroke-width="3" stroke-linecap="round" />
      `;
      break;

    case 'gradient-gem':
      innerContent = `
        <!-- Isometric 3D Diamond -->
        <polygon points="50,15 85,38 50,55 15,38" fill="${palette.accent}" fill-opacity="0.9" />
        <polygon points="15,38 50,55 50,92 15,70" fill="${palette.primary}" />
        <polygon points="85,38 50,55 50,92 85,70" fill="${palette.secondary}" />
        <line x1="50" y1="15" x2="50" y2="55" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.5" />
        <circle cx="50" cy="55" r="4" fill="#FFFFFF" />
      `;
      break;

    case 'quantum-orbit':
      innerContent = `
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="${palette.primary}" stroke-width="2" transform="rotate(-30 50 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="${palette.secondary}" stroke-width="2" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="${palette.accent}" stroke-width="2" transform="rotate(90 50 50)" />
        <circle cx="50" cy="50" r="12" fill="url(#${gradId})" />
        <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
        <circle cx="22" cy="34" r="4" fill="${palette.accent}" />
        <circle cx="78" cy="66" r="4" fill="${palette.secondary}" />
      `;
      break;

    case 'cosmic-shield':
      innerContent = `
        <path d="M 50 14 L 82 28 C 82 58 68 80 50 90 C 32 80 18 58 18 28 Z" fill="${palette.bg2}" stroke="${palette.primary}" stroke-width="3" />
        <path d="M 50 24 L 74 35 C 74 58 63 74 50 81 C 37 74 26 58 26 35 Z" fill="${palette.secondary}" fill-opacity="0.4" stroke="${palette.accent}" stroke-width="1.5" />
        <!-- Keyhole / Star -->
        <circle cx="50" cy="46" r="8" fill="#FFFFFF" />
        <polygon points="50,48 45,64 55,64" fill="#FFFFFF" />
      `;
      break;

    case 'designer-bauhaus':
      innerContent = `
        <circle cx="34" cy="34" r="22" fill="${palette.primary}" />
        <rect x="42" y="42" width="40" height="40" rx="4" fill="${palette.secondary}" fill-opacity="0.85" />
        <polygon points="76,20 92,52 60,52" fill="${palette.accent}" />
        <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
      `;
      break;

    case 'neural-mesh':
      innerContent = `
        <line x1="25" y1="30" x2="50" y2="18" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="75" y1="30" x2="50" y2="18" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="25" y1="30" x2="35" y2="60" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="75" y1="30" x2="65" y2="60" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="35" y1="60" x2="50" y2="82" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="65" y1="60" x2="50" y2="82" stroke="${palette.accent}" stroke-width="1.5" />
        <line x1="35" y1="60" x2="65" y2="60" stroke="${palette.secondary}" stroke-width="2" />
        <line x1="25" y1="30" x2="75" y2="30" stroke="${palette.primary}" stroke-width="2" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="${palette.accent}" stroke-width="1.5" stroke-dasharray="3,3" />

        <circle cx="50" cy="18" r="7" fill="${palette.primary}" />
        <circle cx="25" cy="30" r="6" fill="${palette.secondary}" />
        <circle cx="75" cy="30" r="6" fill="${palette.secondary}" />
        <circle cx="35" cy="60" r="6" fill="${palette.accent}" />
        <circle cx="65" cy="60" r="6" fill="${palette.accent}" />
        <circle cx="50" cy="82" r="7" fill="${palette.primary}" />
        <circle cx="50" cy="50" r="9" fill="#FFFFFF" />
      `;
      break;

    case 'neon-synth':
      innerContent = `
        <!-- Sunset Sun -->
        <circle cx="50" cy="46" r="28" fill="url(#${gradId})" />
        <line x1="24" y1="46" x2="76" y2="46" stroke="${palette.bg1}" stroke-width="2" />
        <line x1="26" y1="52" x2="74" y2="52" stroke="${palette.bg1}" stroke-width="2.5" />
        <line x1="30" y1="58" x2="70" y2="58" stroke="${palette.bg1}" stroke-width="3" />
        <line x1="35" y1="64" x2="65" y2="64" stroke="${palette.bg1}" stroke-width="3.5" />
        <!-- Neon Mountain Grid -->
        <polygon points="10,88 50,48 90,88" fill="${palette.bg2}" fill-opacity="0.8" stroke="${palette.accent}" stroke-width="2" />
        <polygon points="35,88 50,68 65,88" fill="${palette.secondary}" fill-opacity="0.6" stroke="${palette.accent}" stroke-width="1" />
      `;
      break;

    case 'speed-runner':
    default:
      innerContent = `
        <polygon points="50,15 85,50 50,85 15,50" fill="url(#${gradId})" stroke="${palette.accent}" stroke-width="2" />
        <polygon points="50,28 72,50 50,72 28,50" fill="${palette.bg1}" />
        <text x="50" y="56" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">${initials}</text>
      `;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.primary}" />
      <stop offset="100%" stop-color="${palette.secondary}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="${palette.bg1}" />
  ${innerContent}
</svg>`;
}

/**
 * Returns a Data URL string for an SVG avatar (can be passed into img src directly)
 */
export function getSvgAvatarDataUrl(seed: string, styleId?: string): string {
  const svg = generateAvatarSvgMarkup(seed, styleId, 100);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;utf8,${encoded}`;
}

/**
 * Generates an assortment of SVG Avatar presets to choose from in user management
 */
export function getSvgAvatarPresets(userName: string): { styleId: string; name: string; dataUrl: string }[] {
  return SVG_AVATAR_STYLES.map((style) => ({
    styleId: style.id,
    name: style.name,
    dataUrl: getSvgAvatarDataUrl(userName || 'User', style.id)
  }));
}
