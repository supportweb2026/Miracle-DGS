const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fonction pour convertir un chemin d'alias en chemin relatif
function convertAliasToRelative(filePath, importPath) {
  const fileDir = path.dirname(filePath);
  const relativePath = path.relative(fileDir, path.join('src', importPath.replace('@/', '')));
  return relativePath.replace(/\\/g, '/');
}

// Trouver tous les fichiers JavaScript
const files = glob.sync('backend/src/**/*.js');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /require\(['"]@\/([^'"]+)['"]\)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const importPath = match[1];
    const relativePath = convertAliasToRelative(file, importPath);
    const newImport = `require('${relativePath}')`;
    content = content.replace(fullMatch, newImport);
  }
  
  fs.writeFileSync(file, content);
}); 