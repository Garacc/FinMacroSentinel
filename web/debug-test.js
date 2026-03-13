// Debug test
const path = require('path');
const fs = require('fs');

console.log('Testing...');

try {
  // Simulate what getAllReports does
  const reportsDirectory = path.join(process.cwd(), 'output');
  console.log('CWD:', process.cwd());
  console.log('Reports dir:', reportsDirectory);
  console.log('Exists:', fs.existsSync(reportsDirectory));

  if (fs.existsSync(reportsDirectory)) {
    const fileNames = fs.readdirSync(reportsDirectory);
    const mdFiles = fileNames.filter(f => f.endsWith('.md'));
    console.log('Total files:', fileNames.length);
    console.log('MD files:', mdFiles.length);
  }
} catch (e) {
  console.error('Error:', e.message);
}
