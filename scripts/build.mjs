import * as esbuild from 'esbuild'
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
rmSync('public/app.js', { force: true })

await esbuild.build({
  entryPoints: { app: './src/index.tsx' },
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
})

cpSync('public', 'dist', { recursive: true })

// The /esbuild script tag only exists for dev-server live reload.
const html = readFileSync('dist/index.html', 'utf8').replace(
  '  <script src="/esbuild"></script>\n',
  '',
)
writeFileSync('dist/index.html', html)

console.log('Build written to dist/')
