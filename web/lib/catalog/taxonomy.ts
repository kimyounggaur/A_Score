export const INSTRUMENT_GROUP = {
  GUITAR: "guitar",
  KEYBOARD: "keyboard",
  PERCUSSION: "percussion",
  STRINGS: "strings",
  WINDS: "winds",
  TRADITIONAL: "traditional",
  ETC: "etc",
} as const;

export type InstrumentGroup = (typeof INSTRUMENT_GROUP)[keyof typeof INSTRUMENT_GROUP];

export const INSTRUMENT_ID = {
  ACOUSTIC_GUITAR: "acoustic-guitar",
  ELECTRIC_GUITAR: "electric-guitar",
  BASS: "bass",
  UKULELE: "ukulele",
  PIANO: "piano",
  MELODICA: "melodica",
  DRUMS: "drums",
  CAJON: "cajon",
  TONGUE_DRUM: "tongue-drum",
  KALIMBA: "kalimba",
  VIOLIN: "violin",
  CELLO: "cello",
  FLUTE: "flute",
  CLARINET: "clarinet",
  OBOE: "oboe",
  SAXOPHONE: "saxophone",
  TRUMPET: "trumpet",
  TROMBONE: "trombone",
  HORN: "horn",
  BASSOON: "bassoon",
  TUBA: "tuba",
  RECORDER: "recorder",
  OCARINA: "ocarina",
  PAN_FLUTE: "pan-flute",
  HARMONICA: "harmonica",
  GAYAGEUM: "gayageum",
  DANSO: "danso",
  HANDBELLS: "handbells",
} as const;

export type InstrumentId = (typeof INSTRUMENT_ID)[keyof typeof INSTRUMENT_ID];

export const NOTATION_FORMAT = {
  STANDARD: "standard",
  TAB: "tab",
  CHORD_CHART: "chord-chart",
  DRUM_NOTATION: "drum-notation",
  NUMBER: "number",
  COLOR: "color",
  MELODY: "melody",
} as const;

export type NotationFormat = (typeof NOTATION_FORMAT)[keyof typeof NOTATION_FORMAT];

export const PRODUCT_TYPE = {
  SCORE: "score",
  BUNDLE: "bundle",
  BAND_SET: "band-set",
} as const;

export type ProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];

export const GENRE_ID = {
  K_POP: "k-pop",
  BALLAD: "ballad",
  INDIE: "indie",
  ROCK: "rock",
  CLASSICAL: "classical",
  OST: "ost",
  CHILDREN: "children",
  TRADITIONAL: "traditional",
  JAZZ: "jazz",
  ETC: "etc",
} as const;

export type Genre = (typeof GENRE_ID)[keyof typeof GENRE_ID];
export type Level = 1 | 2 | 3 | 4 | 5;

export interface InstrumentDefinition {
  id: InstrumentId;
  label: string;
  group: InstrumentGroup;
  aliases: readonly string[];
  icon: string;
}

export const INSTRUMENT_GROUPS = [
  { id: INSTRUMENT_GROUP.GUITAR, label: "기타", thumbnailTone: "orange" },
  { id: INSTRUMENT_GROUP.KEYBOARD, label: "건반", thumbnailTone: "amber" },
  { id: INSTRUMENT_GROUP.PERCUSSION, label: "타악기", thumbnailTone: "rose" },
  { id: INSTRUMENT_GROUP.STRINGS, label: "현악기", thumbnailTone: "violet" },
  { id: INSTRUMENT_GROUP.WINDS, label: "관악기", thumbnailTone: "sky" },
  { id: INSTRUMENT_GROUP.TRADITIONAL, label: "국악기", thumbnailTone: "emerald" },
  { id: INSTRUMENT_GROUP.ETC, label: "기타 악기", thumbnailTone: "slate" },
] as const;

export const INSTRUMENTS = [
  {
    id: INSTRUMENT_ID.ACOUSTIC_GUITAR,
    label: "통기타",
    group: INSTRUMENT_GROUP.GUITAR,
    aliases: ["어쿠스틱기타", "어쿠스틱 기타", "통기타악보"],
    icon: "guitar-acoustic",
  },
  {
    id: INSTRUMENT_ID.ELECTRIC_GUITAR,
    label: "일렉기타",
    group: INSTRUMENT_GROUP.GUITAR,
    aliases: ["일렉", "전기기타", "일렉 기타"],
    icon: "guitar-electric",
  },
  {
    id: INSTRUMENT_ID.BASS,
    label: "베이스",
    group: INSTRUMENT_GROUP.GUITAR,
    aliases: ["베이스기타", "베이스 기타"],
    icon: "bass",
  },
  {
    id: INSTRUMENT_ID.UKULELE,
    label: "우쿨렐레",
    group: INSTRUMENT_GROUP.GUITAR,
    aliases: ["우쿠렐레", "우크렐레"],
    icon: "ukulele",
  },
  {
    id: INSTRUMENT_ID.PIANO,
    label: "피아노",
    group: INSTRUMENT_GROUP.KEYBOARD,
    aliases: ["건반", "피아노악보"],
    icon: "piano",
  },
  {
    id: INSTRUMENT_ID.MELODICA,
    label: "멜로디언",
    group: INSTRUMENT_GROUP.KEYBOARD,
    aliases: ["멜로디카"],
    icon: "melodica",
  },
  {
    id: INSTRUMENT_ID.DRUMS,
    label: "드럼",
    group: INSTRUMENT_GROUP.PERCUSSION,
    aliases: ["드럼세트", "드럼악보"],
    icon: "drums",
  },
  {
    id: INSTRUMENT_ID.CAJON,
    label: "카혼",
    group: INSTRUMENT_GROUP.PERCUSSION,
    aliases: ["까혼"],
    icon: "cajon",
  },
  {
    id: INSTRUMENT_ID.TONGUE_DRUM,
    label: "텅드럼",
    group: INSTRUMENT_GROUP.PERCUSSION,
    aliases: ["탱크드럼", "tongue drum"],
    icon: "tongue-drum",
  },
  {
    id: INSTRUMENT_ID.KALIMBA,
    label: "칼림바",
    group: INSTRUMENT_GROUP.PERCUSSION,
    aliases: ["엄지피아노"],
    icon: "kalimba",
  },
  {
    id: INSTRUMENT_ID.VIOLIN,
    label: "바이올린",
    group: INSTRUMENT_GROUP.STRINGS,
    aliases: ["바이올린악보"],
    icon: "violin",
  },
  {
    id: INSTRUMENT_ID.CELLO,
    label: "첼로",
    group: INSTRUMENT_GROUP.STRINGS,
    aliases: ["첼로악보"],
    icon: "cello",
  },
  {
    id: INSTRUMENT_ID.FLUTE,
    label: "플루트",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["플룻", "플룻악보"],
    icon: "flute",
  },
  {
    id: INSTRUMENT_ID.CLARINET,
    label: "클라리넷",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["클라리네트"],
    icon: "clarinet",
  },
  {
    id: INSTRUMENT_ID.OBOE,
    label: "오보에",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "oboe",
  },
  {
    id: INSTRUMENT_ID.SAXOPHONE,
    label: "색소폰",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["삭소폰", "색소폰악보"],
    icon: "saxophone",
  },
  {
    id: INSTRUMENT_ID.TRUMPET,
    label: "트럼펫",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "trumpet",
  },
  {
    id: INSTRUMENT_ID.TROMBONE,
    label: "트롬본",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "trombone",
  },
  {
    id: INSTRUMENT_ID.HORN,
    label: "호른",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["프렌치호른"],
    icon: "horn",
  },
  {
    id: INSTRUMENT_ID.BASSOON,
    label: "바순",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["바송"],
    icon: "bassoon",
  },
  {
    id: INSTRUMENT_ID.TUBA,
    label: "튜바",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "tuba",
  },
  {
    id: INSTRUMENT_ID.RECORDER,
    label: "리코더",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["리코오더"],
    icon: "recorder",
  },
  {
    id: INSTRUMENT_ID.OCARINA,
    label: "오카리나",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "ocarina",
  },
  {
    id: INSTRUMENT_ID.PAN_FLUTE,
    label: "팬플룻",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: ["팬플루트"],
    icon: "pan-flute",
  },
  {
    id: INSTRUMENT_ID.HARMONICA,
    label: "하모니카",
    group: INSTRUMENT_GROUP.WINDS,
    aliases: [],
    icon: "harmonica",
  },
  {
    id: INSTRUMENT_ID.GAYAGEUM,
    label: "가야금",
    group: INSTRUMENT_GROUP.TRADITIONAL,
    aliases: [],
    icon: "gayageum",
  },
  {
    id: INSTRUMENT_ID.DANSO,
    label: "단소",
    group: INSTRUMENT_GROUP.TRADITIONAL,
    aliases: [],
    icon: "danso",
  },
  {
    id: INSTRUMENT_ID.HANDBELLS,
    label: "핸드벨",
    group: INSTRUMENT_GROUP.ETC,
    aliases: ["핸드 벨", "뮤직벨"],
    icon: "handbells",
  },
] as const satisfies readonly InstrumentDefinition[];

export const NOTATION_FORMATS = [
  { id: NOTATION_FORMAT.STANDARD, label: "오선" },
  { id: NOTATION_FORMAT.TAB, label: "TAB" },
  { id: NOTATION_FORMAT.CHORD_CHART, label: "코드" },
  { id: NOTATION_FORMAT.DRUM_NOTATION, label: "드럼보" },
  { id: NOTATION_FORMAT.NUMBER, label: "숫자보" },
  { id: NOTATION_FORMAT.COLOR, label: "색깔악보" },
  { id: NOTATION_FORMAT.MELODY, label: "멜로디 악보" },
] as const;

export const PRODUCT_TYPES = [
  { id: PRODUCT_TYPE.SCORE, label: "단일 악보" },
  { id: PRODUCT_TYPE.BUNDLE, label: "악보집" },
  { id: PRODUCT_TYPE.BAND_SET, label: "밴드세트" },
] as const;

export const GENRES = [
  { id: GENRE_ID.K_POP, label: "K-POP" },
  { id: GENRE_ID.BALLAD, label: "발라드" },
  { id: GENRE_ID.INDIE, label: "인디" },
  { id: GENRE_ID.ROCK, label: "록" },
  { id: GENRE_ID.CLASSICAL, label: "클래식" },
  { id: GENRE_ID.OST, label: "OST" },
  { id: GENRE_ID.CHILDREN, label: "동요" },
  { id: GENRE_ID.TRADITIONAL, label: "국악" },
  { id: GENRE_ID.JAZZ, label: "재즈" },
  { id: GENRE_ID.ETC, label: "기타" },
] as const;

export const LEVELS = [
  { id: 1, label: "입문" },
  { id: 2, label: "초급" },
  { id: 3, label: "중급" },
  { id: 4, label: "중상급" },
  { id: 5, label: "상급" },
] as const satisfies readonly { id: Level; label: string }[];

const instrumentIds = new Set<string>(INSTRUMENTS.map((instrument) => instrument.id));
const groupIds = new Set<string>(INSTRUMENT_GROUPS.map((group) => group.id));
const formatIds = new Set<string>(NOTATION_FORMATS.map((format) => format.id));
const productTypeIds = new Set<string>(PRODUCT_TYPES.map((type) => type.id));
const genreIds = new Set<string>(GENRES.map((genre) => genre.id));

export const INSTRUMENT_BY_ID: ReadonlyMap<InstrumentId, InstrumentDefinition> = new Map(
  INSTRUMENTS.map((instrument) => [instrument.id, instrument]),
);

function normalizeAlias(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-_().,·:;'"!?[\]{}/]/g, "");
}

const instrumentByAlias = new Map<string, InstrumentDefinition>();
for (const instrument of INSTRUMENTS) {
  for (const alias of [instrument.id, instrument.label, ...instrument.aliases]) {
    instrumentByAlias.set(normalizeAlias(alias), instrument);
  }
}

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === "string" && instrumentIds.has(value);
}

export function isInstrumentGroup(value: unknown): value is InstrumentGroup {
  return typeof value === "string" && groupIds.has(value);
}

export function isNotationFormat(value: unknown): value is NotationFormat {
  return typeof value === "string" && formatIds.has(value);
}

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && productTypeIds.has(value);
}

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && genreIds.has(value);
}

export function isLevel(value: unknown): value is Level {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function getInstrument(id: string): InstrumentDefinition | null {
  return isInstrumentId(id) ? (INSTRUMENT_BY_ID.get(id) ?? null) : null;
}

export function getInstrumentsByGroup(group: InstrumentGroup): readonly InstrumentDefinition[] {
  return INSTRUMENTS.filter((instrument) => instrument.group === group);
}

export function resolveInstrumentAlias(text: string): InstrumentDefinition | null {
  return instrumentByAlias.get(normalizeAlias(text)) ?? null;
}
