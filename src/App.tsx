import { RadiationChart } from './components/RadiationChart'

export function App() {
  return (
    <main className="container">
      <h1>Histograms and Line charts for the current radiation dose of participants</h1>
      <RadiationChart />
    </main>
  )
}
