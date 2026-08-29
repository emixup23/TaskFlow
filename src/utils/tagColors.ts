export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badgeClass: string;
}

const PALETTES: TagStyle[] = [
  {
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
    dot: 'bg-emerald-400',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
  },
  {
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-700/60',
    dot: 'bg-rose-400',
    badgeClass: 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
  },
  {
    bg: 'bg-blue-950/70',
    text: 'text-blue-300',
    border: 'border-blue-700/60',
    dot: 'bg-blue-400',
    badgeClass: 'bg-blue-950/70 text-blue-300 border border-blue-700/60'
  },
  {
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-700/60',
    dot: 'bg-amber-400',
    badgeClass: 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
  },
  {
    bg: 'bg-violet-950/70',
    text: 'text-violet-300',
    border: 'border-violet-700/60',
    dot: 'bg-violet-400',
    badgeClass: 'bg-violet-950/70 text-violet-300 border border-violet-700/60'
  },
  {
    bg: 'bg-cyan-950/70',
    text: 'text-cyan-300',
    border: 'border-cyan-700/60',
    dot: 'bg-cyan-400',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/60'
  },
  {
    bg: 'bg-fuchsia-950/70',
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-700/60',
    dot: 'bg-fuchsia-400',
    badgeClass: 'bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-700/60'
  },
  {
    bg: 'bg-teal-950/70',
    text: 'text-teal-300',
    border: 'border-teal-700/60',
    dot: 'bg-teal-400',
    badgeClass: 'bg-teal-950/70 text-teal-300 border border-teal-700/60'
  },
  {
    bg: 'bg-orange-950/70',
    text: 'text-orange-300',
    border: 'border-orange-700/60',
    dot: 'bg-orange-400',
    badgeClass: 'bg-orange-950/70 text-orange-300 border border-orange-700/60'
  },
  {
    bg: 'bg-pink-950/70',
    text: 'text-pink-300',
    border: 'border-pink-700/60',
    dot: 'bg-pink-400',
    badgeClass: 'bg-pink-950/70 text-pink-300 border border-pink-700/60'
  },
  {
    bg: 'bg-sky-950/70',
    text: 'text-sky-300',
    border: 'border-sky-700/60',
    dot: 'bg-sky-400',
    badgeClass: 'bg-sky-950/70 text-sky-300 border border-sky-700/60'
  },
  {
    bg: 'bg-lime-950/70',
    text: 'text-lime-300',
    border: 'border-lime-700/60',
    dot: 'bg-lime-400',
    badgeClass: 'bg-lime-950/70 text-lime-300 border border-lime-700/60'
  }
];

export function getTagStyle(tag: string): TagStyle {
  if (!tag) return PALETTES[0];
  const t = tag.toLowerCase().trim();

  // Known semantic mappings
  if (t.includes('bug') || t.includes('fix') || t.includes('critical') || t.includes('defect')) {
    return PALETTES[1]; // Rose
  }
  if (t.includes('feature') || t.includes('feat') || t.includes('core')) {
    return PALETTES[5]; // Cyan
  }
  if (t.includes('frontend') || t.includes('ui') || t.includes('web') || t.includes('client')) {
    return PALETTES[2]; // Blue
  }
  if (t.includes('backend') || t.includes('api') || t.includes('server') || t.includes('db')) {
    return PALETTES[0]; // Emerald
  }
  if (t.includes('design') || t.includes('ux') || t.includes('figma') || t.includes('mockup')) {
    return PALETTES[4]; // Violet
  }
  if (t.includes('security') || t.includes('auth') || t.includes('rbac') || t.includes('cert')) {
    return PALETTES[8]; // Orange
  }
  if (t.includes('infra') || t.includes('devops') || t.includes('docker') || t.includes('k8s')) {
    return PALETTES[3]; // Amber
  }
  if (t.includes('docs') || t.includes('documentation') || t.includes('readme')) {
    return PALETTES[7]; // Teal
  }
  if (t.includes('testing') || t.includes('qa') || t.includes('cypress') || t.includes('jest')) {
    return PALETTES[6]; // Fuchsia
  }
  if (t.includes('perf') || t.includes('speed') || t.includes('optimize')) {
    return PALETTES[10]; // Sky
  }
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) {
    return PALETTES[9]; // Pink
  }
  if (t.includes('refactor') || t.includes('cleanup')) {
    return PALETTES[11]; // Lime
  }

  // Consistent string hash fallback
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash = t.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}
