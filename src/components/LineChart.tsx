import { useEffect, useMemo, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration, ChartDataset } from 'chart.js'
// graab the sample data
import type { RadiationDose } from '../data/radiationData'
import { WITHIN_COLOR, WITHIN_LINE, ABOVE_COLOR, LIMIT_COLOR } from './chartColors'

// makes the config for the line chart view
function makeLineConfig(sorted: RadiationDose[], limitRef: { current: number }): 
ChartConfiguration<'line'> 
{
  const limit = limitRef.current
  return {
    type: 'line',
    data: {
      // X-axis is the participant IDs in dose order, so each
      // dot on the line directly represents one participant.
      labels: sorted.map((entry) => entry.participant),
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
          // grow the dot when hovering it, so the participant is easy to find
          pointHoverRadius: 5,
          pointHoverBackgroundColor: sorted.map((entry) =>
            entry.dose > limit ? LIMIT_COLOR : WITHIN_LINE,
          ),
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
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            // the tooltip title is the participant ID of the hovered dot
            title: (items) => {
              const first = items[0]
              return first ? first.label : ''
            },
            label: (item) => ` ${item.dataset.label}: ${(item.parsed.y == null ? 0 : item.parsed.y).toFixed(2)} mSv`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Participant ID (sorted by dose)' },
          ticks: { display: false, maxTicksLimit: 12 }
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
export function LineChart({limit, entries}: {limit: number, entries: RadiationDose[]}) 
{
  // the canvas element and the chart.js instance
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)
  // the limit lives in a ref so the segment colors can read it while drawing
  const limitRef = useRef(limit)
  // participants sorted by dose, computed once because the data never changes
  const sorted = useMemo(
    () => entries.slice().sort((a, b) => a.dose - b.dose),
    [entries],
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
