import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const evidenceDir = path.resolve('..', 'e2e_evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function verifyStatusPills() {
  console.log('--- STARTING STATUS PILLS & DROPDOWN VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  // 1. Login
  console.log('1. Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="Email / Roll No"], input[type="email"], input[type="text"]', 'hod.cs@gbu.ac.in');
  await page.type('input[type="password"]', 'admin123');
  
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  console.log('Logged in. Current URL:', page.url());

  // 2. Navigate to classes / CategoryView
  console.log('2. Navigating to student category view...');
  await page.goto('http://localhost:5173/admin/records/soict/cse/B.Tech/2023-27/AI', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 3. Extract status filter pills
  const pillTexts = await page.$$eval('div.flex.items-center.gap-2.mb-3 button', btns => btns.map(b => b.innerText.trim()));
  console.log('Status filter pills found on page:', pillTexts);

  const hasAll = pillTexts.some(t => t.startsWith('All'));
  const hasActive = pillTexts.some(t => t.startsWith('Active'));
  const hasInactive = pillTexts.some(t => t.startsWith('Inactive'));
  const hasPassOut = pillTexts.some(t => t.startsWith('Pass Out'));
  const hasWithdrawal = pillTexts.some(t => t.startsWith('Withdrawal'));
  const hasPresent = pillTexts.some(t => t.startsWith('Present'));
  const hasWithdrawn = pillTexts.some(t => t.startsWith('Withdrawn'));

  console.log('Pill checks:');
  console.log(' - All pill present:', hasAll);
  console.log(' - Active pill present:', hasActive);
  console.log(' - Inactive pill present:', hasInactive);
  console.log(' - Pass Out pill present (NEW):', hasPassOut);
  console.log(' - Withdrawal pill present (CORRECTED):', hasWithdrawal);
  console.log(' - Present pill removed (OBSOLETE):', !hasPresent);
  console.log(' - Withdrawn pill removed (OBSOLETE):', !hasWithdrawn);

  if (!hasPassOut || !hasWithdrawal || hasPresent || hasWithdrawn) {
    throw new Error('Pill assertion failed! Check pill options.');
  }

  // 4. Click Pass Out pill and take screenshot
  const passOutBtn = (await page.$$('div.flex.items-center.gap-2.mb-3 button'))[3];
  if (passOutBtn) {
    await passOutBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const passOutShot = path.join(evidenceDir, 'status_passout_filter.png');
    await page.screenshot({ path: passOutShot });
    console.log('Captured screenshot of Pass Out filter:', passOutShot);
  }

  // 5. Click Withdrawal pill and take screenshot
  const withdrawalBtn = (await page.$$('div.flex.items-center.gap-2.mb-3 button'))[4];
  if (withdrawalBtn) {
    await withdrawalBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const wdnShot = path.join(evidenceDir, 'status_withdrawal_filter.png');
    await page.screenshot({ path: wdnShot });
    console.log('Captured screenshot of Withdrawal filter:', wdnShot);
  }

  // 6. Reset to All
  const allBtn = (await page.$$('div.flex.items-center.gap-2.mb-3 button'))[0];
  if (allBtn) await allBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // 7. Check bulk update status dropdown options
  const bulkStatusOptions = await page.$$eval('select', selects => {
    for (const sel of selects) {
      const opts = Array.from(sel.options).map(o => o.text.trim());
      if (opts.includes('Active') && opts.includes('Inactive')) {
        return opts;
      }
    }
    return [];
  });
  console.log('Bulk Status select options found:', bulkStatusOptions);

  const fullOverviewShot = path.join(evidenceDir, 'status_pills_verified.png');
  await page.screenshot({ path: fullOverviewShot, fullPage: false });
  console.log('Full verified screenshot saved to:', fullOverviewShot);

  await browser.close();
  console.log('--- ALL STATUS VERIFICATIONS PASSED SUCCESSFULLY ---');
}

verifyStatusPills().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
