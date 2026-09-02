import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_FILE = path.join(__dirname, '..', 'Btech CSE 3rd Year Section A.xlsx');
const OUTPUT_DIR = path.join(__dirname, '..', 'uploads', 'photos');

const createData = (imageCell) => {
  if (!imageCell) return null;
  const str = String(imageCell).trim();
  if (str.startsWith('data:image/')) {
    const match = str.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/i);
    if (!match) return null;
    return { ext: match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase(), base64: match[2] };
  }
  // If it's raw base64
  const base64 = str.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return { ext: 'jpg', base64 };
  }
  return null;
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const extractEmbeddedImages = (xlsxPath) => {
  const zip = new AdmZip(xlsxPath);
  const entries = zip.getEntries();
  const files = {};
  entries.forEach((entry) => {
    const name = entry.entryName;
    if (name.startsWith('xl/media/')) {
      files[name] = entry.getData();
    }
    if (name === 'xl/workbook.xml') files['workbook.xml'] = entry.getData().toString('utf8');
    if (name.startsWith('xl/worksheets/')) files[name] = entry.getData().toString('utf8');
    if (name.startsWith('xl/drawings/')) files[name] = entry.getData().toString('utf8');
    if (name.startsWith('xl/drawings/_rels/')) files[name] = entry.getData().toString('utf8');
    if (name.startsWith('xl/worksheets/_rels/')) files[name] = entry.getData().toString('utf8');
  });
  return files;
};

const parseDrawings = (files) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  // Determine sheet1 path
  const sheetXml = Object.keys(files).find(k => k.startsWith('xl/worksheets/sheet'));
  if (!sheetXml) return [];
  const sheetContent = files[sheetXml];
  const sheetRelsPath = `xl/worksheets/_rels/${path.basename(sheetXml)}.rels`;
  const sheetRels = files[sheetRelsPath];
  if (!sheetRels) return [];
  const sheetRelsObj = parser.parse(sheetRels);
  const relationships = sheetRelsObj.Relationships && sheetRelsObj.Relationships.Relationship ? sheetRelsObj.Relationships.Relationship : [];
  const drawingRel = Array.isArray(relationships) ? relationships.find(r => r['@_Type'] && r['@_Type'].includes('/drawing')) : (relationships['@_Type'] && relationships['@_Type'].includes('/drawing') ? relationships : null);
  if (!drawingRel) return [];
  const drawingTarget = drawingRel['@_Target'].replace(/^\.\./, 'xl');
  const drawingPath = drawingTarget.startsWith('xl/') ? drawingTarget : `xl/${drawingTarget}`;
  const drawingXml = files[drawingPath];
  if (!drawingXml) return [];

  const drawingObj = parser.parse(drawingXml);
  const anchors = [];
  const twoCellAnchors = drawingObj['xdr:wsDr'] && drawingObj['xdr:wsDr']['xdr:twoCellAnchor'] ? drawingObj['xdr:wsDr']['xdr:twoCellAnchor'] : [];
  const anchorsArray = Array.isArray(twoCellAnchors) ? twoCellAnchors : [twoCellAnchors];

  // parse relationships for drawing to map rId to media file
  const drawingRelsPath = `xl/drawings/_rels/${path.basename(drawingPath)}.rels`;
  const drawingRels = files[drawingRelsPath];
  const relsObj = drawingRels ? parser.parse(drawingRels) : null;
  const rels = relsObj && relsObj.Relationships && relsObj.Relationships.Relationship ? relsObj.Relationships.Relationship : [];

  const relMap = {};
  if (rels) {
    if (Array.isArray(rels)) {
      rels.forEach(r => { relMap[r['@_Id']] = r['@_Target']; });
    } else {
      relMap[rels['@_Id']] = rels['@_Target'];
    }
  }

  anchorsArray.forEach((a) => {
    try {
      const from = a['xdr:from'];
      const col = parseInt(from['xdr:col']);
      const row = parseInt(from['xdr:row']);
      // get blip id
      const pic = a['xdr:pic'];
      const blip = pic && pic['xdr:blipFill'] && pic['xdr:blipFill']['a:blip'] ? pic['xdr:blipFill']['a:blip'] : null;
      const embedId = blip && blip['@_r:embed'] ? blip['@_r:embed'] : null;
      const target = embedId ? relMap[embedId] : null;
      if (target) {
        const mediaPath = target.replace(/^\.\./, 'xl');
        const fullMediaPath = mediaPath.startsWith('xl/') ? mediaPath : `xl/${mediaPath}`;
        anchors.push({ row, col, mediaPath: fullMediaPath });
      }
    } catch (err) {
      // ignore
    }
  });

  return anchors;
};

const run = (filePath) => {
  const file = filePath || DEFAULT_FILE;
  if (!fs.existsSync(file)) {
    console.error('Excel file not found:', file);
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);

  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  if (!rows || rows.length < 2) {
    console.error('No data found in the sheet');
    process.exit(1);
  }

  const headers = rows[0].map(h => h ? String(h).toLowerCase().trim() : '');
  const rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('enroll') || h.includes('registration'));
  const imgIdx = headers.findIndex(h => h.includes('image') || h.includes('photo') || h.includes('picture'));

  // First attempt: images inline in cells (base64/data uri)
  let saved = 0;
  const errors = [];

  if (imgIdx !== -1) {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const roll = row[rollIdx] ? String(row[rollIdx]).trim() : '';
      const imageCell = row[imgIdx];
      if (!roll) {
        errors.push({ row: i + 1, error: 'Missing roll number' });
        continue;
      }
      if (!imageCell) {
        errors.push({ row: i + 1, roll, error: 'Missing image cell' });
        continue;
      }

      const data = createData(imageCell);
      if (!data) {
        errors.push({ row: i + 1, roll, error: 'Invalid image data (not data URI or base64 string)' });
        continue;
      }

      const buf = Buffer.from(data.base64, 'base64');
      const filename = `${roll.replace(/\s+/g, '_')}.${data.ext}`;
      const outPath = path.join(OUTPUT_DIR, filename);
      try {
        fs.writeFileSync(outPath, buf);
        saved++;
      } catch (err) {
        errors.push({ row: i + 1, roll, error: err.message });
      }
    }
  } else {
    // Try extracting embedded images from drawing objects
    const files = extractEmbeddedImages(file);
    const anchors = parseDrawings(files);
    if (anchors.length === 0) {
      console.error('No image column detected and no embedded drawings found. Headers:', headers.join(', '));
      process.exit(1);
    }

    // Map anchors by row to media file
    const mediaMap = {};
    anchors.forEach(a => {
      mediaMap[a.row] = a.mediaPath;
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const roll = row[rollIdx] ? String(row[rollIdx]).trim() : '';
      if (!roll) {
        errors.push({ row: i + 1, error: 'Missing roll number' });
        continue;
      }
      const anchor = mediaMap[i - 1]; // anchor rows are 0-based
      if (!anchor) {
        errors.push({ row: i + 1, roll, error: 'No embedded image for this row' });
        continue;
      }
      const mediaData = files[anchor];
      if (!mediaData) {
        errors.push({ row: i + 1, roll, error: `Embedded media not found: ${anchor}` });
        continue;
      }
      const ext = path.extname(anchor).replace('.', '') || 'jpg';
      const filename = `${roll.replace(/\s+/g, '_')}.${ext}`;
      const outPath = path.join(OUTPUT_DIR, filename);
      try {
        fs.writeFileSync(outPath, mediaData);
        saved++;
      } catch (err) {
        errors.push({ row: i + 1, roll, error: err.message });
      }
    }
  }

  console.log(`Saved ${saved} photos to ${OUTPUT_DIR}`);
  if (errors.length) {
    console.log('Errors:', errors);
  }
};

const arg = process.argv[2];
run(arg);
