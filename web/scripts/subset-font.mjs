import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const sourcePath = path.resolve(webRoot, "../ui_kits/scorestore/fonts/MaruBuri-Light.otf");
const outputDirectory = path.resolve(webRoot, "public/fonts");
const outputPath = path.join(outputDirectory, "maruburi-light-subset.woff2");
const bodyOutputPath = path.join(outputDirectory, "noto-sans-kr-app-subset.woff2");
const glyphs =
  "ScoreStore ♪ 무료 악보 신곡 인기 악보집 밴드세트 색깔악보 편곡자 장바구니 결제 완료 포인트 충전 보관함 마이페이지 알림 로그인 검색 어떤 곡을 연주할까요 0123456789";

const original = await readFile(sourcePath);
const subset = await subsetFont(original, glyphs, {
  targetFormat: "woff2",
  preserveNameIds: [0, 1, 2, 3, 4, 5, 6],
});

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, subset);

const outputStat = await stat(outputPath);
if (outputStat.size >= 50 * 1024) {
  throw new Error(`Font subset is ${outputStat.size} bytes; expected less than 50KB.`);
}

console.log(`Created ${path.relative(webRoot, outputPath)} (${outputStat.size} bytes)`);

const runtimeRoots = ["app", "components", "data", "hooks", "lib"].map((directory) =>
  path.join(webRoot, directory),
);
const runtimeExtensions = new Set([".json", ".ts", ".tsx"]);

async function collectRuntimeText(directory) {
  let content = "";
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) content += await collectRuntimeText(entryPath);
    else if (runtimeExtensions.has(path.extname(entry.name)))
      content += await readFile(entryPath, "utf8");
  }
  return content;
}

const bodySourceCandidates = [
  process.env.NOTO_SANS_KR_SOURCE,
  "C:/Windows/Fonts/NotoSansKR-VF.ttf",
].filter(Boolean);
let bodySourcePath;
for (const candidate of bodySourceCandidates) {
  try {
    await access(candidate);
    bodySourcePath = candidate;
    break;
  } catch {
    // 다음 후보를 확인한다.
  }
}
if (!bodySourcePath) {
  throw new Error(
    "Noto Sans KR 원본을 찾지 못했어요. NotoSansKR-VF.ttf 경로를 Noto_SANS_KR_SOURCE 환경 변수로 지정해 주세요.",
  );
}

let runtimeText = "";
for (const runtimeRoot of runtimeRoots) runtimeText += await collectRuntimeText(runtimeRoot);
runtimeText +=
  " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₩♪·–—…→←×+-%()[]{}.,:;!?/@#&";
const bodyGlyphs = [...new Set([...runtimeText])].sort().join("");
const bodyOriginal = await readFile(bodySourcePath);
const bodySubset = await subsetFont(bodyOriginal, bodyGlyphs, {
  targetFormat: "woff2",
  preserveNameIds: [0, 1, 2, 3, 4, 5, 6],
});
await writeFile(bodyOutputPath, bodySubset);
console.log(
  `Created ${path.relative(webRoot, bodyOutputPath)} (${bodySubset.length} bytes, ${[...bodyGlyphs].length} glyphs)`,
);
