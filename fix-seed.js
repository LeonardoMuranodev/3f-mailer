const fs = require('fs');
const seedPath = 'src/scripts/seed.ts';
let content = fs.readFileSync(seedPath, 'utf8');

function generateValidCUIT() {
  const types = ['20', '23', '24', '27', '30', '33', '34'];
  const type = types[Math.floor(Math.random() * types.length)];
  const dni = String(Math.floor(Math.random() * 90000000) + 10000000);
  const base = type + dni;
  
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(base[i]) * multipliers[i];
  }
  
  let z = 11 - (sum % 11);
  if (z === 11) z = 0;
  if (z === 10) return generateValidCUIT(); // Recalculate to keep simple
  
  return base + z;
}

// Reemplazar cuits en el archivo
content = content.replace(/cuit: '\d{11}'/g, () => "cuit: '" + generateValidCUIT() + "'");

// Reemplazar rubros inválidos
content = content.replace(/'alimentos'/g, "'alimenticia'");
content = content.replace(/'logistica'/g, "'transporte'");
content = content.replace(/'tecnologia'/g, "'informatica'");
content = content.replace(/'software'/g, "'informatica'");

fs.writeFileSync(seedPath, content);
console.log('Seed updated with valid CUITs and Rubros');
