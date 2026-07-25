const fs = require('fs');
const path = require('path');

const FALLBACK_URI = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const adminDir = 'c:/Users/hp/Desktop/GitDeployee/Zin_Zoo/Frontend/src/modules/Food/pages/admin';
const files = findFiles(adminDir);
let changedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  if (!content.includes('onError')) return;

  // Ensure FALLBACK_IMAGE is defined in the file if we're replacing onError
  if (!content.includes('const FALLBACK_IMAGE') && !content.includes('const FOOD_FALLBACK_IMAGE')) {
    // Add definition after imports
    const importMatch = content.match(/import .* from .*[\r\n]+/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const index = content.lastIndexOf(lastImport) + lastImport.length;
      content = content.slice(0, index) + '\nconst ADMIN_FALLBACK_IMAGE = "' + FALLBACK_URI + '";\n' + content.slice(index);
    }
  }

  // Replace various onError handlers with a standard one
  // onError={(e) => { e.target.src = ... }}
  content = content.replace(/onError=\{\(e\)\s*=>\s*\{[\s\n]*e\.target\.src\s*=\s*[^}]*\}\}/g, 'onError={(e) => { e.target.src = typeof ADMIN_FALLBACK_IMAGE !== "undefined" ? ADMIN_FALLBACK_IMAGE : (typeof FOOD_FALLBACK_IMAGE !== "undefined" ? FOOD_FALLBACK_IMAGE : typeof FALLBACK_IMAGE !== "undefined" ? FALLBACK_IMAGE : "") }}');
  
  // onError={(e) => (e.target.style.display = "none")}
  content = content.replace(/onError=\{\(e\)\s*=>\s*\(e\.target\.style\.display\s*=\s*"none"\)\}/g, 'onError={(e) => { e.target.src = typeof ADMIN_FALLBACK_IMAGE !== "undefined" ? ADMIN_FALLBACK_IMAGE : (typeof FOOD_FALLBACK_IMAGE !== "undefined" ? FOOD_FALLBACK_IMAGE : typeof FALLBACK_IMAGE !== "undefined" ? FALLBACK_IMAGE : "") }}');

  // And some might be written differently: onError={(e) => e.target.src = ...}
  content = content.replace(/onError=\{\(e\)\s*=>\s*e\.target\.src\s*=\s*[^}]*\}/g, 'onError={(e) => { e.target.src = typeof ADMIN_FALLBACK_IMAGE !== "undefined" ? ADMIN_FALLBACK_IMAGE : (typeof FOOD_FALLBACK_IMAGE !== "undefined" ? FOOD_FALLBACK_IMAGE : typeof FALLBACK_IMAGE !== "undefined" ? FALLBACK_IMAGE : "") }}');


  if (original !== content) {
    fs.writeFileSync(f, content);
    changedCount++;
    console.log('Updated: ' + f);
  }
});
console.log('Updated ' + changedCount + ' files.');
