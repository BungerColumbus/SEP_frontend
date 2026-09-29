import * as esbuild from 'esbuild'

const ctx = await esbuild.context({
  entryPoints: { app: './src/index.tsx' },
  // esbuild requires outdir to be inside servedir; the bundle is
  // written next to index.html so it is served at /app.js.
  outdir: 'public',
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  sourcemap: 'inline',
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'info',
})

const port = Number(process.env.PORT) || 3000

await ctx.serve({ servedir: 'public', port, host: 'localhost' })
await ctx.watch()

console.log(`Dev server running at http://localhost:${port} (live reload on)`)
