const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'output');
console.log('CWD:', process.cwd());
console.log('Reports dir:', reportsDir);
console.log('Exists:', fs.existsSync(reportsDir));

if (fs.existsSync(reportsDir)) {
  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  console.log('Found', files.length, 'markdown files');
  files.forEach(f => console.log(' -', f));
} else {
  console.log('Directory does not exist!');
}
