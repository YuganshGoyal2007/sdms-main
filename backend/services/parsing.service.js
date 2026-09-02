import XLSX from 'xlsx'

export const parseExcelDate = (value) => {
  if (!value) return null;

  // If already a JS Date
  if (value instanceof Date) return value;

  // If Excel serial number (could be number or numeric string from raw:false)
  const numValue = Number(value);
  if (!isNaN(numValue) && String(value).trim() !== "") {
    // Only treat it as an Excel date if it's > 10000 (after year 1927) to avoid parsing random small numbers
    if (numValue > 10000) {
      const parsed = XLSX.SSF.parse_date_code(numValue);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }

  // If string
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};