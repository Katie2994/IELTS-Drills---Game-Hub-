export interface Theme {
  name: string;
  background: string;
  folderColors: {
    color: string;
    borderColor: string;
  }[];
}

export const THEMES: Record<string, Theme> = {
  default: {
    name: 'Mặc định',
    background: '#0a0a0a',
    folderColors: [
      { color: 'bg-zinc-800/60', borderColor: 'border-zinc-500/50' },
      { color: 'bg-neutral-800/60', borderColor: 'border-neutral-500/50' },
      { color: 'bg-slate-800/60', borderColor: 'border-slate-500/50' },
      { color: 'bg-gray-800/60', borderColor: 'border-gray-500/50' },
      { color: 'bg-stone-800/60', borderColor: 'border-stone-500/50' },
    ],
  },
  aurora: {
    name: 'Aurora',
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    folderColors: [
      { color: 'bg-purple-500/60', borderColor: 'border-purple-300/50' },
      { color: 'bg-blue-500/60', borderColor: 'border-blue-300/50' },
      { color: 'bg-teal-500/60', borderColor: 'border-teal-300/50' },
      { color: 'bg-green-500/60', borderColor: 'border-green-300/50' },
      { color: 'bg-yellow-500/60', borderColor: 'border-yellow-300/50' },
      { color: 'bg-orange-500/60', borderColor: 'border-orange-300/50' },
      { color: 'bg-pink-500/60', borderColor: 'border-pink-300/50' },
      { color: 'bg-red-500/60', borderColor: 'border-red-300/50' },
      { color: 'bg-indigo-500/60', borderColor: 'border-indigo-300/50' },
      { color: 'bg-cyan-500/60', borderColor: 'border-cyan-300/50' },
      { color: 'bg-gray-500/60', borderColor: 'border-gray-300/50' },
    ],
  },
  sunset: {
    name: 'Sunset',
    background: 'linear-gradient(-45deg, #ff7e5f, #feb47b, #ff5f6d, #ffc371)',
    folderColors: [
      { color: 'bg-red-500/60', borderColor: 'border-red-300/50' },
      { color: 'bg-orange-500/60', borderColor: 'border-orange-300/50' },
      { color: 'bg-amber-500/60', borderColor: 'border-amber-300/50' },
      { color: 'bg-yellow-500/60', borderColor: 'border-yellow-300/50' },
      { color: 'bg-rose-500/60', borderColor: 'border-rose-300/50' },
      { color: 'bg-pink-500/60', borderColor: 'border-pink-300/50' },
    ],
  },
  ocean: {
    name: 'Ocean',
    background: 'linear-gradient(-45deg, #00c6ff, #0072ff, #2980b9, #6dd5fa)',
    folderColors: [
      { color: 'bg-blue-600/60', borderColor: 'border-blue-400/50' },
      { color: 'bg-sky-500/60', borderColor: 'border-sky-300/50' },
      { color: 'bg-cyan-500/60', borderColor: 'border-cyan-300/50' },
      { color: 'bg-teal-500/60', borderColor: 'border-teal-300/50' },
      { color: 'bg-indigo-500/60', borderColor: 'border-indigo-300/50' },
      { color: 'bg-slate-500/60', borderColor: 'border-slate-300/50' },
    ],
  },
  forest: {
    name: 'Forest',
    background: 'linear-gradient(-45deg, #134e5e, #71b280, #56ab2f, #a8e063)',
    folderColors: [
      { color: 'bg-green-700/60', borderColor: 'border-green-500/50' },
      { color: 'bg-emerald-600/60', borderColor: 'border-emerald-400/50' },
      { color: 'bg-lime-600/60', borderColor: 'border-lime-400/50' },
      { color: 'bg-stone-500/60', borderColor: 'border-stone-300/50' },
      { color: 'bg-teal-700/60', borderColor: 'border-teal-500/50' },
    ],
  },
  charcoal: {
    name: 'Charcoal',
    background: 'linear-gradient(-45deg, #232526, #414345)',
    folderColors: [
      { color: 'bg-slate-700/60', borderColor: 'border-slate-500/50' },
      { color: 'bg-gray-600/60', borderColor: 'border-gray-400/50' },
      { color: 'bg-zinc-700/60', borderColor: 'border-zinc-500/50' },
      { color: 'bg-neutral-600/60', borderColor: 'border-neutral-400/50' },
      { color: 'bg-stone-700/60', borderColor: 'border-stone-500/50' },
      { color: 'bg-slate-500/60', borderColor: 'border-slate-300/50' },
    ],
  },
};