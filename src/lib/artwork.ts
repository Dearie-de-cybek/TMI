/**
 * Photographs supplied by TwainMan Ministry.
 *
 * `require` on an image returns a module id (a number) in React Native, which
 * is what both `expo-image` and `Image` accept directly.
 *
 * Every file here is resized from the church's original into the size the app
 * actually displays — the originals run to 2560px and 700KB apiece, which have
 * no business in a phone bundle. Originals are kept in `assets/images/church/`
 * for re-cropping.
 *
 * Two portraits the church sent (ch9, ch10) are deliberately not registered: a
 * named person's photograph should not become decoration without being asked.
 *
 * In production these should come from the API as `artwork_url`. Bundling them
 * is how the app looks right before the backend exists.
 */
export const churchImages = {
  /** The congregation dancing — the welcome screen and the featured teaching. */
  congregationPortrait: require('@/assets/images/church/congregation-portrait.jpg') as number,
  congregationBanner: require('@/assets/images/church/congregation-banner.jpg') as number,

  /** Pastor Patrick Evbomoen, Gethsemane Camp Meeting '24 (confirmed likeness). */
  pastorPatrick: require('@/assets/images/church/pastor-patrick.jpg') as number,
  pastorPatrickPortrait: require('@/assets/images/church/pastor-patrick-portrait.jpg') as number,

  /** The church's own flyers. */
  eventBlessingTheWork: require('@/assets/images/church/event-blessing-the-work.jpg') as number,
  eventBackAndBetter: require('@/assets/images/church/lib/event-back-and-better.jpg') as number,

  /** Teaching and worship. */
  teachingSuit: require('@/assets/images/church/lib/teaching-suit.jpg') as number,
  teachingSeated: require('@/assets/images/church/lib/teaching-seated.jpg') as number,
  teachingKeyboard: require('@/assets/images/church/lib/teaching-keyboard.jpg') as number,
  worshipLead: require('@/assets/images/church/lib/worship-lead.jpg') as number,
  worshipSinging: require('@/assets/images/church/lib/worship-singing.jpg') as number,
  worshipWoman: require('@/assets/images/church/lib/worship-woman.jpg') as number,

  /** Prayer — the decrees, the devotional, the prayer screens. */
  prayerCongregation: require('@/assets/images/church/lib/prayer-congregation.jpg') as number,
  prayerHandsRaised: require('@/assets/images/church/lib/prayer-hands-raised.jpg') as number,
  prayerWeeping: require('@/assets/images/church/lib/prayer-weeping.jpg') as number,
  prayerQuiet: require('@/assets/images/church/lib/prayer-quiet.jpg') as number,
  prayerClasped: require('@/assets/images/church/lib/prayer-clasped.jpg') as number,
  prayerYouth: require('@/assets/images/church/lib/prayer-youth.jpg') as number,
  praiseShout: require('@/assets/images/church/lib/praise-shout.jpg') as number,
  praiseJoy: require('@/assets/images/church/lib/praise-joy.jpg') as number,

  /** The life of the house. */
  youthAuditorium: require('@/assets/images/church/lib/youth-auditorium.jpg') as number,
  fellowshipMen: require('@/assets/images/church/lib/fellowship-men.jpg') as number,
  communionTable: require('@/assets/images/church/lib/communion-table.jpg') as number,
} as const;

export type ChurchImageKey = keyof typeof churchImages;

/**
 * Resolves an artwork reference from the API.
 *
 * The backend returns `artwork_url`. Until it does, data can name one of the
 * church's own photographs with `asset:<key>`, which resolves to a bundled
 * image. Anything else is treated as a remote URL.
 */
export function resolveArtwork(
  value: string | null | undefined
): { local: number } | { uri: string } | null {
  if (!value) return null;
  if (value.startsWith('asset:')) {
    const key = value.slice('asset:'.length) as ChurchImageKey;
    const local = churchImages[key];
    return local ? { local } : null;
  }
  return { uri: value };
}

/** Shorthand for data files: `asset('prayerQuiet')`. */
export function asset(key: ChurchImageKey): string {
  return `asset:${key}`;
}
