import QRCode from 'qrcode';

// Genera QR codes para equipos de prueba
const testEquipment = [
  { serial: 'cm0074-fo0789105', name: 'HeadSet' },
  { serial: '1h850438gr', name: 'Laptop' },
  { serial: '1h850438gp', name: 'Laptop' },
  { serial: 'EQ-2024-004', name: 'Mouse HP' },
  { serial: 'EQ-2024-005', name: 'Impresora Canon' },
];

async function generateQRCodes() {
  console.log('Generating QR codes for test equipment...\n');

  for (const equipment of testEquipment) {
    const filename = `public/qr-${equipment.serial}.png`;

    // Generar QR code con el serial number
    await QRCode.toFile(filename, equipment.serial, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log(`✓ Generated QR for ${equipment.name} (${equipment.serial})`);
    console.log(`  File: ${filename}\n`);
  }

  console.log('✓ All QR codes generated successfully!');
  console.log('\nYou can now scan these QR codes to test the scanner.');
  console.log('The scanner will look for equipment with these serial numbers in your API.');
}

generateQRCodes().catch(console.error);
