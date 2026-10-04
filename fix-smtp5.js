const fs = require('fs');
const file = 'src/schemas/smtpSchema.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\.positive\('El l.mite diario debe ser positivo'\)\n\s*\.default\(400\)/,
  '.positive(\'El límite diario debe ser positivo\')\n    .max(500, \'El límite diario no puede superar los 500 correos por seguridad de Gmail\')\n    .default(400)'
);

fs.writeFileSync(file, content, 'utf8');
