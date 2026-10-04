const fs = require('fs');
const file = 'client/src/components/CuentasSmtp.tsx';
let content = fs.readFileSync(file, 'utf8');

// The label replacement
content = content.replace(
  '<label className="block text-sm font-medium text-dark mb-1">Contraseña de Aplicación</label>',
  '<label className="block text-sm font-medium text-dark mb-1">Contraseña de Aplicación {editingId ? <span className="text-muted text-xs font-normal ml-1">(Dejar en blanco para no cambiar)</span> : <span className="text-danger">*</span>}</label>'
);

// The input replacement
const oldInput = placeholder={editingId ? "Dejar como está para no cambiar" : "Contraseña de 16 caracteres"}\n                    />;
const newInput = placeholder={editingId ? "••••••••" : "Contraseña de 16 caracteres"}\n                      required={!editingId}\n                    />;
content = content.replace(oldInput, newInput);

fs.writeFileSync(file, content, 'utf8');
