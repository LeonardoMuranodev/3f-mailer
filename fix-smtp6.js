const fs = require('fs');
const file = 'src/services/smtpAccountService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCheck = `if (error.responseCode === 535 || (error.message && error.message.includes('Auth')) || (error.message && error.message.includes('Username and Password'))) {
      throw new Error('Contraseña de aplicación inválida o el usuario no existe.');`;

const newCheck = `if (error.responseCode === 535 || error.responseCode === 534 || (error.message && (error.message.includes('Auth') || error.message.includes('Username and Password') || error.message.includes('Application-specific')))) {
      throw new Error('Contraseña de aplicación inválida. Recuerda generar y usar la contraseña de aplicación de 16 letras de Google.');`;

// We will use replace with regex to avoid encoding issues with "Contraseña"
content = content.replace(/if \(error\.responseCode === 535.*?\n\s*throw new Error\('.*?'\);/s, newCheck);

fs.writeFileSync(file, content, 'utf8');
