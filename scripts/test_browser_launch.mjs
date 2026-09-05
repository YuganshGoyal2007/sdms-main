import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\harsh\\.gemini\antigravity\\brain\\0492bb3c-dcf0-4f20-b946-44c00d83febe\\screenshots';

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testLaunch() {
  console.log('Testing Chrome launch via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

  const title = await page.title();
  console.log('Page loaded successfully. Title:', title);

  const screenshotPath = path.join(screenshotDir, 'test_login.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

testLaunch().catch(e => { console.error('Browser launch error:', e); process.exit(1); });
