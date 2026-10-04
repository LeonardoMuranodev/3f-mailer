const fs = require('fs');
const file = 'client/src/components/CuentasSmtp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /type="text"(\s*)value=\{form\.limite_diario\}/g,
  'type="number" max={500} min={1}$1value={form.limite_diario}'
);

fs.writeFileSync(file, content, 'utf8');
