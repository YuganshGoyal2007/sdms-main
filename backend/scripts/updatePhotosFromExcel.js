import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { uploadStudentPhotos } from '../services/photoUpload.service.js';
import Student from '../models/student.model.js';
import { removeSpaces } from '../services/whitespace.service.js';
import sequelize from '../lib/db.js';

const DEFAULT_FILE = path.join(__dirname, '..', 'Btech CSE 3rd Year Section A.xlsx');

const run = async (filePath, autoUpdate = true) => {
  const file = filePath || DEFAULT_FILE;
  if (!fs.existsSync(file)) {
    console.error('Excel file not found:', file);
    process.exit(1);
  }

  const buffer = fs.readFileSync(file);
  try {
    const { results, errors } = await uploadStudentPhotos(buffer);
    console.log('Extracted:', results.length, 'errors:', errors.length);

    if (autoUpdate) {
      await sequelize.authenticate();
      for (const r of results) {
        const normalizedRoll = removeSpaces(String(r.rollNo).toLowerCase());
        try {
          const [updated] = await Student.update({ photo: r.photoData }, { where: { rollNo: normalizedRoll } });
          if (updated) console.log(`Updated photo for ${normalizedRoll}`);
          else console.log(`No student found for ${normalizedRoll}`);
        } catch (err) {
          console.error(`DB update failed for ${normalizedRoll}:`, err.message);
        }
      }
    }

    if (errors && errors.length) console.log('Errors:', errors);
  } catch (err) {
    console.error('Failed to extract photos:', err.message || err);
    process.exit(1);
  }
};

const arg = process.argv[2];
const auto = process.argv[3] !== 'false';
run(arg, auto).then(() => process.exit(0)).catch(() => process.exit(1));
