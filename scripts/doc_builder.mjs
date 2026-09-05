import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildDocumentation() {
  console.log('Loading all 15 technical documentation modules...');

  const modules = await Promise.all([
    import('./doc_modules/sec1_overview.mjs'),
    import('./doc_modules/sec2_database.mjs'),
    import('./doc_modules/sec3_security.mjs'),
    import('./doc_modules/sec4_api.mjs'),
    import('./doc_modules/sec5_frontend.mjs'),
    import('./doc_modules/sec6_pages.mjs'),
    import('./doc_modules/sec7_components.mjs'),
    import('./doc_modules/sec8_workflows.mjs'),
    import('./doc_modules/sec9_types.mjs'),
    import('./doc_modules/sec10_devops_history.mjs'),
    import('./doc_modules/sec11_qa_playbooks.mjs'),
    import('./doc_modules/sec12_security_audit.mjs'),
    import('./doc_modules/sec13_disaster_recovery.mjs'),
    import('./doc_modules/sec14_glossary_reference.mjs'),
    import('./doc_modules/sec15_ai_agent_scenarios.mjs'),
  ]);

  const sections = modules.map((m, i) => {
    const fnName = `getSection${i + 1}`;
    if (typeof m[fnName] !== 'function') {
      throw new Error(`Module ${i + 1} does not export ${fnName}()`);
    }
    return m[fnName]();
  });

  const fullDocument = sections.join('\n\n');
  const words = fullDocument.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lineCount = fullDocument.split('\n').length;
  const byteCount = Buffer.byteLength(fullDocument, 'utf8');

  console.log('==================================================');
  console.log(`Compilation Results:`);
  console.log(`Total Sections:    ${sections.length}`);
  console.log(`Total Word Count:  ${wordCount.toLocaleString()} words`);
  console.log(`Total Line Count:  ${lineCount.toLocaleString()} lines`);
  console.log(`Total File Size:   ${(byteCount / 1024).toFixed(2)} KB (${(byteCount / (1024 * 1024)).toFixed(2)} MB)`);
  console.log('==================================================');

  if (wordCount < 30000) {
    throw new Error(`CRITICAL REQUIREMENT FAILED: Word count is ${wordCount}, which is less than the strict minimum of 30,000 words!`);
  }

  const outputPath = path.resolve(__dirname, '..', 'SYSTEM_DOCUMENTATION_COMPLETE_REFERENCE.md');
  console.log(`Writing complete technical reference documentation to: ${outputPath}...`);

  fs.writeFileSync(outputPath, fullDocument, 'utf8');

  console.log('SUCCESS: System documentation successfully compiled and written!');
  console.log(`Target File: ${outputPath}`);
}

buildDocumentation().catch((err) => {
  console.error('Build Error:', err);
  process.exit(1);
});
