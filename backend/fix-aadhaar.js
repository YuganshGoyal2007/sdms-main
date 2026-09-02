import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { Student } from './models/index.js';
import { removeSpaces } from './services/whitespace.service.js';

const dir = 'C:\\Users\\Public\\Downloads\\chrome downloads\\GBU-SDMS-sqlonlymain\\GBU-SDMS-sqlonlymain\\GBU-SDMS-main\\drive-download-20260408T072359Z-3-001';

const fixAadhaars = async () => {
  let count = 0;
  
  const searchDir = async (d) => {
    const files = fs.readdirSync(d);
    for (const f of files) {
      const fp = path.join(d, f);
      if (fs.statSync(fp).isDirectory()) {
        await searchDir(fp);
      } else if (f.endsWith('.xlsx') && !f.includes('~$')) {
        try {
          const wb = XLSX.readFile(fp);
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const dataRaw = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: true});
          
          for (const row of dataRaw) {
            if (!Array.isArray(row)) continue;
            
            // Look for any string/number in the row that looks like a 12-digit Aadhaar
            // and another string that looks like a name
            const rawNumbers = row.filter(cell => typeof cell === 'number' && String(cell).length === 12);
            if (rawNumbers.length > 0) {
              const possibleAadhaar = String(rawNumbers[0]);
              // Find string cells that might be names
              const possibleNames = row.filter(cell => typeof cell === 'string' && cell.trim().includes(' '));
              
              if (possibleAadhaar && possibleAadhaar.length === 12) {
                for (const name of possibleNames) {
                  // See if this student exists and has a corrupted Aadhaar
                  const student = await Student.findOne({ where: { fullName: name.trim() } });
                  if (student) {
                    if (student.nationalId !== possibleAadhaar) {
                      await student.update({ nationalId: possibleAadhaar });
                      console.log(`Fixed Aadhaar for ${student.fullName}: ${student.nationalId} -> ${possibleAadhaar}`);
                      count++;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // Ignore read errors for weird files
        }
      }
    }
  };

  await searchDir(dir);
  console.log(`Finished fixing ${count} corrupted Aadhaar numbers!`);
};

fixAadhaars().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });