// File: video-call-main/src/features/chat/wallpapers.ts
// Complete redesign: simple, aesthetic, non-flashy wallpapers for chat

export interface WallpaperOption {
  id: string;
  name: string;
  category: 'solid' | 'gradient' | 'pattern';
  preview: string;
  css: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  // ==================== SOLIDS (clean, minimal) ====================
  {
    id: 'solid-white',
    name: 'White',
    category: 'solid',
    preview: '#ffffff',
    css: '#ffffff'
  },
  {
    id: 'solid-ivory',
    name: 'Ivory',
    category: 'solid',
    preview: '#f8f5f0',
    css: '#f8f5f0'
  },
  {
    id: 'solid-light-gray',
    name: 'Light Gray',
    category: 'solid',
    preview: '#f1f3f5',
    css: '#f1f3f5'
  },
  {
    id: 'solid-warm-gray',
    name: 'Warm Gray',
    category: 'solid',
    preview: '#f0e9e6',
    css: '#f0e9e6'
  },
  {
    id: 'solid-sage',
    name: 'Sage',
    category: 'solid',
    preview: '#e5ebe3',
    css: '#e5ebe3'
  },
  {
    id: 'solid-dusty-blue',
    name: 'Dusty Blue',
    category: 'solid',
    preview: '#e2e9f0',
    css: '#e2e9f0'
  },
  {
    id: 'solid-lavender',
    name: 'Lavender',
    category: 'solid',
    preview: '#f0eaf4',
    css: '#f0eaf4'
  },
  {
    id: 'solid-blush',
    name: 'Blush',
    category: 'solid',
    preview: '#f9edea',
    css: '#f9edea'
  },
  {
    id: 'solid-charcoal',
    name: 'Charcoal',
    category: 'solid',
    preview: '#2d2f31',
    css: '#2d2f31'
  },
  {
    id: 'solid-navy',
    name: 'Navy',
    category: 'solid',
    preview: '#1a252c',
    css: '#1a252c'
  },
  {
    id: 'solid-forest',
    name: 'Forest',
    category: 'solid',
    preview: '#1e2b26',
    css: '#1e2b26'
  },

  // ==================== GRADIENTS (soft, pastel) ====================
  {
    id: 'gradient-soft-white',
    name: 'Soft White',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)',
    css: 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)'
  },
  {
    id: 'gradient-mist',
    name: 'Mist',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #f0f4fa 0%, #e9eef5 100%)',
    css: 'linear-gradient(135deg, #f0f4fa 0%, #e9eef5 100%)'
  },
  {
    id: 'gradient-peach',
    name: 'Peach',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #ffefea 0%, #f7e2dd 100%)',
    css: 'linear-gradient(135deg, #ffefea 0%, #f7e2dd 100%)'
  },
  {
    id: 'gradient-lavender',
    name: 'Lavender Mist',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #f3edf7 0%, #ede4f0 100%)',
    css: 'linear-gradient(135deg, #f3edf7 0%, #ede4f0 100%)'
  },
  {
    id: 'gradient-sage',
    name: 'Sage',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #e8f0e6 0%, #dde8da 100%)',
    css: 'linear-gradient(135deg, #e8f0e6 0%, #dde8da 100%)'
  },
  {
    id: 'gradient-sunset-soft',
    name: 'Soft Sunset',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #ffeae6 0%, #ffe0db 100%)',
    css: 'linear-gradient(135deg, #ffeae6 0%, #ffe0db 100%)'
  },
  {
    id: 'gradient-ocean-soft',
    name: 'Soft Ocean',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #e2ecf5 0%, #d6e3ed 100%)',
    css: 'linear-gradient(135deg, #e2ecf5 0%, #d6e3ed 100%)'
  },
  {
    id: 'gradient-midnight',
    name: 'Midnight',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #232b30 0%, #1e262b 100%)',
    css: 'linear-gradient(135deg, #232b30 0%, #1e262b 100%)'
  },
  {
    id: 'gradient-deep-forest',
    name: 'Deep Forest',
    category: 'gradient',
    preview: 'linear-gradient(135deg, #1e2b24 0%, #1a251f 100%)',
    css: 'linear-gradient(135deg, #1e2b24 0%, #1a251f 100%)'
  },

  // ==================== PATTERNS (barely visible, textural) ====================
  {
    id: 'pattern-subtle-dots',
    name: 'Subtle Dots',
    category: 'pattern',
    preview: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px) #fafafa'
  },
  {
    id: 'pattern-subtle-grid',
    name: 'Subtle Grid',
    category: 'pattern',
    preview: 'linear-gradient(#ccc 1px, transparent 1px)',
    css: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px) #fafafa'
  },
  {
    id: 'pattern-linen',
    name: 'Linen',
    category: 'pattern',
    preview: 'repeating-linear-gradient(45deg, #ddd 0px, #ddd 2px, transparent 2px, transparent 8px)',
    css: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 8px) #f8f4f0'
  },
  {
    id: 'pattern-paper',
    name: 'Paper',
    category: 'pattern',
    preview: 'repeating-linear-gradient(0deg, #e0e0e0 0px, #e0e0e0 1px, transparent 1px, transparent 6px)',
    css: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 6px) #fcf9f5'
  },
  {
    id: 'pattern-noise',
    name: 'Noise',
    category: 'pattern',
    preview: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
    css: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E") #f5f5f5'
  },
  {
    id: 'pattern-subtle-dots-dark',
    name: 'Subtle Dots (Dark)',
    category: 'pattern',
    preview: 'radial-gradient(circle, #666 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) #1e1e1e'
  },
  {
    id: 'pattern-linen-dark',
    name: 'Linen (Dark)',
    category: 'pattern',
    preview: 'repeating-linear-gradient(45deg, #555 0px, #555 2px, transparent 2px, transparent 8px)',
    css: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px) #1a1a1a'
  },
  // WhatsApp and Telegram wallpapers
  {
    id: 'whatsapp-classic-light',
    name: 'WhatsApp Classic Light',
    category: 'pattern',
    preview: 'radial-gradient(circle, #b3a99a 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px) #e5ddd5'
  },
  {
    id: 'whatsapp-classic-dark',
    name: 'WhatsApp Classic Dark',
    category: 'pattern',
    preview: 'radial-gradient(circle, #555 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px) #0b141a'
  },
  {
    id: 'telegram-classic-light',
    name: 'Telegram Classic Light',
    category: 'pattern',
    preview: 'linear-gradient(135deg, #d6e2ea, #c0d3df)',
    css: 'linear-gradient(135deg, #d6e2ea, #c0d3df), repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 8px)'
  },
  {
    id: 'telegram-classic-dark',
    name: 'Telegram Classic Dark',
    category: 'pattern',
    preview: 'linear-gradient(135deg, #232e3b, #1a232e)',
    css: 'linear-gradient(135deg, #232e3b, #1a232e), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px)'
  },
  // ========== ADDED: Classic WhatsApp Light Doodle Theme (Most Popular) ==========
  {
    id: 'whatsapp-light-doodle-popular',
    name: 'Classic WhatsApp Light Doodle Theme (Most Popular)',
    category: 'pattern',
    preview: 'radial-gradient(circle, #b3a99a 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px) #e5ddd5'
  },
  // ========== ADDED: Dark Mode WhatsApp Theme (Modern & Premium) ==========
  {
    id: 'whatsapp-dark-doodle-premium',
    name: 'Dark Mode WhatsApp Theme (Modern & Premium)',
    category: 'pattern',
    preview: 'radial-gradient(circle, #555 1px, transparent 1px)',
    css: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px) #0b141a'
  }
];

export const getWallpaperById = (id: string): WallpaperOption | undefined => {
  return WALLPAPERS.find(w => w.id === id);
};

export const getWallpapersByCategory = (category: WallpaperOption['category']) => {
  return WALLPAPERS.filter(w => w.category === category);
};


