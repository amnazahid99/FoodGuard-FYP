import { createContext, useContext, useEffect, useState } from 'react';

// ─── Color tokens ─────────────────────────────────────────────────────────────

export const darkColors = {
  pageBg:          '#0D1B2A',
  cardBg:          '#112240',
  cardBgAlpha:     'rgba(17,34,64,0.50)',
  navBg:           'rgba(13,27,42,0.92)',
  navBgScrolled:   'rgba(13,27,42,0.96)',
  navBorder:       'rgba(26,188,156,0.20)',
  navBorderOff:    'rgba(255,255,255,0.04)',
  navShadow:       '0 4px 30px rgba(0,0,0,0.3)',
  textPrimary:     '#FFFFFF',
  textSecondary:   '#A8B2C1',
  textMuted:       '#718096',
  teal:            '#1ABC9C',
  tealHover:       '#17A589',
  border:          'rgba(26,188,156,0.15)',
  borderLight:     'rgba(255,255,255,0.08)',
  borderMid:       'rgba(255,255,255,0.10)',
  inputBg:         '#0D1B2A',
  inputBorder:     'rgba(26,188,156,0.3)',
  tagBg:           'rgba(26,188,156,0.12)',
  tagColor:        '#1ABC9C',
  cardShadow:      '0 8px 32px rgba(0,0,0,0.4)',
  cardHoverShadow: '0 0 0 1.5px rgba(26,188,156,0.5), 0 16px 40px rgba(26,188,156,0.18)',
  divider:         'rgba(255,255,255,0.07)',
  heroBg:          'radial-gradient(ellipse at top left, #0a2a1f 0%, #0D1B2A 40%, #060d1a 100%)',
  heroOverlay:     'linear-gradient(transparent 30%, #0D1B2A 100%)',
  mobileMenuBg:    '#0D1B2A',
  mobileMenuBorder:'rgba(26,188,156,0.12)',
  footerBg:        '#0D1B2A',
  footerBorder:    'rgba(255,255,255,0.10)',
  logoBrandColor:  '#FFFFFF',
  particleColor:   'rgba(26,188,156,',   // append opacity + ')'
  orbColor1:       'rgba(26,188,156,0.15)',
  orbColor2:       'rgba(26,188,156,0.10)',
  orbColor3:       'rgba(10,80,60,0.20)',
  inlineCardBg:    'rgba(255,255,255,0.04)',
  inlineCardBorder:'rgba(255,255,255,0.06)',
};

// Light mode: premium gradient backgrounds with DARK cards (inverse of typical light theme)
// Navbar & Footer stay dark (same as dark mode), cards are dark navy on light backgrounds
export const lightColors = {
  // Page backgrounds: warm mint-to-white gradients
  pageBg:          'linear-gradient(135deg, #E8F5F0 0%, #F5FDFB 35%, #EAF4FF 65%, #F0F7F4 100%)',
  
  // Card backgrounds: DARK navy (like dark mode cards on light background)
  cardBg:          '#0D2137',          // Deep navy - main card background
  cardBgAlpha:     'rgba(13,33,55,0.95)',
  cardBgAlt:       '#112240',          // Alternative card background
  cardBgHover:     '#0A2A1F',          // Deep teal-navy on hover
  
  // Navbar: DARK (unchanged from dark mode)
  navBg:           'rgba(13,27,42,0.95)',
  navBgScrolled:   'rgba(13,27,42,0.96)',
  navBorder:       'rgba(26,188,156,0.20)',
  navBorderOff:    'rgba(26,188,156,0.12)',
  navShadow:       '0 4px 30px rgba(0,0,0,0.3)',
  
  // Text ON cards: WHITE (same as dark mode)
  textOnCardPrimary:   '#FFFFFF',
  textOnCardSecondary: '#A8B2C1',
  textOnCardMuted:     '#6B8A9E',
  
  // Text ON background (page gradient): DARK for contrast
  textPrimary:     '#0A2318',          // Very dark green-black for headings
  textSecondary:   '#1A4A3A',          // Dark teal for subheadings
  textMuted:       '#3D6B5E',          // Medium teal-gray for body text
  textAccent:      '#0E9E82',          // Teal for highlights
  
  // Teal accent: slightly deeper for light background contrast
  teal:            '#0E9E82',
  tealHover:       '#0B8A70',
  tealGlow:        'rgba(14,158,130,0.4)',
  tealSubtle:      'rgba(14,158,130,0.12)',
  
  // Card borders and shadows
  border:          'rgba(26,188,156,0.25)',
  borderLight:     'rgba(26,188,156,0.15)',
  borderMid:       'rgba(26,188,156,0.2)',
  borderHover:     'rgba(26,188,156,0.7)',
  cardShadow:      '0 8px 32px rgba(13,27,42,0.15)',
  cardHoverShadow: '0 0 30px rgba(26,188,156,0.35), 0 12px 40px rgba(13,27,42,0.2)',
  
  // Input fields: dark backgrounds (same as cards)
  inputBg:         '#0D2137',
  inputBorder:     'rgba(26,188,156,0.3)',
  inputFocus:      'rgba(26,188,156,0.7)',
  inputText:       '#FFFFFF',
  inputPlaceholder:'#6B8A9E',
  
  // Tags and pills
  tagBg:           'rgba(14,158,130,0.15)',
  tagColor:        '#0E9E82',
  tagBorder:       'rgba(14,158,130,0.4)',
  
  // Section dividers
  divider:         'rgba(14,158,130,0.2)',
  
  // Hero section: lighter gradient with teal glow orbs
  heroBg:          'linear-gradient(135deg, #C8EDE4 0%, #E8F5F0 30%, #EAF4FF 60%, #D4EDE8 100%)',
  heroOverlay:     'linear-gradient(transparent 30%, rgba(232,245,240,0.5) 100%)',
  
  // Mobile menu: DARK (same as navbar)
  mobileMenuBg:    '#0D1B2A',
  mobileMenuBorder:'rgba(26,188,156,0.12)',
  
  // Footer: DARK (unchanged from dark mode)
  footerBg:        '#0A1628',
  footerBorder:    'rgba(26,188,156,0.15)',
  
  // Logo: WHITE (same as dark mode since navbar is dark)
  logoBrandColor:  '#FFFFFF',
  
  // Particles: teal with subtle opacity
  particleColor:   'rgba(14,158,130,',   // append opacity + ')'
  orbColor1:       'rgba(14,158,130,0.12)',
  orbColor2:       'rgba(14,158,130,0.08)',
  orbColor3:       'rgba(26,188,156,0.06)',
  
  // Inline cards/badges (on backgrounds)
  inlineCardBg:    'rgba(13,27,42,0.08)',
  inlineCardBorder:'rgba(14,158,130,0.25)',
  
  // Section backgrounds (alternating gradient sections)
  sectionBgAlt:    'linear-gradient(135deg, #DFF2EC 0%, #EEF9F5 50%, #E4F0FF 100%)',
  sectionBgSecondary: 'linear-gradient(135deg, #DFF2EC 0%, #EEF9F5 100%)',
  sectionBgTertiary: 'linear-gradient(135deg, #E8F5F0 0%, #F5FDFB 100%)',
  
  // Status colors (same values as dark mode, applied to dark cards)
  freshText:       '#2ECC71',
  expiringText:    '#F39C12',
  expiredText:     '#E74C3C',
};



// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  c: darkColors,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('foodguard-theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('foodguard-theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Set initial attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, c: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
