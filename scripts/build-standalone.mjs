import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distAssetsDir = path.join(rootDir, 'dist', 'assets');

const cssFiles = fs
  .readdirSync(distAssetsDir)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(distAssetsDir, f), 'utf8'));

const combinedCss = cssFiles.join('\n');

const jsBuild = await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  plugins: [
    {
      name: 'ignore-css',
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      }
    }
  ],
  write: false
});

const rawJs = jsBuild.outputFiles[0].text;
// Escape any closing </script sequences inside string/regex literals so inline HTML parsing never breaks
const safeInlineJs = rawJs.replace(/<\/script/gi, '<\\/script');

const standaloneHtml = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ניהול גיל המעבר – מערכת קלינית תומכת החלטה (Zero-Server CDSS)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Rubik:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>${combinedCss}</style>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div id="root"></div>
    <script>${safeInlineJs}</script>
  </body>
</html>
`;

const rootStandalonePath = path.join(rootDir, 'standalone.html');
const distStandalonePath = path.join(rootDir, 'dist', 'standalone.html');

fs.writeFileSync(rootStandalonePath, standaloneHtml, 'utf8');
fs.writeFileSync(distStandalonePath, standaloneHtml, 'utf8');

console.log(
  `[build-standalone] Generated standalone.html (${(Buffer.byteLength(standaloneHtml) / 1024).toFixed(1)} KB) from src/ with zero drift.`
);
