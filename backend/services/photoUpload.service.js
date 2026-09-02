import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

const createDataUriFromBase64 = (base64String, mime = 'image/jpeg') => {
  if (!base64String || typeof base64String !== 'string') return null;
  const cleaned = base64String.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return null;
  return 'data:' + mime + ';base64,' + cleaned;
};

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
const isLocalFilePath = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return !!trimmed && /[\\/]/.test(trimmed) && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(trimmed);
};

const getMimeFromPath = (value) => {
  const ext = path.extname(value || '').toLowerCase().replace('.', '');
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
};

const getLocalImageDataUri = (value) => {
  if (!isLocalFilePath(value)) return null;
  const candidates = [
    value,
    path.resolve(value),
    path.resolve(process.cwd(), value),
    path.resolve(process.cwd(), 'backend', value),
    path.resolve(process.cwd(), 'backend', 'uploads', value),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const buffer = fs.readFileSync(candidate);
        return 'data:' + getMimeFromPath(candidate) + ';base64,' + buffer.toString('base64');
      }
    } catch (err) {
      // ignore invalid candidate
    }
  }

  return null;
};

const getRemoteImageDataUri = async (value) => {
  const urlString = String(value || '').trim();
  if (!isHttpUrl(urlString)) return null;

  try {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;

    return await new Promise((resolve) => {
      const request = client.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          return resolve(null);
        }
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve('data:' + contentType + ';base64,' + buffer.toString('base64'));
        });
      });
      request.on('error', () => resolve(null));
      request.end();
    });
  } catch (err) {
    return null;
  }
};

const getDataUriFromCell = async (imageCell) => {
  if (imageCell === undefined || imageCell === null) return null;
  const value = String(imageCell).trim();
  if (!value) return null;
  if (value.startsWith('data:image/')) return value;
  if (isHttpUrl(value)) return await getRemoteImageDataUri(value);
  if (isLocalFilePath(value)) return getLocalImageDataUri(value);
  return createDataUriFromBase64(value);
};

const extractFilesFromXlsx = (buffer) => {
  const zip = new AdmZip(buffer);
  const files = {};
  zip.getEntries().forEach((entry) => {
    const name = entry.entryName.replace(/\\\\/g, '/');
    try {
      if (name.startsWith('xl/media/')) {
        files[name] = entry.getData();
      } else if (name.startsWith('xl/')) {
        files[name] = entry.getData().toString('utf8');
      }
    } catch (err) {
      // ignore invalid entries
    }
  });
  return files;
};

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const detectHeaderRow = (rows, maxRows = 10) => {
  let best = { idx: 0, score: -1 };
  for (let r = 0; r < Math.min(rows.length, maxRows); r++) {
    const row = rows[r] || [];
    let score = 0;
    row.forEach((cell) => {
      const header = normalizeHeader(cell);
      if (!header) return;
      if (header.includes('roll') || header.includes('enroll') || header.includes('registration') || header.includes('studentid')) score += 5;
      if (header.includes('name') || header.includes('image') || header.includes('photo') || header.includes('picture')) score += 1;
      if (header.includes('path') || header.includes('url') || header.includes('link')) score += 1;
    });
    if (score > best.score) best = { idx: r, score };
  }
  return best.score > 0 ? best.idx : 0;
};

const isValidRoll = (val) => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s) return false;
  const digits = (s.match(/\d/g) || []).length;
  return digits >= 2 && digits <= 12 && s.length >= 3 && s.length <= 30;
};

const findRollInRow = (row) => {
  if (!Array.isArray(row)) return { value: null, col: -1 };
  for (let idx = 0; idx < row.length; idx++) {
    if (isValidRoll(row[idx])) {
      return { value: String(row[idx]).trim(), col: idx };
    }
  }
  return { value: null, col: -1 };
};

const parseWorksheetAnchors = (drawingObj, relMap) => {
  if (!drawingObj || !drawingObj['xdr:wsDr']) return [];
  const wsDr = drawingObj['xdr:wsDr'];
  const anchors = [];
  const anchorNodes = [];

  if (wsDr['xdr:twoCellAnchor']) anchorNodes.push(...(Array.isArray(wsDr['xdr:twoCellAnchor']) ? wsDr['xdr:twoCellAnchor'] : [wsDr['xdr:twoCellAnchor']]));
  if (wsDr['xdr:oneCellAnchor']) anchorNodes.push(...(Array.isArray(wsDr['xdr:oneCellAnchor']) ? wsDr['xdr:oneCellAnchor'] : [wsDr['xdr:oneCellAnchor']]));

  anchorNodes.forEach((anchor) => {
    try {
      const from = anchor['xdr:from'];
      const col = parseInt(from?.['xdr:col'] ?? from?.col ?? 0, 10);
      const row = parseInt(from?.['xdr:row'] ?? from?.row ?? 0, 10);
      const pic = anchor['xdr:pic'];
      const blip = pic?.['xdr:blipFill']?.['a:blip'] || pic?.['blipFill']?.['a:blip'];
      const embedId = blip?.['@_r:embed'] || blip?.['@_embed'] || blip?.['@_r:id'];
      if (!embedId) return;
      const target = relMap[embedId];
      if (!target) return;
      const mediaPath = target.replace(/^\.\./, 'xl');
      const fullPath = mediaPath.startsWith('xl/') ? mediaPath : 'xl/' + mediaPath;
      anchors.push({ row, col, mediaPath: fullPath });
    } catch (err) {
      // ignore malformed anchor
    }
  });

  return anchors;
};

const parseDrawingAnchors = (files) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const sheetKey = Object.keys(files).find((key) => /^xl\/worksheets\/sheet.*\.xml$/i.test(key));
  if (!sheetKey) return [];

  const sheetRelsKey = 'xl/worksheets/_rels/' + path.basename(sheetKey) + '.rels';
  const sheetRelsXml = files[sheetRelsKey];
  if (!sheetRelsXml) return [];

  const sheetRels = parser.parse(sheetRelsXml);
  const relationships = sheetRels?.Relationships?.Relationship || [];
  const drawingRel = Array.isArray(relationships)
    ? relationships.find((r) => r['@_Type']?.includes('/drawing'))
    : relationships['@_Type']?.includes('/drawing') ? relationships : null;
  if (!drawingRel) return [];

  const drawingTarget = drawingRel['@_Target'].replace(/^\.\./, 'xl');
  const drawingPath = drawingTarget.startsWith('xl/') ? drawingTarget : 'xl/' + drawingTarget;
  const drawingXml = files[drawingPath];
  if (!drawingXml) return [];

  const drawingRelsPath = 'xl/drawings/_rels/' + path.basename(drawingPath) + '.rels';
  const drawingRelsXml = files[drawingRelsPath];
  const drawingRels = drawingRelsXml ? parser.parse(drawingRelsXml) : null;
  const rels = drawingRels?.Relationships?.Relationship || [];
  const relMap = {};
  if (rels) {
    if (Array.isArray(rels)) {
      rels.forEach((rel) => { relMap[rel['@_Id']] = rel['@_Target']; });
    } else {
      relMap[rels['@_Id']] = rels['@_Target'];
    }
  }

  return parseWorksheetAnchors(parser.parse(drawingXml), relMap);
};

const parseVMLAnchors = (files) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const anchors = [];

  Object.keys(files).forEach((key) => {
    if (!/^xl\/drawings\/vmlDrawing.*\.vml$/i.test(key)) return;
    const xml = files[key];
    if (typeof xml !== 'string') return;

    try {
      const vml = parser.parse(xml);
      const relsPath = 'xl/drawings/_rels/' + path.basename(key) + '.rels';
      const relsXml = files[relsPath];
      const rels = relsXml ? parser.parse(relsXml)?.Relationships?.Relationship : [];
      const relMap = {};
      if (rels) {
        if (Array.isArray(rels)) rels.forEach((rel) => { relMap[rel['@_Id']] = rel['@_Target']; });
        else relMap[rels['@_Id']] = rels['@_Target'];
      }

      const collectShapes = (node, result = []) => {
        if (!node || typeof node !== 'object') return result;
        if (node['v:shape'] || node['shape']) {
          const shapes = node['v:shape'] || node['shape'];
          if (Array.isArray(shapes)) shapes.forEach((item) => collectShapes(item, result));
          else result.push(shapes);
        }
        if (node['v:imagedata'] || node['imagedata'] || node['a:imagedata']) {
          const imagedata = node['v:imagedata'] || node['imagedata'] || node['a:imagedata'];
          result.push({ imagedata, node });
        }
        Object.values(node).forEach((child) => {
          if (typeof child === 'object') collectShapes(child, result);
        });
        return result;
      };

      const shapes = collectShapes(vml);
      shapes.forEach((shape) => {
        const clientData = shape?.node?.['x:ClientData'] || shape?.node?.['ClientData'] || shape?.node?.['clientData'];
        const imagedata = shape?.imagedata;
        if (!clientData || !imagedata) return;

        const row = Number(clientData['x:Row'] ?? clientData.Row ?? clientData.row ?? -1);
        const col = Number(clientData['x:Column'] ?? clientData.Column ?? clientData.col ?? -1);
        const rid = imagedata['@_r:id'] || imagedata['@_r:embed'] || imagedata['@_id'];
        if (rid === undefined || row < 0 || col < 0) return;

        const target = relMap[rid];
        if (!target) return;
        const mediaPath = target.replace(/^\.\./, 'xl');
        const fullPath = mediaPath.startsWith('xl/') ? mediaPath : 'xl/' + mediaPath;
        anchors.push({ row, col, mediaPath: fullPath });
      });
    } catch (err) {
      // ignore parse errors
    }
  });

  return anchors;
};

const findNearestAnchor = (anchors, rowIndex, colIndex) => {
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  anchors.forEach((anchor) => {
    const rowDelta = Math.abs(anchor.row - rowIndex);
    const colDelta = colIndex >= 0 ? Math.abs(anchor.col - colIndex) : 0;
    const score = rowDelta * 10 + colDelta;
    if (score < bestScore) {
      bestScore = score;
      best = anchor;
    }
  });
  return best;
};

export const uploadStudentPhotos = async (buffer) => {
  const results = [];
  const errors = [];

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    errors.push({ row: null, error: 'Unable to read Excel file' });
    return { results, errors };
  }

  if (!workbook?.SheetNames?.length) {
    errors.push({ row: null, error: 'Excel workbook has no sheets' });
    return { results, errors };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  if (!data || data.length === 0) {
    errors.push({ row: null, error: 'Excel file contains no data' });
    return { results, errors };
  }

  const headerRowIdx = detectHeaderRow(data, 10);
  const headerRow = data[headerRowIdx] || [];
  const normalizedHeaders = headerRow.map((h) => normalizeHeader(h));
  let rollNoIndex = normalizedHeaders.findIndex((h) => ['roll', 'enroll', 'registration', 'studentid', 'usn', 'id'].some((token) => h.includes(token)));
  const imageIndex = normalizedHeaders.findIndex((h) => ['image', 'photo', 'picture', 'url', 'path', 'link'].some((token) => h.includes(token)));

  const files = extractFilesFromXlsx(buffer);
  const drawingAnchors = parseDrawingAnchors(files);
  const vmlAnchors = parseVMLAnchors(files);
  const anchors = [...drawingAnchors, ...vmlAnchors];

  const hasImageColumn = imageIndex !== -1;
  const hasEmbeddedImages = anchors.length > 0;
  if (!hasImageColumn && !hasEmbeddedImages) {
    errors.push({ row: null, error: 'No image column or embedded images found in the sheet' });
  }

  const processRow = async (row, rowNumber) => {
    if (!row || row.length === 0) {
      errors.push({ row: rowNumber, error: 'Empty row' });
      return;
    }

    let rollNo = '';
    if (rollNoIndex !== -1) {
      rollNo = row[rollNoIndex] ? String(row[rollNoIndex]).trim() : '';
    }
    if (!rollNo) {
      const found = findRollInRow(row);
      rollNo = found.value || '';
      if (!rollNo && found.col !== -1) {
        rollNoIndex = found.col;
      }
    }
    if (!rollNo) {
      errors.push({ row: rowNumber, error: 'Missing roll number' });
      return;
    }

    let photoData = null;
    if (hasImageColumn && imageIndex !== -1) {
      const imageCell = row[imageIndex];
      if (imageCell !== null && imageCell !== undefined && String(imageCell).trim() !== '') {
        photoData = await getDataUriFromCell(imageCell);
        if (!photoData) {
          errors.push({ row: rowNumber, rollNo, error: 'Unsupported image cell format or invalid image data' });
          return;
        }
      }
    }

    if (!photoData && hasEmbeddedImages) {
      const sheetRowIndex = rowNumber - 1;
      const anchor = findNearestAnchor(anchors, sheetRowIndex, rollNoIndex);
      if (anchor) {
        const media = files[anchor.mediaPath];
        if (media) {
          const mime = getMimeFromPath(anchor.mediaPath);
          const mediaBuffer = Buffer.isBuffer(media) ? media : Buffer.from(media, 'utf8');
          photoData = 'data:' + mime + ';base64,' + mediaBuffer.toString('base64');
        } else {
          errors.push({ row: rowNumber, rollNo, error: 'Embedded media file not found: ' + anchor.mediaPath });
        }
      }
    }

    if (!photoData) {
      errors.push({ row: rowNumber, rollNo, error: hasImageColumn ? 'No photo data available for this row' : 'Missing embedded image object for this row' });
      return;
    }

    results.push({ rollNo, photoData });
  };

  for (let rowIndex = headerRowIdx + 1; rowIndex < data.length; rowIndex++) {
    await processRow(data[rowIndex], rowIndex + 1);
  }

  return { results, errors };
};

