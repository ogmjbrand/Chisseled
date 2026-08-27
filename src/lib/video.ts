/**
 * The supplied brand films, and where each one plays.
 *
 * ------------------------------------------------------------------
 * PROVISIONAL ASSIGNMENT — needs one look from a human to confirm.
 *
 * This container has no H.264 decoder (the bundled ffmpeg is a stripped
 * screencast build, and Chromium here ships without proprietary codecs), so
 * the clips could not be viewed before wiring them. The roles below are
 * inferred from duration and bitrate, not from watching:
 *
 *   f0cfce6a  17.1s  1150 kbps  dense, motion-heavy  -> read as live action
 *   ac54cc7f   6.1s   269 kbps  flat, compresses well -> read as motion design
 *
 * To correct a mapping, change the slug on the role below. Nothing else
 * needs to move — the files are named by content hash on purpose.
 * ------------------------------------------------------------------
 */

export interface BrandFilm {
  /** File under /media/video, without extension. */
  file: string;
  /** Seconds. */
  duration: number;
  width: number;
  height: number;
  /** What the clip is doing, for the accessible description. */
  description: string;
}

export const FILMS = {
  /** Hero. The car-race film. */
  hero: {
    file: "f0cfce6a",
    duration: 17.1,
    width: 720,
    height: 1280,
    description: "A race sequence, cut fast.",
  },
  /** Order confirmation. The envelope, opening after payment clears. */
  envelope: {
    file: "ac54cc7f",
    duration: 6.1,
    width: 720,
    height: 1280,
    description: "An envelope opening to reveal the order confirmation.",
  },
  /** The remaining films, played across the editorial surfaces. */
  campaign: {
    file: "d8ffe636",
    duration: 64.3,
    width: 720,
    height: 1280,
    description: "The long-form brand campaign film.",
  },
  method: {
    file: "844060f6",
    duration: 32.9,
    width: 720,
    height: 1280,
    description: "The method, shown as a sequence.",
  },
  training: {
    file: "80b2f9cb",
    duration: 13.6,
    width: 720,
    height: 1280,
    description: "A training session in progress.",
  },
  community: {
    file: "cf80c0e5",
    duration: 18.5,
    width: 720,
    height: 800,
    description: "The community, training together.",
  },
  fuel: {
    file: "94b9947f",
    duration: 9.8,
    width: 720,
    height: 1280,
    description: "Fuel and recovery.",
  },
  drop: {
    file: "d88841e9",
    duration: 8.1,
    width: 720,
    height: 1280,
    description: "A product drop announcement.",
  },
  loyalty: {
    file: "c9339068",
    duration: 6.6,
    width: 720,
    height: 1280,
    description: "A membership and rewards sequence.",
  },
} as const satisfies Record<string, BrandFilm>;

export type FilmRole = keyof typeof FILMS;

export function film(role: FilmRole): BrandFilm {
  return FILMS[role];
}

/**
 * Every clip is 9:16 phone video except `community` (720x800).
 *
 * That matters for layout: covering a 1440x900 desktop viewport with a 9:16
 * source shows 35% of the frame and upscales 720p by 2x. So these play
 * full-bleed only where the viewport is itself portrait, and are composed at
 * their native aspect everywhere else. See BrandVideo.
 */
export function isPortrait(f: BrandFilm): boolean {
  return f.height > f.width;
}
