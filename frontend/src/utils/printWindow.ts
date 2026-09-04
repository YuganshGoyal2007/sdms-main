/**
 * Open a print dialog with a custom layout (table only, no sidebar/header/footer noise).
 * Pass a title and an array of HTML blocks (each a separate <section>).
 */
export const openPrintWindow = (title: string, sectionsHtml: string[]) => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
        alert("Pop-up blocked. Please allow pop-ups to print.");
        return;
    }
    w.document.open();
    w.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!))}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #111; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    h2 { font-size: 16px; margin: 16px 0 6px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 12px; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 60px repeat(11, minmax(64px, 1fr)); border: 1px solid #333; }
    .grid > div { border-right: 1px solid #333; border-bottom: 1px solid #333; padding: 4px; min-height: 32px; font-size: 11px; }
    .grid > div.head { background: #f3f4f6; font-weight: 600; text-align: center; }
    .pill { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin: 1px; }
    .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
    @media print {
        body { margin: 12px; }
        .section { page-break-inside: avoid; }
        thead { display: table-header-group; }
    }
</style>
</head>
<body>
<header>
    <h1>SDMS - Gautam Buddha University</h1>
    <p class="meta">${title} &middot; Generated on ${new Date().toLocaleString()}</p>
</header>
${sectionsHtml.join("\n")}
<footer class="footer">
    &copy; 2026 Gautam Buddha University &middot; Developed by Nishant Chauhan, Ashish Kumar &amp; Yugansh Goyal
</footer>
</body>
</html>`);
    w.document.close();

    // Wait for images / styles, then trigger print
    const trigger = () => {
        try { w.focus(); w.print(); } catch { /* ignore */ }
    };
    if (w.document.readyState === "complete") trigger();
    else w.addEventListener("load", trigger);
};
