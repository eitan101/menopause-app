import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const specPath = path.join(rootDir, 'docs', 'TEST_SPECIFICATION.md');
const testEntryPath = path.join(rootDir, 'tests', 'systemScenarios.test.ts');
const tmpBundlePath = path.join(os.tmpdir(), `menopause_system_tests_${Date.now()}.mjs`);

try {
  await esbuild.build({
    entryPoints: [testEntryPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node20'],
    outfile: tmpBundlePath
  });

  const mod = await import(pathToFileURL(tmpBundlePath).href);
  const scenarios = mod.SYSTEM_TEST_SCENARIOS;

  if (!Array.isArray(scenarios) || scenarios.length !== 10) {
    throw new Error(`Expected exactly 10 system test scenarios, found ${scenarios?.length}`);
  }

  const specContent = fs.readFileSync(specPath, 'utf8');
  const testSourceContent = fs.readFileSync(testEntryPath, 'utf8');

  console.log('===================================================================');
  console.log(' Running 10 End-to-End Clinical System Scenarios & Link Verification');
  console.log('===================================================================');

  for (const sc of scenarios) {
    // 1. אימות רפרנס דו-כיווני: מהבדיקה אל המסמך ומהמסמך אל פונקציית הבדיקה + קיום מקורות הידע
    const expectedAnchorTag = `<a id="${sc.specAnchor}"></a>`;
    if (!specContent.includes(expectedAnchorTag) || !specContent.includes(sc.id)) {
      throw new Error(`Missing anchor ${expectedAnchorTag} or ID ${sc.id} in docs/TEST_SPECIFICATION.md`);
    }
    if (!specContent.includes(sc.functionName)) {
      throw new Error(
        `Bidirectional link missing: docs/TEST_SPECIFICATION.md does not reference ${sc.functionName}`
      );
    }
    if (!testSourceContent.includes(`docs/TEST_SPECIFICATION.md#${sc.specAnchor}`)) {
      throw new Error(
        `Bidirectional link missing: tests/systemScenarios.test.ts does not reference docs/TEST_SPECIFICATION.md#${sc.specAnchor}`
      );
    }
    for (const srcRel of sc.knowledgeSources) {
      const fullSrcPath = path.join(rootDir, srcRel);
      if (!fs.existsSync(fullSrcPath)) {
        throw new Error(`Referenced knowledge source not found for ${sc.id}: ${srcRel}`);
      }
    }

    // 2. הרצת התרחיש המערכתי מקצה לקצה
    sc.run();
    console.log(`✓ [${sc.id}] PASS — ${sc.titleHebrew} (↔ docs/TEST_SPECIFICATION.md#${sc.specAnchor})`);
  }

  console.log('-------------------------------------------------------------------');
  console.log('ALL 10 SYSTEM TEST SCENARIOS & BIDIRECTIONAL REFERENCES PASSED! (10/10)');
  console.log('===================================================================');
} finally {
  if (fs.existsSync(tmpBundlePath)) {
    fs.unlinkSync(tmpBundlePath);
  }
}
