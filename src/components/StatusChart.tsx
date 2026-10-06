import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js'
// grab the sample data
import { RADIATION_DOSES } from '../data/radiationData'
import { WITHIN_COLOR, ABOVE_COLOR, WARN_COLOR } from './chartColors'

// the radiation status categories that were also used in the BEP
const CATEGORY_LABELS = [
  'Below threshold',
  'Will exceed threshold',
  'Exceeding threshold',
]

// participants above this fraction of the limit are expected to cross
// the threshold before the study ends (only the cumulative dose is known)
const PROJECTION_FRACTION = 0.75

// just counts the participants in each status category
function countByStatus(doses: number[], limit: number): number[] {
  const projectedLimit = limit * PROJECTION_FRACTION
  const counts = [0, 0, 0]
  for (const dose of doses) {
    if (dose >= limit) {
      counts[2] = (counts[2] == undefined ? 1 : counts[2] + 1)
    } else if (dose >= projectedLimit) {
      counts[1] = (counts[1] == undefined ? 1 : counts[1] + 1)
    } else {
      counts[0] = (counts[0] == undefined ? 1 : counts[0] + 1)
    }
  }
  return counts
}

// makes the config for the status bar chart
function makeStatusConfig(counts: number[], total: number,): 
ChartConfiguration<'bar'> 
{
  return {
    type: 'bar',
    data: {
      labels: [...CATEGORY_LABELS],
      datasets: [
        {
          label: 'Participants',
          data: counts,
          // one color per status category
          backgroundColor: [WITHIN_COLOR, WARN_COLOR, ABOVE_COLOR],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // show the share of the cohort next to the raw count
            label: (item) => {
              const count = (item.parsed.y == null ? 0 : item.parsed.y)
              const share = total > 0 ? (count / total) * 100 : 0
              return `${count} participants (${share.toFixed(1)}%)`
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Radiation status' },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'Participants' },
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  }
}

// the status bar chart component almost 1 on 1 to how histogram configuration is made
export function StatusChart({ limit }: { limit: number }) {
  // the canvas element and the chart.js instance
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)
  const total = RADIATION_DOSES.length

  // create the chart once
  useEffect(() => {
    if (!canvasRef.current) return
    const counts = countByStatus(
      RADIATION_DOSES.map((entry) => entry.dose),
      limit,
    )
    chart.current = new Chart(canvasRef.current, makeStatusConfig(counts, total))
    return () => {
      chart.current?.destroy()
      chart.current = null
    }
    // later limit changes are handled by the update effect below
  }, [])

  // recount the categories when the limit moves
  useEffect(() => {
    const current = chart.current
    if (!current) return
    const dataset = current.data.datasets[0]
    if (dataset) {
      dataset.data = countByStatus(
        RADIATION_DOSES.map((entry) => entry.dose),
        limit,
      )
    }
    current.update('none')
  }, [limit, total])

  // the bar chart itself
  return (
    <div className="chart-card">
      <canvas className="chart-canvas" ref={canvasRef} />
    </div>
  )
}
