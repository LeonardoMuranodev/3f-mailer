const fs = require('fs');
let content = fs.readFileSync('src/controllers/contactoController.ts', 'utf8');
content = content.replace(/} catch \(err\) {\r?\n\s*next\(err\);\r?\n\s*}/g, `} catch (err: any) {\n    if (err.message && err.message.includes('El CUIT')) {\n      sendError(res, 'BAD_REQUEST', err.message, 400);\n      return;\n    }\n    next(err);\n  }`);
fs.writeFileSync('src/controllers/contactoController.ts', content);
