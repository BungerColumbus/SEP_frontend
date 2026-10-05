import { useEffect, useMemo, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration, ChartDataset } from 'chart.js'
// graab the sample data
import { RADIATION_DOSES } from '../data/radiationData'
import type { RadiationDose } from '../data/radiationData'
import { WITHIN_COLOR, WITHIN_LINE, ABOVE_COLOR, LIMIT_COLOR } from './chartColors'

// makes the config for the line chart view
function makeLineConfig(
  sorted: RadiationDose[],
  limitRef: { current: number },
): ChartConfiguration<'line'> {
  const limit = limitRef.current
  return {
    type: 'line',
    data: {
      // X-axis is the accumulated participant count (1..N) in dose order.
      labels: sorted.map((_, index) => index + 1),
      datasets: [
        {
          // the dose of each participant, sorted low -> high
          label: 'Cumulative dose (mSv)',
          data: sorted.map((entry) => entry.dose),
          borderColor: WITHIN_LINE,
          // red dots when a participant is above the limit
          pointBackgroundColor: sorted.map((entry) =>
            entry.dose > limit ? ABOVE_COLOR : WITHIN_COLOR,
          ),
          pointRadius: 2,
          // red line segments when they go above the limit
          segment: {
            borderColor: (ctx) => {
              const y = ctx.p1.parsed.y
              return typeof y === 'number' && y > limitRef.current
                ? LIMIT_COLOR
                : WITHIN_LINE
            },
          },
        },
        {
          // the flat horizontal limit line
          label: 'Limit (mSv)',
          data: new Array<number>(sorted.length).fill(limit),
          borderColor: LIMIT_COLOR,
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: {
          title: { display: true, text: 'Nr of participants (sorted by dose)' },
          ticks: { autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: 'Cumulative dose (mSv)' },
          beginAtZero: true,
        },
      },
    },
  }
}

// the line chart component
export function LineChart({ limit }: { limit: number }) {
  // the canvas element and the chart.js instance
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)
  // the limit lives in a ref so the segment colors can read it while drawing
  const limitRef = useRef(limit)
  // participants sorted by dose, computed once because the data never changes
  const sorted = useMemo(
    () => RADIATION_DOSES.slice().sort((a, b) => a.dose - b.dose),
    [],
  )

  // create the chart once
  useEffect(() => {
    if (!canvasRef.current) return
    chart.current = new Chart(canvasRef.current, makeLineConfig(sorted, limitRef))
    return () => {
      chart.current?.destroy()
      chart.current = null
    }
  }, [sorted])

  // update the chart when the limit moves (no rebuild needed)
  useEffect(() => {
    limitRef.current = limit
    const current = chart.current
    if (!current) return

    // recolor the dots above the limit
    const doseDataset = current.data.datasets[0] as ChartDataset<'line'>
    if (doseDataset) {
      doseDataset.pointBackgroundColor = sorted.map((entry) =>
        entry.dose > limit ? ABOVE_COLOR : WITHIN_COLOR,
      )
    }
    // move the flat limit line
    const limitDataset = current.data.datasets[1]
    if (limitDataset) {
      limitDataset.data = new Array<number>(sorted.length).fill(limit)
    }
    current.update('none')
  }, [limit, sorted])

  // the line chart itself
  return (
    <div className="chart-card">
      <canvas className="chart-canvas" ref={canvasRef} />
    </div>
  )
}
