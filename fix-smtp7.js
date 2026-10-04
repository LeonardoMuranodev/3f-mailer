const fs = require('fs');
const file = 'client/src/components/CuentasSmtp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<input \n                    type="text" \n                    value={form.limite_diario}',
  '<input \n                    type="number" max={500} min={1} \n                    value={form.limite_diario}'
);

fs.writeFileSync(file, content, 'utf8');
