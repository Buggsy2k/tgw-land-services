import { readdir, stat, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('site');
const target = 'W:\\TGWLS';

try {
  await stat(source);
} catch {
  console.error('No build found at site/. Run `npm run build` first.');
  process.exit(1);
}

let copied = 0;

async function sync(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await sync(src, dest);
      continue;
    }
    if (await isNewer(src, dest)) {
      await copyFile(src, dest);
      copied++;
    }
  }
}

// Copy only when the destination is missing or differs in modified time or size.
async function isNewer(src, dest) {
  try {
    const [a, b] = await Promise.all([stat(src), stat(dest)]);
    return a.mtimeMs > b.mtimeMs || a.size !== b.size;
  } catch {
    return true;
  }
}

await sync(source, target);
console.log(copied ? `Copied ${copied} updated file(s) to ${target}.` : `${target} already up to date.`);
