export interface ColorTheme {
  id: string;
  swatch: string;  // solid hex for color picker
  bg: string;      // translucent bg for icon wrap
  icon: string;    // icon stroke color
}

export const COLORS: ColorTheme[] = [
  { id: 'violet',  swatch: '#7c6ef2', bg: 'rgba(124,110,242,0.20)', icon: '#a89af7' },
  { id: 'cyan',    swatch: '#22d3ee', bg: 'rgba(34,211,238,0.18)',  icon: '#67e8f9' },
  { id: 'rose',    swatch: '#fb7185', bg: 'rgba(251,113,133,0.18)', icon: '#fda4af' },
  { id: 'amber',   swatch: '#fbbf24', bg: 'rgba(251,191,36,0.18)',  icon: '#fcd34d' },
  { id: 'emerald', swatch: '#34d399', bg: 'rgba(52,211,153,0.18)',  icon: '#6ee7b7' },
  { id: 'sky',     swatch: '#38bdf8', bg: 'rgba(56,189,248,0.18)',  icon: '#7dd3fc' },
  { id: 'fuchsia', swatch: '#e879f9', bg: 'rgba(232,121,249,0.18)', icon: '#f0abfc' },
  { id: 'lime',    swatch: '#a3e635', bg: 'rgba(163,230,53,0.18)',  icon: '#bef264' },
];
