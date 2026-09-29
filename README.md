# SEP Frontend

React website bundled with esbuild. Parses CSV files with PapaParse and
renders them as ECharts bar charts.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Bundles and serves the site with live reload (port 3000)   |
| `npm run build`   | Produces a minified bundle and static site in `dist/`     |
| `npm run typecheck` | Runs `tsc --noEmit` over `src/`                          |

## Structure

```
├── public/           Static assets served as-is (index.html, sample.csv)
├── scripts/          esbuild dev-server and build scripts
└── src/
    ├── index.tsx    React entry point
    ├── App.tsx      Page layout
    └── components/
        └── CsvChart.tsx  CSV upload -> PapaParse -> ECharts bar chart
```

## How the demo works

`CsvChart` accepts a CSV file (or loads `public/sample.csv`). PapaParse
parses it with headers and dynamic typing; the first column becomes the
x-axis categories and every numeric column becomes a chart series.
