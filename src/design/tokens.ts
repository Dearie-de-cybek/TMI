/**
 * TwainMan Ministry International — design tokens.
 *
 * The church's colours are purple and gold, so the app is built on them: a deep
 * aubergine purple for the ministry's own voice, warm gold for the marks that
 * organise a page, on a warm ivory ground. The language stays editorial — type
 * and space carry the hierarchy, not boxes — but colour now does one extra job:
 * it separates a long page into bands you can feel without reading, the way a
 * well-made book changes paper between its parts.
 *
 * Every pairing below was checked against WCAG AA before it was written down.
 * Only semantic names are consumed by components; raw values live in `palette`.
 */

const palette = {
  // Ivory ground, warmed slightly so purple sits on it without going cold.
  ivory50: '#FFFDF9',
  ivory100: '#F8F5F0',
  ivory200: '#F0EAF0',
  ivory300: '#E4D9E6',
  ivory400: '#CFC0D1',

  // Ink, carrying a trace of purple so text belongs to the same family.
  ink900: '#15101A',
  ink800: '#1C141F',
  ink700: '#2A2133',
  ink600: '#3A2F45',
  ink400: '#5E5162',
  ink300: '#8B7F8E',
  ink200: '#9A8DA1',

  // Purple — the ministry's voice.
  purple900: '#1B0F24',
  purple800: '#241430',
  purple700: '#3A1F49',
  purple600: '#4A2A5A',
  purple500: '#5C3570',
  purple300: '#C4A5D6',
  purple200: '#D9C4E6',
  purple100: '#EDE4F2',
  purple50: '#F3EDF6',

  // Gold — eyebrows, Scripture marks, the active indicator, the play button.
  gold700: '#7A5C1E',
  gold600: '#9A762F',
  gold500: '#C19A38',
  gold400: '#D9B463',
  gold300: '#E8CE92',
  gold100: '#F7EEDA',
  gold50: '#FAF4E6',

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
    /** Page ground — warm ivory. */
    background: palette.ivory100,
    /** Raised reading surface. */
    surface: palette.ivory50,
    /** Tonal block used to group content without a border. */
    surfaceMuted: palette.ivory200,
    surfacePressed: palette.ivory300,
    /** Deep plum plate: the player, the featured block, the live strip. */
    surfaceInverse: palette.purple800,

    text: palette.ink800,
    textSecondary: palette.ink400,
    textTertiary: palette.ink300,
    textOnInverse: '#F6F1F7',
    textOnInverseSecondary: '#C9B6D2',
    /** Label colour on a filled primary or danger button. */
    textOnAccent: palette.white,
    /** Glyph colour on a filled gold control, where white would be too pale. */
    onAccentFill: palette.ink800,

    border: palette.ivory300,
    borderStrong: palette.ivory400,

    primary: palette.purple600,
    primaryHover: palette.purple500,
    primarySoft: palette.purple100,
    primaryOnSoft: palette.purple700,

    accent: palette.gold600,
    accentSoft: palette.gold100,
    accentOnSoft: palette.gold700,
    /** Gold bright enough to read as a fill on the plum plate. */
    accentFill: palette.gold500,

    /**
     * Section grounds. Barely over 1.05:1 against the page — enough to tell one
     * part of Home from the next, never enough to shout.
     */
    bandPrimary: palette.purple50,
    bandAccent: palette.gold50,
    bandNeutral: palette.ivory200,

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
    scrim: 'rgba(27, 15, 36, 0.52)',
    scrimStrong: 'rgba(27, 15, 36, 0.78)',
    skeleton: palette.ivory200,
    skeletonHighlight: palette.ivory300,
    overlay: 'rgba(27, 15, 36, 0.45)',
  },
  dark: {
    background: palette.ink900,
    surface: '#1E1726',
    surfaceMuted: palette.ink700,
    surfacePressed: palette.ink600,
    surfaceInverse: '#F4EFF6',

    text: '#F4EFF6',
    textSecondary: '#C3B6C9',
    textTertiary: palette.ink200,
    textOnInverse: palette.ink900,
    textOnInverseSecondary: palette.ink600,
    textOnAccent: palette.ink900,
    onAccentFill: palette.ink900,

    border: palette.ink600,
    borderStrong: palette.ink400,

    primary: palette.purple300,
    primaryHover: palette.purple200,
    primarySoft: '#2A1C35',
    primaryOnSoft: palette.purple200,

    accent: palette.gold400,
    accentSoft: '#2E2616',
    accentOnSoft: palette.gold300,
    accentFill: palette.gold400,

    bandPrimary: '#221A2B',
    bandAccent: '#241E14',
    bandNeutral: '#1B1622',

    danger: palette.clay400,
    dangerSoft: '#30201D',
    dangerOnSoft: palette.clay400,
    success: palette.moss400,
    successSoft: '#1C2A1D',
    successOnSoft: palette.moss400,
    warning: palette.amber400,
    warningSoft: '#2C2416',
    warningOnSoft: palette.amber400,

    scrim: 'rgba(10, 6, 14, 0.58)',
    scrimStrong: 'rgba(10, 6, 14, 0.82)',
    skeleton: palette.ink700,
    skeletonHighlight: palette.ink600,
    overlay: 'rgba(0, 0, 0, 0.62)',
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
