import { createContext, useContext, useEffect, useState } from 'react';
import { lightColors } from '../styles/theme/lightTheme';

// ─── Token Aliases ────────────────────────────────────────────────────────────
// Maps old token names to new unified names so all existing `isDark ? X : c.foo`
// ternaries and direct `c.textOnCardPrimary` calls keep working without editing
// any page files.
const ALIAS = {
  textOnCardPrimary:   'onCardPrimary',
  textOnCardSecondary: 'onCardSecondary',
  textOnCardMuted:     'onCardMuted',
  pageBg:              'pageBg',
  surfaceBg:           'surfaceBg',
  surfaceAlt:          'surfaceAlt',
  surfaceElevated:     'surfaceElevated',
  cardBg:              'cardBg',
  cardBgAlpha:         'cardBgAlpha',
  cardBgAlt:           'cardBgAlt',
  cardBgHover:         'cardBgHover',
  cardShadow:          'cardShadow',
  cardHoverShadow:     'cardHoverShadow',
  textPrimary:         'textPrimary',
  textSecondary:       'textSecondary',
  textMuted:           'textMuted',
  teal:                'teal',
  tealHover:           'tealHover',
  tealGlow:            'tealGlow',
  tealSubtle:          'tealSubtle',
  border:              'border',
  borderLight:         'borderLight',
  borderMid:           'borderMid',
  borderHover:         'borderHover',
  divider:             'divider',
  inputBg:             'inputBg',
  inputBorder:         'inputBorder',
  inputFocus:          'inputFocus',
  inputText:           'inputText',
  inputPlaceholder:    'inputPlaceholder',
  tagBg:               'tagBg',
  tagColor:            'tagColor',
  tagBorder:           'tagBorder',
  navBg:               'navBg',
  navBgScrolled:       'navBgScrolled',
  navBorder:           'navBorder',
  navBorderOff:        'navBorderOff',
  navBorderScrolled:   'navBorderScrolled',
  navShadow:           'navShadow',
  logoBrandColor:      'logoBrandColor',
  heroBg:              'heroBg',
  heroOverlay:         'heroOverlay',
  mobileMenuBg:        'mobileMenuBg',
  mobileMenuBorder:    'mobileMenuBorder',
  footerBg:            'footerBg',
  footerBorder:        'footerBorder',
  sectionBgAlt:        'sectionBgAlt',
  sectionBgSecondary:  'sectionBgSecondary',
  sectionBgTertiary:   'sectionBgTertiary',
  orbColor1:           'orbColor1',
  orbColor2:           'orbColor2',
  orbColor3:           'orbColor3',
  particleColor:       'particleColor',
  inlineCardBg:        'inlineCardBg',
  inlineCardBorder:    'inlineCardBorder',
  primaryAccent:       'primaryAccent',
  primaryAccentHover:  'primaryAccentHover',
  primaryAccentSubtle: 'primaryAccentSubtle',
  primaryAccentText:   'primaryAccentText',
  goldAccent:          'goldAccent',
  goldSubtle:          'goldSubtle',
  goldText:            'goldText',
  deepForest:          'deepForest',
  deepForestSubtle:    'deepForestSubtle',
  statusFresh:         'statusFresh',
  statusFreshBg:       'statusFreshBg',
  statusWarning:       'statusWarning',
  statusWarningBg:     'statusWarningBg',
  statusError:         'statusError',
  statusErrorBg:       'statusErrorBg',
  statusInfo:          'statusInfo',
  statusInfoBg:        'statusInfoBg',
  checkboxBg:          'checkboxBg',
  checkboxBorder:      'checkboxBorder',
  checkboxChecked:     'checkboxChecked',
  statCardAlt1:        'statCardAlt1',
  statCardAlt2:        'statCardAlt2',
  statCardAlt3:        'statCardAlt3',
  statCardAlt4:        'statCardAlt4',
  formLabel:           'formLabel',
  urgentPulse:         'urgentPulse',
  warningPulse:        'warningPulse',
  successPulse:        'successPulse',
};

export function resolveToken(c, name) {
  if (!c || !name) return null;
  const resolved = ALIAS[name] || name;
  return c[resolved] ?? c[name] ?? null;
}

// ─── Dark Mode Colors (UNCHANGED from source of truth) ─────────────────────────
export const darkColors = {
  pageBg:          '#0D1B2A',
  pageBgSolid:     '#0D1B2A',
  cardBg:          '#112240',
  cardBgAlpha:     'rgba(17,34,64,0.50)',
  cardBgAlt:       '#1B2B4B',
  cardBgHover:     '#1A2A4A',
  navBg:           'rgba(13,27,42,0.92)',
  navBgScrolled:   'rgba(13,27,42,0.96)',
  navBorder:       'rgba(26,188,156,0.20)',
  navBorderOff:    'rgba(255,255,255,0.04)',
  navBorderScrolled:'rgba(255,255,255,0.08)',
  navShadow:       '0 4px 30px rgba(0,0,0,0.3)',
  navText:         '#A8B2C1',
  navTextActive:   '#1ABC9C',
  textPrimary:     '#FFFFFF',
  textSecondary:   '#A8B2C1',
  textMuted:       '#718096',
  onCardPrimary:   '#FFFFFF',
  onCardSecondary: '#A8B2C1',
  onCardMuted:     '#718096',
  teal:            '#1ABC9C',
  tealHover:       '#17A589',
  tealGlow:        'rgba(26,188,156,0.22)',
  tealSubtle:      'rgba(26,188,156,0.08)',
  tealText:        '#1ABC9C',
  border:          'rgba(26,188,156,0.15)',
  borderLight:     'rgba(255,255,255,0.08)',
  borderMid:       'rgba(255,255,255,0.10)',
  borderHover:     'rgba(26,188,156,0.3)',
divider:         'rgba(255,255,255,0.07)',
  cardShadow:      '0 8px 32px rgba(0,0,0,0.4)',
  cardHoverShadow: '0 0 0 1.5px rgba(26,188,156,0.5), 0 16px 40px rgba(26,188,156,0.18)',
  elevatedShadow:  '0 12px 40px rgba(0,0,0,0.5)',
  inputBg:         '#0D1B2A',
  inputBorder:     'rgba(26,188,156,0.3)',
  inputFocus:      'rgba(26,188,156,0.4)',
  inputText:       '#FFFFFF',
  inputPlaceholder:'#718096',
  tagBg:           'rgba(26,188,156,0.12)',
  tagColor:        '#1ABC9C',
  tagBorder:       'rgba(26,188,156,0.20)',
  heroBg:          'radial-gradient(ellipse at top left, #0a2a1f 0%, #0D1B2A 40%, #060d1a 100%)',
  heroOverlay:     'linear-gradient(transparent 30%, #0D1B2A 100%)',
  mobileMenuBg:    '#0D1B2A',
  mobileMenuBorder:'rgba(26,188,156,0.12)',
  footerBg:        '#0D1B2A',
  footerBorder:    'rgba(255,255,255,0.10)',
  footerText:      '#718096',
  footerTextStrong:'#FFFFFF',
  logoBrandColor:  '#FFFFFF',
  particleColor:   'rgba(26,188,156,0.15)',
  orbColor1:       'rgba(26,188,156,0.15)',
  orbColor2:       'rgba(26,188,156,0.10)',
  orbColor3:       'rgba(10,80,60,0.20)',
  inlineCardBg:    'rgba(255,255,255,0.04)',
  inlineCardBorder:'rgba(255,255,255,0.06)',
  primaryAccent:      '#9D6B6B',
  primaryAccentHover: '#8A5A5A',
  primaryAccentSubtle:'rgba(157,107,107,0.15)',
  primaryAccentText:  '#9D6B6B',
  goldAccent:         '#E6B566',
  goldSubtle:         'rgba(230,181,102,0.12)',
  goldText:           '#C4973D',
  deepForest:         '#2A3F54',
  deepForestSubtle:   'rgba(42,63,84,0.15)',
  statusFresh:     '#2E8A74',
  statusFreshBg:   'rgba(46,138,116,0.15)',
  statusWarning:   '#D4A94D',
  statusWarningBg: 'rgba(212,169,77,0.15)',
  statusError:     '#B85C5C',
  statusErrorBg:   'rgba(184,92,92,0.15)',
  statusInfo:      '#5A7FAF',
  statusInfoBg:    'rgba(90,127,175,0.15)',
  checkboxBg:      '#0D1B2A',
  checkboxBorder:  'rgba(26,188,156,0.3)',
  checkboxChecked: '#1ABC9C',
  statCardAlt1:    '#112240',
  statCardAlt2:    '#1B2B4B',
  statCardAlt3:    '#0D1B2A',
  statCardAlt4:    '#1A2A4A',
  formLabel:       '#FFFFFF',
  urgentPulse:     'rgba(184,92,92,0.15)',
  warningPulse:    'rgba(212,169,77,0.15)',
  successPulse:    'rgba(46,138,116,0.15)',
};

// ─── Context ─────────────────────────────────────────────────────────────────
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
