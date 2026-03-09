
export enum IPType {
  HARRY_POTTER = 'Harry Potter',
  HONOR_OF_KINGS = '王者荣耀',
  POKEMON = '宝可梦',
  MARVEL = '漫威',
  EMPRESSES = '甄嬛传',
  FRIENDS = '老友记',
  CUSTOM = '自定义'
}

export interface WordAssociation {
  ip: IPType;
  customIPName?: string; // Store the specific name if IP is CUSTOM
  word: string;
  pronunciation: string;
  definition: string;
  association: string;
  sound_anchor: string;
  mnemonic: string;
  funScore: number;
}

export interface SavedWord {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
  sound_anchor: string;
  mnemonic: string;
  ip: IPType;
  customIPName?: string;
  timestamp: number;
}
