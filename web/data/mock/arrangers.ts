import { INSTRUMENT_ID } from "@/lib/catalog/taxonomy";
import type { Arranger } from "@/lib/catalog/types";

const arrangerSeeds = [
  {
    id: "kim-minsu",
    name: "김민수",
    specialties: ["핑거스타일", "어쿠스틱 편곡"],
    bio: "원곡의 흐름을 살린 통기타 편곡을 만들어요.",
    instrumentIds: [INSTRUMENT_ID.ACOUSTIC_GUITAR, INSTRUMENT_ID.UKULELE],
  },
  {
    id: "lee-junghoon",
    name: "이정훈",
    specialties: ["밴드", "리듬 섹션"],
    bio: "합주에서 각 파트가 또렷하게 들리는 밴드 악보를 편곡해요.",
    instrumentIds: [INSTRUMENT_ID.ELECTRIC_GUITAR, INSTRUMENT_ID.BASS, INSTRUMENT_ID.DRUMS],
  },
  {
    id: "park-seoyeon",
    name: "박서연",
    specialties: ["피아노", "색깔악보"],
    bio: "처음 연주하는 사람도 읽기 쉬운 건반 악보를 만들어요.",
    instrumentIds: [INSTRUMENT_ID.PIANO, INSTRUMENT_ID.MELODICA],
  },
  {
    id: "jung-woojin",
    name: "정우진",
    specialties: ["관악", "클래식"],
    bio: "호흡과 음역을 고려해 관악기별로 자연스럽게 옮겨요.",
    instrumentIds: [INSTRUMENT_ID.FLUTE, INSTRUMENT_ID.CLARINET, INSTRUMENT_ID.SAXOPHONE],
  },
  {
    id: "scorestore-editors",
    name: "ScoreStore 편집부",
    specialties: ["교육용 악보", "국악"],
    bio: "수업과 개인 연습에 바로 쓸 수 있는 악보를 검수해요.",
    instrumentIds: [INSTRUMENT_ID.RECORDER, INSTRUMENT_ID.GAYAGEUM, INSTRUMENT_ID.DANSO],
  },
] satisfies Arranger[];

// 정적 seed는 CI의 mock-data Zod 테스트에서 검증한다.
export const MOCK_ARRANGERS: Arranger[] = arrangerSeeds;
