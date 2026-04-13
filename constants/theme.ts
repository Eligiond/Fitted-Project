export const lightColors = {
  background: '#e8e8e6',
  surface: '#ffffff',
  accent: '#dffa10',
  midGrey: '#464646',
  mutedText: '#6b6b6b',
  primaryText: '#111111',
  cardBorder: 'rgba(0,0,0,0.07)',
  separator: 'rgba(0,0,0,0.1)',
  navBackground: 'rgba(255,255,255,0.85)',
  inputBackground: '#f5f5f3',
  destructive: '#ff4444',
  white: '#ffffff',
  black: '#111111',
  overlay: 'rgba(0,0,0,0.45)',
  heartRed: '#ff2d55',
};

export const darkColors: typeof lightColors = {
  background: '#111111',
  surface: '#1c1c1c',
  accent: '#dffa10',
  midGrey: '#464646',
  mutedText: '#6b6b6b',
  primaryText: '#e8e8e6',
  cardBorder: 'rgba(255,255,255,0.08)',
  separator: 'rgba(255,255,255,0.12)',
  navBackground: 'rgba(17,17,17,0.85)',
  inputBackground: '#2a2a2a',
  destructive: '#ff4444',
  white: '#ffffff',
  black: '#111111',
  overlay: 'rgba(0,0,0,0.65)',
  heartRed: '#ff2d55',
};

export type ThemeColors = typeof lightColors;

export const SPRING_FAST = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

export const SPRING_MEDIUM = {
  damping: 18,
  stiffness: 250,
  mass: 1,
};

export const SPRING_SOFT = {
  damping: 20,
  stiffness: 160,
  mass: 1,
};

export const SPRING_BOUNCY = {
  damping: 10,
  stiffness: 200,
  mass: 0.9,
};

export const RADII = {
  card: 20,
  cardLarge: 28,
  pill: 28,
  pillFilter: 18,
  button: 28,
  input: 14,
  avatar: 9999,
  fab: 30,
};

export const SIZES = {
  buttonHeight: 56,
  pillFilterHeight: 36,
  fabSize: 60,
  iconButton: 44,
  navHeight: 68,
  navBottom: 16,
  navHorizontalPadding: 20,
};
