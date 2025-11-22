const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('Dist directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(distDir).filter(f => f.endsWith('.AppImage') || f.endsWith('.exe') || f.endsWith('.pacman'));

files.forEach(file => {
  const filePath = path.join(distDir, file);
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  
  const checksumContent = `${hex}  ${file}\n`;
  fs.writeFileSync(filePath + '.sha256', checksumContent);
  console.log(`Generated SHA256 for ${file}`);
});
