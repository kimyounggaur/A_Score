import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 8_000;
const durationSeconds = 30;
const bytesPerSample = 1;
const sampleCount = sampleRate * durationSeconds;
const dataSize = sampleCount * bytesPerSample;
const wav = Buffer.alloc(44 + dataSize);

wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * bytesPerSample, 28);
wav.writeUInt16LE(bytesPerSample, 32);
wav.writeUInt16LE(8, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataSize, 40);

const melody = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
const noteDuration = 0.5;

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const noteTime = time % noteDuration;
  const frequency = melody[Math.floor(time / noteDuration) % melody.length] ?? melody[0];
  const attack = Math.min(1, noteTime / 0.025);
  const release = Math.min(1, Math.max(0, (noteDuration - noteTime) / 0.09));
  const envelope = attack * release * Math.exp(-noteTime * 2.3);
  const tone =
    Math.sin(2 * Math.PI * frequency * time) + 0.28 * Math.sin(2 * Math.PI * frequency * 2 * time);
  const sample = Math.round(128 + tone * envelope * 0.16 * 127);
  wav.writeUInt8(Math.max(0, Math.min(255, sample)), 44 + index * bytesPerSample);
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, "../public/samples/demo-tone.wav");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, wav);
console.log(
  `Created ${path.relative(path.resolve(scriptDirectory, ".."), outputPath)} (${wav.length} bytes)`,
);
