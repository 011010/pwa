import QRCode from 'qrcode';

// Equipo HP real
const equipment = {
  serial: '5cd1426qsb',
  type: 'Laptop',
  brand: 'HP',
  model: '15-dy2032nr',
  productNumber: '544Q2UA#ABA',
  assignedTo: 'Marisielo Carrasco Ramirez'
};

async function generateQRCode() {
  console.log('Generating QR code for HP Laptop...\n');

  const filename = `public/qr-${equipment.serial}.png`;

  // Generar QR code con el serial number
  await QRCode.toFile(filename, equipment.serial, {
    errorCorrectionLevel: 'H', // High error correction for better scanning
    type: 'png',
    quality: 0.95,
    margin: 2,
    width: 400, // Larger size for better scanning
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  console.log(`✓ Generated QR for ${equipment.brand} ${equipment.model}`);
  console.log(`  Serial Number: ${equipment.serial}`);
  console.log(`  Assigned to: ${equipment.assignedTo}`);
  console.log(`  File: ${filename}\n`);

  // También generar una página HTML específica para este equipo
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - HP ${equipment.model}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #DC2626 0%, #991b1b 100%);
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
    }

    h1 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 2rem;
    }

    .subtitle {
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }

    .info {
      background: #f9fafb;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: left;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #374151;
    }

    .info-value {
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }

    .serial-highlight {
      background: #DC2626;
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 30px;
      letter-spacing: 2px;
    }

    .qr-container {
      background: white;
      padding: 20px;
      border-radius: 15px;
      display: inline-block;
      border: 3px solid #DC2626;
    }

    .qr-container img {
      width: 100%;
      max-width: 350px;
      height: auto;
      display: block;
    }

    .instructions {
      margin-top: 30px;
      padding: 20px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 5px;
      text-align: left;
    }

    .instructions h3 {
      color: #92400e;
      margin-bottom: 10px;
    }

    .instructions p {
      color: #78350f;
      line-height: 1.6;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .instructions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="/iosolutions1.png" alt="IOSolutions Logo" class="logo">
    <h1>${equipment.brand} ${equipment.model}</h1>
    <p class="subtitle">${equipment.type}</p>

    <div class="serial-highlight">
      ${equipment.serial}
    </div>

    <div class="info">
      <div class="info-row">
        <span class="info-label">Marca:</span>
        <span class="info-value">${equipment.brand}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Modelo:</span>
        <span class="info-value">${equipment.model}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Product Number:</span>
        <span class="info-value">${equipment.productNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Asignado a:</span>
        <span class="info-value">${equipment.assignedTo}</span>
      </div>
    </div>

    <div class="qr-container">
      <img src="/qr-${equipment.serial}.png" alt="QR Code ${equipment.serial}">
    </div>

    <div class="instructions">
      <h3>📱 Instrucciones de escaneo:</h3>
      <p>
        1. Abre la aplicación RAIS en tu dispositivo móvil<br>
        2. Ve a la sección "Scanner" desde el menú inferior<br>
        3. Apunta la cámara hacia este código QR<br>
        4. El equipo será detectado automáticamente
      </p>
    </div>
  </div>
</body>
</html>`;

  const htmlFilename = `public/qr-equipment-${equipment.serial}.html`;
  await import('fs/promises').then(fs =>
    fs.writeFile(htmlFilename, htmlContent)
  );

  console.log(`✓ Generated HTML page: ${htmlFilename}\n`);
  console.log('✓ QR code generated successfully!\n');
  console.log('Access the QR code at:');
  console.log(`  - Image: http://localhost:5173/qr-${equipment.serial}.png`);
  console.log(`  - Page:  http://localhost:5173/qr-equipment-${equipment.serial}.html`);
}

generateQRCode().catch(console.error);
