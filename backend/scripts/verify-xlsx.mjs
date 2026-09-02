import XLSX from 'xlsx';
const path = process.argv[2];
const wb = XLSX.readFile(path);
console.log('Sheet names:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log(`\n[${name}] ${data.length} rows`);
  if (data.length > 0) {
    console.log('  Keys:', Object.keys(data[0]).slice(0, 10).join(', '), '...');
    console.log('  Sample row 0:', JSON.stringify(data[0], null, 2).split('\n').slice(0, 12).join('\n'));
  }
}
