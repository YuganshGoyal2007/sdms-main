/**
 * Tiny client-side xlsx writer. Builds an .xlsx zip from a 2D array of rows.
 * This is intentionally minimal — it does not support formulas, charts, or images.
 * Works in any modern browser without a dependency.
 *
 * Usage:
 *   import { downloadExcel } from "../utils/excel";
 *   downloadExcel("report.xlsx", [["Sr No","Name"], [1, "Alice"]], "Students");
 */
import JSZip from "jszip";

const escapeXml = (s: string) =>
    s.replace(/[<>&"']/g, (c) => {
        switch (c) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            case '"': return "&quot;";
            case "'": return "&apos;";
            default: return c;
        }
    });

const columnLabel = (index: number) => {
    let n = index;
    let s = "";
    while (n >= 0) {
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26) - 1;
    }
    return s;
};

const buildSheet = (sheetName: string, rows: (string | number | null | undefined)[][]) => {
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const sheetRows: string[] = [];

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r] || [];
        const cells: string[] = [];
        for (let c = 0; c < maxCols; c++) {
            const v = row[c];
            if (v === null || v === undefined || v === "") continue;
            const col = columnLabel(c);
            const cellRef = `${col}${r + 1}`;
            if (typeof v === "number") {
                cells.push(`<c r="${cellRef}"><v>${v}</v></c>`);
            } else {
                const str = String(v);
                const isInline = str.length < 60 && !/[=<>]/.test(str);
                if (isInline) {
                    cells.push(`<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(str)}</t></is></c>`);
                } else {
                    cells.push(`<c r="${cellRef}" t="str"><v>${escapeXml(str)}</v></c>`);
                }
            }
        }
        sheetRows.push(`<row r="${r + 1}">${cells.join("")}</row>`);
    }

    const dimension = `A1:${columnLabel(Math.max(0, maxCols - 1))}${Math.max(1, rows.length)}`;
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="${dimension}"/>
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${Array.from({ length: maxCols }, (_, i) => `<col min="${i + 1}" max="${i + 1}" width="20" customWidth="1"/>`).join("")}</cols>
<sheetData>${sheetRows.join("")}</sheetData>
</worksheet>`;

    return {
        name: sheetName.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet1",
        xml: sheetXml,
    };
};

const buildWorkbook = (sheets: { name: string; xml: string }[]) => {
    const sheetEntries = sheets
        .map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join("");
    const sheetRelEntries = sheets
        .map((_s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join("");

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheetEntries}</sheets>
</workbook>`;

    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelEntries}</Relationships>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets
    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("")}
</Types>`;

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    return { workbookXml, workbookRels, contentTypes, rootRels };
};

export interface ExcelSheet {
    name: string;
    rows: (string | number | null | undefined)[][];
}

export const downloadExcel = (filename: string, sheets: ExcelSheet[] | (string | number | null | undefined)[][], sheetName = "Sheet1") => {
    const isMatrix = Array.isArray(sheets[0]) && (sheets.length === 0 || Array.isArray(sheets[0]));
    const normalized: ExcelSheet[] = isMatrix
        ? [{ name: sheetName, rows: sheets as (string | number | null | undefined)[][] }]
        : (sheets as ExcelSheet[]);

    if (!normalized.length) {
        normalized.push({ name: sheetName, rows: [] });
    }

    const built = normalized.map((s) => buildSheet(s.name, s.rows));
    const { workbookXml, workbookRels, contentTypes, rootRels } = buildWorkbook(built);

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("_rels")!.file(".rels", rootRels);
    const xl = zip.folder("xl")!;
    xl.file("workbook.xml", workbookXml);
    xl.folder("_rels")!.file("workbook.xml.rels", workbookRels);
    const sheetsFolder = xl.folder("worksheets")!;
    built.forEach((s, i) => sheetsFolder.file(`sheet${i + 1}.xml`, s.xml));

    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
};
