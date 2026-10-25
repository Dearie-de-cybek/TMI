/**
 * Kingdom Heralds — design tokens.
 *
 * The visual language is editorial rather than dashboard-like: parchment paper,
 * ink type, a deep forest green for the ministry voice, and brass for accents and
 * eyebrow labels. Surfaces are tonal and separated by hairlines instead of cards
 * with heavy shadows, so type and imagery carry the hierarchy.
 *
 * Only semantic names are consumed by components. Raw values live in `palette`
 * and must not be imported outside this file.
 */

const palette = {
  // Parchment / ivory
  parchment50: '#FDFBF6',
  parchment100: '#F7F3EC',
  parchment200: '#EFE8DB',
  parchment300: '#E3D9C6',
  parchment400: '#CFC3AB',

  // Ink
  ink900: '#15150F',
  ink800: '#1C1D16',
  ink700: '#24261D',
  ink600: '#3A3C31',
  ink400: '#6A6B5E',
  ink300: '#8C8C7E',
  ink200: '#B5B4A5',

  // Forest / olive — the ministry voice
  forest900: '#16271E',
  forest800: '#1E382A',
  forest700: '#2F4A3C',
  forest600: '#3D6350',
  forest500: '#4F7D66',
  forest300: '#8FB39D',
  forest200: '#B9D0C2',
  forest100: '#E2EBE4',

  // Brass / ochre — accents, eyebrows, scripture marks
  brass700: '#7C5E22',
  brass600: '#9A762F',
  brass500: '#B08A3C',
  brass400: '#C7A75C',
  brass300: '#DCC48C',
  brass100: '#F2E7CE',

  // Status
  clay700: '#8C3A2B',
  clay600: '#A84834',
  clay400: '#D08B7C',
  clay100: '#F6E3DE',
  moss700: '#3E6B33',
  moss400: '#8FB882',
  moss100: '#E6F0E0',
  amber700: '#8A5E12',
  amber400: '#D8AA52',
  amber100: '#F8EBCF',

  white: '#FFFFFF',
} as const;

export type ColorScheme = 'light' | 'dark';

/**
 * Semantic colour roles. Both schemes are designed independently — the dark
 * scheme is a warm ink-on-charcoal reading theme, not an inversion of the light one.
 */
export const colors = {
  light: {
    /** Page background — warm parchment. */
    background: palette.parchment100,
    /** Raised reading surface (sheets, detail pages). */
    surface: palette.parchment50,
    /** Tonal block used to group content without a card border. */
    surfaceMuted: palette.parchment200,
    /** Pressed / selected tonal state. */
    surfacePressed: palette.parchment300,
    /** Inverted surface for players and scripture plates. */
    surfaceInverse: palette.forest900,

    text: palette.ink900,
    textSecondary: palette.ink400,
    textTertiary: palette.ink300,
    textOnInverse: palette.parchment100,
    textOnInverseSecondary: palette.forest200,
    textOnAccent: palette.white,

    /** Hairline rules that replace card borders. */
    border: palette.parchment300,
    borderStrong: palette.parchment400,

    primary: palette.forest700,
    primaryHover: palette.forest600,
    primarySoft: palette.forest100,
    primaryOnSoft: palette.forest800,

    accent: palette.brass600,
    accentSoft: palette.brass100,
    accentOnSoft: palette.brass700,

    danger: palette.clay600,
    dangerSoft: palette.clay100,
    dangerOnSoft: palette.clay700,
    success: palette.moss700,
    successSoft: palette.moss100,
    successOnSoft: palette.moss700,
    warning: palette.amber700,
    warningSoft: palette.amber100,
    warningOnSoft: palette.amber700,

    /** Scrim over full-bleed imagery so overlaid type stays legible. */
    scrim: 'rgba(21, 21, 15, 0.55)',
    scrimStrong: 'rgba(21, 21, 15, 0.78)',
    skeleton: palette.parchment200,
    skeletonHighlight: palette.parchment300,
    overlay: 'rgba(21, 21, 15, 0.42)',
  },
  dark: {
    background: palette.ink900,
    surface: palette.ink800,
    surfaceMuted: palette.ink700,
    surfacePressed: palette.ink600,
    surfaceInverse: palette.parchment100,

    text: palette.parchment100,
    textSecondary: palette.parchment400,
    textTertiary: palette.ink200,
    textOnInverse: palette.ink900,
    textOnInverseSecondary: palette.ink600,
    textOnAccent: palette.ink900,

    border: palette.ink600,
    borderStrong: palette.ink400,

    primary: palette.forest300,
    primaryHover: palette.forest200,
    primarySoft: palette.forest900,
    primaryOnSoft: palette.forest200,

    accent: palette.brass400,
    accentSoft: '#2A2416',
    accentOnSoft: palette.brass300,

    danger: palette.clay400,
    dangerSoft: '#30211D',
    dangerOnSoft: palette.clay400,
    success: palette.moss400,
    successSoft: '#1D2A1A',
    successOnSoft: palette.moss400,
    warning: palette.amber400,
    warningSoft: '#2C2416',
    warningOnSoft: palette.amber400,

    scrim: 'rgba(10, 10, 7, 0.60)',
    scrimStrong: 'rgba(10, 10, 7, 0.82)',
    skeleton: palette.ink700,
    skeletonHighlight: palette.ink600,
    overlay: 'rgba(0, 0, 0, 0.60)',
  },
} as const;

/**
 * Structural shape of a scheme. Declared as `string` values so the light and
 * dark objects are interchangeable while the key set stays exhaustive — adding a
 * role to one scheme and not the other is a compile error.
 */
export type ThemeColors = { readonly [Role in keyof typeof colors.light]: string };
export type ColorToken = keyof ThemeColors;

const _schemesAreExhaustive: Record<ColorScheme, ThemeColors> = colors;
void _schemesAreExhaustive;

/** 4pt base scale. `gutter` is the single horizontal page inset used everywhere. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
  gutter: 20,
} as const;

/**
 * Corners are deliberately tight. Only avatars are fully round; nothing else
 * uses a pill shape except the audio progress rail.
 */
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 10,
  pill: 999,
} as const;

export const fonts = {
  serifRegular: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  serifSemiBold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

/**
 * Type ramp. `display`/`title`/`headline`/`scripture` are the editorial serif
 * voices; everything functional is Inter.
 */
export const typeScale = {
  display: { fontFamily: fonts.serifSemiBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  headline: { fontFamily: fonts.serifSemiBold, fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  scripture: { fontFamily: fonts.serifRegular, fontSize: 20, lineHeight: 32, letterSpacing: 0 },
  quote: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 28, letterSpacing: 0 },

  /** Small tracked uppercase label used above section titles. */
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1 },
  bodyLarge: { fontFamily: fonts.sansRegular, fontSize: 17, lineHeight: 26, letterSpacing: 0 },
  body: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 23, letterSpacing: 0 },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 23, letterSpacing: 0 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  labelStrong: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  meta: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  metaStrong: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontFamily: fonts.sansRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  tab: { fontFamily: fonts.sansMedium, fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
} as const;

export type TypeToken = keyof typeof typeScale;

export const hairline = 1;

/** Minimum touch target, honoured by every pressable primitive. */
export const minTouchTarget = 44;

export const duration = {
  instant: 90,
  fast: 160,
  normal: 240,
} as const;

export const layout = {
  /** Readable measure for long-form text on tablets. */
  maxReadingWidth: 640,
  maxContentWidth: 760,
} as const;
