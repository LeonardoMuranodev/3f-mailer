const fs = require('fs');
const file = 'client/src/components/CuentasSmtp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace label
content = content.replace(
  /<label className="block text-sm font-medium text-dark mb-1">Contrase.a de Aplicaci.n<\/label>/g,
  '<label className="block text-sm font-medium text-dark mb-1">Contraseña de Aplicación {editingId ? <span className="text-muted text-xs font-normal ml-1">(Dejar en blanco para no cambiar)</span> : <span className="text-danger">*</span>}</label>'
);

// Fix the placeholder gibberish
content = content.replace(
  /placeholder=\{editingId \? "[^"]*" : "Contrase.a de 16 caracteres"\}/g,
  'placeholder={editingId ? "\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022" : "Contraseña de 16 caracteres"}'
);

fs.writeFileSync(file, content, 'utf8');
