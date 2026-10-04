const fs = require('fs');
const file = 'client/src/components/CuentasSmtp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace label
content = content.replace(
  '<label className="block text-sm font-medium text-dark mb-1">Contraseña de Aplicación</label>',
  '<label className="block text-sm font-medium text-dark mb-1">Contraseña de Aplicación {editingId ? <span className="text-muted text-xs font-normal ml-1">(Dejar en blanco para no cambiar)</span> : <span className="text-danger">*</span>}</label>'
);

// Add required
content = content.replace(
  /placeholder=\{editingId \? "Dejar como está para no cambiar" : "Contraseña de 16 caracteres"\}\s*\/>/g,
  'placeholder={editingId ? "••••••••" : "Contraseña de 16 caracteres"}\n                      required={!editingId}\n                    />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CuentasSmtp.tsx');
