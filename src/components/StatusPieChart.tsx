import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js'
// grab the sample data
import type { RadiationDose } from '../data/radiationData'
import { WITHIN_COLOR, ABOVE_COLOR, WARN_COLOR } from './chartColors'
// same categories + counting as the status bar chart
import { CATEGORY_LABELS, countByStatus } from './StatusChart'

// makes the config for the status pie chart
function makePieConfig(counts: number[], total: number): 
ChartConfiguration<'pie'> 
{
  return {
    type: 'pie',
    data: {
      labels: [...CATEGORY_LABELS],
      datasets: [
        {
          label: 'Participants',
          data: counts,
          // one slice color per status category
          backgroundColor: [WITHIN_COLOR, WARN_COLOR, ABOVE_COLOR],
          borderWidth: 0,
        },
      ],
    },

    // this is the only part that somewhat differs from the status bar chart
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // a pie has no axis labels, so the legend carries the categories
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            // show the share of the cohort next to the raw count
            label: (item) => {
              const count = (item.parsed == null ? 0 : item.parsed)
              const share = total > 0 ? (count / total) * 100 : 0
              return ` ${count} participants (${share.toFixed(1)}%)`
            },
          },
        },
      },
    },
  }
}

// the status pie chart component, again, almost 1 on 1 aas the bar chart
export function StatusPieChart({limit, entries}: {limit: number, entries: RadiationDose[]}) 
{
  // the canvas element and the chart.js instance
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)
  const total = entries.length

  // create the chart once per participant set
  useEffect(() => {
    if (!canvasRef.current) return
    const counts = countByStatus(
      entries.map((entry) => entry.dose),
      limit,
    )
    chart.current = new Chart(canvasRef.current, makePieConfig(counts, total))
    return () => {
      chart.current?.destroy()
      chart.current = null
    }
    // later limit changes are handled by the update effect below
  }, [entries, total, limit])

  // recount the slices when the limit moves
  useEffect(() => {
    const current = chart.current
    if (!current) return
    const dataset = current.data.datasets[0]
    if (dataset) {
      dataset.data = countByStatus(
        entries.map((entry) => entry.dose),
        limit,
      )
    }
    current.update('none')
  }, [limit, total, entries])

  // the pie chart itself
  return (
    <div className="chart-card">
      <canvas className="chart-canvas" ref={canvasRef} />
    </div>
  )
}
