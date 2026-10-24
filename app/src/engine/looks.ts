// The looks a child can choose for their wizard (D36, D61), four for a girl and
// four for a boy, each four with the four skin tones. Each has an id, which the
// progress document keeps, and for now the colours and hair style of the
// placeholder figure; with the art of phase 4, the same ids pick sprite sheets
// or palette swaps, so the document does not change. The figure is the word:
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
