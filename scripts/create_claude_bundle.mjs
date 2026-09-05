import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');

// Dynamically import archiver from backend/node_modules
const archiverModulePath = path.resolve(rootDir, 'backend', 'node_modules', 'archiver', 'index.js');
const { default: archiver } = await import(`file://${archiverModulePath}`);

async function createZipBundle() {
  const outputZipName = 'GBU_SDSM_Claude_Bundle.zip';
  const targetPath = path.resolve(rootDir, outputZipName);
  const parentTargetPath = path.resolve(parentDir, outputZipName);

  console.log(`Creating clean bundle: ${targetPath}...`);
  const output = fs.createWriteStream(targetPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression level
  });

  output.on('close', () => {
    const bytes = archive.pointer();
    console.log('==================================================');
    console.log(`Zip archive successfully created!`);
    console.log(`Total Compressed Size: ${(bytes / 1024).toFixed(2)} KB (${(bytes / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`Location 1: ${targetPath}`);

    // Copy to parent directory for convenience
    fs.copyFileSync(targetPath, parentTargetPath);
    console.log(`Location 2 (Parent Directory): ${parentTargetPath}`);
    console.log('==================================================');
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('Archive Warning:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // 1. Root documentation & meta files
  const rootFiles = [
    'README_CLAUDE.md',
    'SYSTEM_DOCUMENTATION_COMPLETE_REFERENCE.md',
    'AI-HANDOFF.md',
    'DEBUG-README.md',
    'package.json',
    '.gitignore',
  ];

  for (const file of rootFiles) {
    const filePath = path.resolve(rootDir, file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
      console.log(`Added root file: ${file}`);
    }
  }

  // 2. Backend files (ignoring node_modules, logs, .git)
  archive.glob('**/*', {
    cwd: path.resolve(rootDir, 'backend'),
    ignore: [
      '**/node_modules/**',
      '**/logs/**',
      '**/.git/**',
      '**/*.sqlite',
    ],
  }, { prefix: 'backend' });
  console.log('Queued backend source files...');

  // 3. Frontend files (ignoring node_modules, dist, .git)
  archive.glob('**/*', {
    cwd: path.resolve(rootDir, 'frontend'),
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
    ],
  }, { prefix: 'frontend' });
  console.log('Queued frontend source files...');

  // 4. Scripts
  archive.glob('**/*', {
    cwd: path.resolve(rootDir, 'scripts'),
    ignore: [
      '**/node_modules/**',
    ],
  }, { prefix: 'scripts' });
  console.log('Queued documentation scripts...');

  await archive.finalize();
}

createZipBundle().catch((err) => {
  console.error('Error creating zip bundle:', err);
  process.exit(1);
});
