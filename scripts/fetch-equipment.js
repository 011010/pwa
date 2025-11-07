/**
 * Script to fetch real equipment data from the API
 * Run with: node scripts/fetch-equipment.js
 */

import https from 'https';

const API_URL = 'https://rais.ioutstandings.com/api/v1';
const TOKEN = process.env.API_TOKEN || '1|UHalahzuXWsRs8jCVQ4NqokjYtFyjDEeXmvsZn0ud496808a';

function fetchEquipment() {
  const options = {
    hostname: 'rais.ioutstandings.com',
    path: '/api/v1/equipment-assignments?per_page=100',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);

        if (response.success && response.data) {
          console.log('\n=== EQUIPOS ASIGNADOS ===\n');

          // Filter only assigned equipment (has name/email AND name !== 'N/A')
          const assignedEquipment = response.data.filter(item =>
            item.name &&
            item.name.trim() !== '' &&
            item.name !== 'N/A' &&
            item.metadata?.equipment_status !== 'BAJAS'
          );

          if (assignedEquipment.length === 0) {
            console.log('No se encontraron equipos asignados.');
            console.log('\nMostrando todos los equipos disponibles:\n');
            response.data.slice(0, 10).forEach((item, index) => {
              console.log(`${index + 1}. ${item.equipment}`);
              console.log(`   Serial: ${item.serial_number}`);
              console.log(`   Modelo: ${item.model}`);
              console.log(`   Estado: ${item.metadata?.equipment_status || 'N/A'}`);
              console.log(`   Asignado: ${item.name || 'No asignado'}`);
              console.log(`   Empleado: ${item.metadata?.employee_name || 'N/A'}`);
              console.log(`   Email: ${item.metadata?.employee_email || 'N/A'}`);
              console.log('');
            });
          } else {
            assignedEquipment.slice(0, 10).forEach((item, index) => {
              console.log(`${index + 1}. ${item.equipment}`);
              console.log(`   Serial: ${item.serial_number}`);
              console.log(`   Modelo: ${item.model}`);
              console.log(`   Asignado a: ${item.name}`);
              console.log(`   Empleado: ${item.metadata?.employee_name || 'N/A'}`);
              console.log(`   Email: ${item.metadata?.employee_email || 'N/A'}`);
              console.log(`   Departamento: ${item.metadata?.employee_department || 'N/A'}`);
              console.log(`   Marca: ${item.metadata?.equipment_brand || 'N/A'}`);
              console.log(`   Tipo: ${item.metadata?.equipment_type || 'N/A'}`);
              console.log(`   Estado: ${item.metadata?.equipment_status || 'N/A'}`);
              console.log('');
            });

            console.log(`\nTotal equipos asignados: ${assignedEquipment.length}`);
            console.log('\n=== DATOS JSON PARA QR CODES (5 primeros) ===\n');
            console.log(JSON.stringify(assignedEquipment.slice(0, 5), null, 2));
          }
        } else {
          console.error('Error en respuesta:', response);
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error en request:', error);
  });

  req.end();
}

// Check if token is provided
if (!TOKEN) {
  console.log('⚠️  No se proporcionó token de API');
  console.log('Para obtener datos reales, ejecuta:');
  console.log('API_TOKEN=tu_token_aqui node scripts/fetch-equipment.js');
  console.log('\nIntentando sin autenticación...\n');
}

fetchEquipment();
