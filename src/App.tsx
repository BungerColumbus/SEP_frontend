import { CsvChart } from './components/CsvChart'

export function App() {
  return (
    <main className="container">
      <h1>SEP Frontend</h1>
      <p className="subtitle">
        React + PapaParse + ECharts, bundled with esbuild.
      </p>
      <CsvChart />
      <p className="hint">
        Upload any CSV with a header row: the first column becomes the
        x-axis, every numeric column becomes a series. Try
        <code> public/sample.csv</code> via the button above.
      </p>
    </main>
  )
}
