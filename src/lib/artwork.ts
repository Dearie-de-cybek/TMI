/**
 * Photographs supplied by the church.
 *
 * `require` on an image returns a module id (a number) in React Native, which is
 * what both `expo-image` and `Image` accept directly.
 *
 * Everything here is a real TwainMan Ministry photograph, resized from the
 * originals in `assets/images/` into the sizes the app actually displays — the
 * congregation original is 3024×4032 and 2.3 MB, which has no business being in
 * a phone bundle. The originals are kept alongside for re-cropping.
 *
 * Anything the church has not supplied is drawn as generated artwork
 * (`components/content/graphic-plate.tsx`) rather than filled with stock
 * photography.
 */
export const churchImages = {
  /** The congregation dancing — used full-bleed on the welcome screen. */
  congregationPortrait: require('@/assets/images/church/congregation-portrait.jpg') as number,
  /** The same moment, cropped wide for the Home banner. */
  congregationBanner: require('@/assets/images/church/congregation-banner.jpg') as number,
  /** Pastor Patrick Evbomoen ministering, Gethsemane Camp Meeting '24. */
  pastorPatrick: require('@/assets/images/church/pastor-patrick.jpg') as number,
  /** Square crop of the same photograph, for the speaker portrait. */
  pastorPatrickPortrait: require('@/assets/images/church/pastor-patrick-portrait.jpg') as number,
  /** The church's own flyer for the monthly service. */
  eventBlessingTheWork: require('@/assets/images/church/event-blessing-the-work.jpg') as number,
} as const;

export type ChurchImageKey = keyof typeof churchImages;

/**
 * Resolves an artwork reference from the API.
 *
 * The backend returns `artwork_url`. Until it does, the development data can
 * name one of the church's own photographs with `asset:<key>`, which resolves
 * to a bundled image. Anything else is treated as a remote URL.
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
