// The looks a child can choose for their wizard (D36, D61), four for a girl and
// four for a boy, each four with the four skin tones. Each has an id, which the
// progress document keeps and which picks the wizard's sprite sheet, and its
// colours and hair style, by which the friends' sets are chosen too (D90).
// The figure is the word:
// a look has no name to translate. Nothing here imitates a famous wizard: no
// grey robe and long beard, no stars and moons, no school colours of a story.

export type HairStyle = 'short' | 'long';

export interface Look {
  id: string;
  /** Whether the look is a girl's or a boy's (D61): the creator shows the gender's. */
  gender: 'girl' | 'boy';
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  robe: string;
  hat: string;
  /** The band round the hat. */
  band: string;
}

/** Four skin tones, each with both hair styles across the looks. */
const SKIN = {
  paler: '#f6d5b8',
  pale: '#e9b98f',
  brown: '#c68a5a',
  dark: '#8d5524',
};

export const LOOKS: readonly Look[] = [
  {
    id: 'amber',
    gender: 'boy',
    skin: SKIN.pale,
    hair: '#6b4a2b',
    hairStyle: 'short',
    robe: '#d9822b',
    hat: '#a85d14',
    band: '#ffe08a',
  },
  {
    id: 'teal',
    gender: 'girl',
    skin: SKIN.brown,
    hair: '#1f1a17',
    hairStyle: 'long',
    robe: '#1f9e89',
    hat: '#146b5d',
    band: '#ffd43b',
  },
  {
    id: 'plum',
    gender: 'boy',
    skin: SKIN.dark,
    hair: '#1f1a17',
    hairStyle: 'short',
    robe: '#8e4bb5',
    hat: '#5f2d82',
    band: '#f3c4ff',
  },
  {
    id: 'rose',
    gender: 'girl',
    skin: SKIN.paler,
    hair: '#b5502a',
    hairStyle: 'long',
    robe: '#d6517d',
    hat: '#9c2f55',
    band: '#ffe08a',
  },
  {
    id: 'moss',
    gender: 'boy',
    skin: SKIN.paler,
    hair: '#e0c060',
    hairStyle: 'short',
    robe: '#5c8a2e',
    hat: '#3d5e1d',
    band: '#ffd43b',
  },
  {
    id: 'sky',
    gender: 'girl',
    skin: SKIN.dark,
    hair: '#2b211b',
    hairStyle: 'long',
    robe: '#3b8fd6',
    hat: '#24609a',
    band: '#ffffff',
  },
  {
    id: 'sand',
    gender: 'boy',
    skin: SKIN.brown,
    hair: '#4a3020',
    hairStyle: 'short',
    robe: '#c9a36a',
    hat: '#8a6b3c',
    band: '#5c3d1e',
  },
  {
    id: 'coral',
    gender: 'girl',
    skin: SKIN.pale,
    hair: '#6b4a2b',
    hairStyle: 'long',
    robe: '#e86a4f',
    hat: '#a8402c',
    band: '#ffe08a',
  },
];

export const DEFAULT_LOOK: Look = LOOKS[0] as Look;

export function isLook(id: string): boolean {
  return LOOKS.some((look) => look.id === id);
}

/** The look of that id, or the first look for an id the game does not have. */
export function lookOf(id: string | null | undefined): Look {
  return LOOKS.find((look) => look.id === id) ?? DEFAULT_LOOK;
}

/** The looks for a wizard of a gender, in the order they are shown. */
export function looksFor(gender: Look['gender']): Look[] {
  return LOOKS.filter((look) => look.gender === gender);
}

/** The two friends of the story (D77), by their gender: Nuri, a girl, and Teku, a
 * boy. */
export const FRIENDS: Record<Look['gender'], string> = { girl: 'nuri', boy: 'teku' };

/** The friend who meets a wizard of this gender at the gate and teaches it (D77):
 * the one of the other gender, its id and its gender. The figure it is drawn from
 * and the name and words it is given are both decided by this. */
export function teacherFriend(wizardGender: Look['gender'] | null): { id: string; gender: Look['gender'] } {
  const gender: Look['gender'] = wizardGender === 'girl' ? 'boy' : 'girl';
  return { id: FRIENDS[gender], gender };
}

/** A friend's colours (D90): the robe, the hat and its band, as a look's. */
export interface FriendColours {
  robe: string;
  hat: string;
  band: string;
}

/** Each friend's two sets of colours (D90), chosen far apart: Nuri green or
 * burgundy, Teku orange or navy. tools/art/figures.py draws a sheet for each,
 * `<friend>-<set>`. */
export const FRIEND_SETS: Record<'nuri' | 'teku', Record<'a' | 'b', FriendColours>> = {
  nuri: {
    a: { robe: '#3f8f5a', hat: '#2f6b44', band: '#e8c547' },
    b: { robe: '#9b2d3a', hat: '#6b1d27', band: '#e8c547' },
  },
  teku: {
    a: { robe: '#c86f2c', hat: '#8a4515', band: '#3fa7c9' },
    b: { robe: '#33438f', hat: '#222d63', band: '#e89a3f' },
  },
};

/** A colour in CIELAB, from its hex. */
function lab(hex: string): [number, number, number] {
  const channel = (at: number) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [channel(1), channel(3), channel(5)];
  const [x, y, z] = [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883,
  ];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** How far apart two colours look, CIE76's ΔE. */
export function colourDistance(one: string, other: string): number {
  const [a, b] = [lab(one), lab(other)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Each friend's set for a wizard's look (D90): of the four pairings of Nuri's
 * and Teku's sets, the one whose three robes, the wizard's and the two friends',
 * stand farthest apart, the closest two of them counting. Decided by the look
 * alone, so that a friend wears the same colours all the game. */
export function friendSets(look: Pick<Look, 'robe'>): Record<'nuri' | 'teku', 'a' | 'b'> {
  let best = { nuri: 'a' as 'a' | 'b', teku: 'a' as 'a' | 'b', apart: -1 };
  for (const nuri of ['a', 'b'] as const) {
    for (const teku of ['a', 'b'] as const) {
      const [n, t] = [FRIEND_SETS.nuri[nuri].robe, FRIEND_SETS.teku[teku].robe];
      const apart = Math.min(colourDistance(n, look.robe), colourDistance(t, look.robe), colourDistance(n, t));
      if (apart > best.apart) best = { nuri, teku, apart };
    }
  }
  return { nuri: best.nuri, teku: best.teku };
}

/** The sheet a friend is drawn from for a wizard's look: `nuri-a`, `teku-b`... */
export function friendSheet(friendId: string, look: Pick<Look, 'robe'>): string {
  if (friendId !== 'nuri' && friendId !== 'teku') return friendId;
  return `${friendId}-${friendSets(look)[friendId]}`;
}

/** The wizard's dormitory mate (D84): the friend of the wizard's own gender, a boy
 * when there is no wizard yet, as the words take a boy then. */
export function dormitoryMate(wizardGender: Look['gender'] | null): { id: string; gender: Look['gender'] } {
  const gender: Look['gender'] = wizardGender ?? 'boy';
  return { id: FRIENDS[gender], gender };
}
