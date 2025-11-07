import sharp from 'sharp';
import { promises as fs } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const inputImage = 'iosolutions1.png';

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    await sharp(inputImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(`public/icons/icon-${size}.png`);

    console.log(`✓ Generated icon-${size}.png`);
  }

  // Generate favicon.ico (16x16 and 32x32)
  await sharp(inputImage)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toFile('public/favicon.ico');

  console.log('✓ Generated favicon.ico');
  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
