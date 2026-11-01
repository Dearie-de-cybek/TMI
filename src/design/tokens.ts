/**
 * TwainMan Ministry International — design tokens.
 *
 * One major colour, taken from the church's own logo: a deep maroon. Everything
 * else is neutral — white cards on a light grey page, near-black type, black
 * actions — so the colour in the app comes from the church's photographs and
 * the maroon is saved for the few things that deserve to be noticed: the active
 * tab, links, progress, the streak. Gold survives only as a small highlight.
 *
 * Every pairing below was checked against WCAG AA before it was written down.
 * Only semantic names are consumed by components; raw values live in `palette`.
 */

const palette = {
  // Neutral ground. Cool-leaning, never cream.
  paper0: '#FFFFFF',
  paper50: '#FAFAFA',
  paper100: '#F3F3F4',
  paper200: '#EAEAEC',
  paper300: '#DEDEE2',
  paper400: '#C9C9CF',

  // Ink.
  ink900: '#111112',
  ink800: '#161618',
  ink700: '#232327',
  ink600: '#2E2E33',
  ink500: '#55555B',
  ink300: '#74747B',
  ink200: '#8A8A92',

  // Maroon — the ministry's voice, from the logo.
  maroon800: '#3D111C',
  maroon700: '#6B1B2C',
  maroon600: '#8A2236',
  maroon500: '#A32D43',
  maroon300: '#E39AA8',
  maroon200: '#F0C7CF',
  maroon100: '#F9E6EA',

  // Gold — the logo's flame. Small highlights only.
  gold700: '#7A5C1E',
  gold600: '#9A762F',
  gold500: '#D9A441',
  gold400: '#E3B965',
  gold300: '#EBCF93',
  gold100: '#F7EEDA',

  // Status — kept muted so they never compete with the church's own colours.
  clay700: '#8A3128',
  clay600: '#A33B33',
  clay400: '#DE9289',
  clay100: '#F8E5E2',
  moss700: '#355B3A',
  moss600: '#3F6B45',
  moss400: '#8FBE95',
  moss100: '#E4EFE5',
  amber700: '#8A5E12',
  amber400: '#D9B463',
  amber100: '#F8EBCF',

  white: '#FFFFFF',
} as const;

export type ColorScheme = 'light' | 'dark';

/**
 * Semantic colour roles. The two schemes are designed independently — the dark
 * one is a plum-ink reading theme, not an inversion of the light one.
 */
export const colors = {
  light: {
    /** Page ground — a light grey that lets white cards lift off it. */
    background: palette.paper50,
    /** Cards and reading surfaces. */
    surface: palette.paper0,
    /** Tonal block used to group content without a border. */
    surfaceMuted: palette.paper100,
    surfacePressed: palette.paper200,
    /**
     * The dark plate: the player, the confession, the live strip. A maroon-black
     * in both schemes, so photographs and gold read well on it.
     */
    surfaceInverse: '#1A0C10',

    text: palette.ink800,
    textSecondary: palette.ink500,
    textTertiary: palette.ink300,
    textOnInverse: palette.white,
    textOnInverseSecondary: 'rgba(255, 255, 255, 0.78)',
    /** Label colour on a filled primary or danger button. */
    textOnAccent: palette.white,
    /** Glyph colour on a filled gold control, where white would be too pale. */
    onAccentFill: palette.ink900,

    /** The black of the primary button, and the white label on it. */
    ink: palette.ink900,
    onInk: palette.white,

    border: palette.paper200,
    borderStrong: palette.paper300,

    primary: palette.maroon600,
    primaryHover: palette.maroon500,
    primarySoft: palette.maroon100,
    primaryOnSoft: palette.maroon700,

    accent: palette.gold600,
    accentSoft: palette.gold100,
    accentOnSoft: palette.gold700,
    /** Gold bright enough to read as a fill on the dark plate. */
    accentFill: palette.gold500,

    /**
     * Section grounds. Barely tinted — enough to tell one part of a long page
     * from the next, never enough to shout.
     */
    bandPrimary: '#F6F0F2',
    bandAccent: palette.paper100,
    bandNeutral: '#EFEFF1',

    danger: palette.clay600,
    dangerSoft: palette.clay100,
    dangerOnSoft: palette.clay700,
    success: palette.moss600,
    successSoft: palette.moss100,
    successOnSoft: palette.moss700,
    warning: palette.amber700,
    warningSoft: palette.amber100,
    warningOnSoft: palette.amber700,

    /** Scrim over photographs so overlaid type stays legible. */
    scrim: 'rgba(14, 6, 9, 0.5)',
    scrimStrong: 'rgba(14, 6, 9, 0.8)',
    skeleton: palette.paper100,
    skeletonHighlight: palette.paper200,
    overlay: 'rgba(14, 6, 9, 0.5)',
  },
  dark: {
    background: '#0E0E10',
    surface: '#18181B',
    surfaceMuted: palette.ink700,
    surfacePressed: palette.ink600,
    surfaceInverse: '#2A1319',

    text: '#F5F5F6',
    textSecondary: '#B8B8BF',
    textTertiary: palette.ink200,
    textOnInverse: palette.white,
    textOnInverseSecondary: 'rgba(255, 255, 255, 0.78)',
    textOnAccent: palette.ink900,
    onAccentFill: palette.ink900,

    ink: palette.white,
    onInk: palette.ink900,

    border: '#2E2E33',
    borderStrong: '#46464D',

    primary: palette.maroon300,
    primaryHover: palette.maroon200,
    primarySoft: '#2B151B',
    primaryOnSoft: palette.maroon200,

    accent: palette.gold400,
    accentSoft: '#2E2616',
    accentOnSoft: palette.gold300,
    accentFill: palette.gold400,

    bandPrimary: '#1A1517',
    bandAccent: '#141416',
    bandNeutral: '#1C1C1F',

    danger: palette.clay400,
    dangerSoft: '#30201D',
    dangerOnSoft: palette.clay400,
    success: palette.moss400,
    successSoft: '#1C2A1D',
    successOnSoft: palette.moss400,
    warning: palette.amber400,
    warningSoft: '#2C2416',
    warningOnSoft: palette.amber400,

    scrim: 'rgba(6, 3, 5, 0.45)',
    scrimStrong: 'rgba(6, 3, 5, 0.85)',
    skeleton: palette.ink700,
    skeletonHighlight: palette.ink600,
    overlay: 'rgba(0, 0, 0, 0.66)',
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
 * Soft, generous corners: cards are 24, controls and chips are fully round.
 */
export const radius = {
  none: 0,
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
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
  sansExtraBold: 'Inter_800ExtraBold',
} as const;

/**
 * Type ramp. Titles are bold, tight sans at a confident size; the serif is kept
 * for Scripture and the church's own words (`scripture`, `quote`).
 */
export const typeScale = {
  display: { fontFamily: fonts.sansExtraBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.9 },
  title: { fontFamily: fonts.sansBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  headline: { fontFamily: fonts.sansBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.35 },
  scripture: { fontFamily: fonts.serifRegular, fontSize: 20, lineHeight: 32, letterSpacing: 0 },
  quote: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 28, letterSpacing: 0 },

  /** Small label used above section titles. */
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  bodyLarge: { fontFamily: fonts.sansRegular, fontSize: 17, lineHeight: 26, letterSpacing: 0 },
  body: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  labelStrong: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  meta: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 19, letterSpacing: 0 },
  metaStrong: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 19, letterSpacing: 0 },
  caption: { fontFamily: fonts.sansRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  tab: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
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
