import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(process.cwd(), 'public');
const srcSvg = path.join(root, 'vite.svg');
const outDir = path.join(root, 'icons');

async function main() {
  if (!fs.existsSync(srcSvg)) {
    console.error('Source SVG not found at', srcSvg);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tasks = [192, 512].map(async (size) => {
    const out = path.join(outDir, `icon-${size}.png`);
    await sharp(srcSvg)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('Generated', out);
  });

  await Promise.all(tasks);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


