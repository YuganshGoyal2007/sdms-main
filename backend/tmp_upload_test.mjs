import fs from 'fs';
import path from 'path';
import './lib/db.js';
import { uploadStudentsWithReformat } from './controllers/student.controller.js';

const fileBuffer = fs.readFileSync(path.resolve('../frontend/public/sample.xlsx'));
const req = {
  body: {
    school: 'soict',
    department: 'cse',
    program: 'B.Tech',
    batch: '2021-25',
    specialization: 'data'
  },
  file: { buffer: fileBuffer },
  user: { id: 1 }
};
const res = {
  status(code) {
    this.code = code;
    return this;
  },
  json(data) {
    console.log('STATUS', this.code);
    console.log(JSON.stringify(data, null, 2));
  }
};

await uploadStudentsWithReformat(req, res);
