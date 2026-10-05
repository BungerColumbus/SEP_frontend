import { useEffect, useMemo, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration, Plugin } from 'chart.js'
// graab the sample data
import { RADIATION_DOSES } from '../data/radiationData'
import { WITHIN_COLOR, ABOVE_COLOR, LIMIT_COLOR } from './chartColors'

// every dose from radiation doses
const DOSES = RADIATION_DOSES.map((entry) => entry.dose)

// All the data needed for a histogram
interface Histogram {
  labels: string[]
  counts: number[]
  edges: number[]
  binWidth: number
  binCount: number
}

// Helps with showing the bin value in the histogram
function formatBinValue(value: number):
string {
  if (Number.isInteger(value)) {
    return String(value)
  } else {
    return value.toFixed(1)
  }
}

// the function that builds the histogram
function makeHistogram(doses: number[]): Histogram {
  const max = Math.max(...doses)
  // aim for around 8 bins
  const targetBins = Math.min(16, Math.max(8))
  // the width each bin would need, before rounding it to a nice number
  const rawWidth = max / targetBins
  const scale = Math.pow(10, Math.floor(Math.log10(rawWidth)))
  // snap to the first nice width that is big enough
  const snappedWidth = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]
    .map((m) => m * scale)
    .find((w) => w >= rawWidth)
  const binWidth = (snappedWidth != undefined ? snappedWidth : Math.ceil(rawWidth / scale) * scale)
  // how many bins of that width fit over the data
  const binCount = Math.max(1, Math.ceil(max / binWidth))

  // count how many doses land in each bin
  const counts = new Array<number>(binCount).fill(0)
  for (const dose of doses) {
    const bin = Math.min(binCount - 1, Math.floor(dose / binWidth))
    const previous = counts[bin]
    //had some problems with "prveious is declared but possibly undefined"
    counts[bin] = (previous == undefined ? 1 : previous + 1)
  }

  // the edges and labels under the bars
  const edges = Array.from({ length: binCount }, (_, i) => i * binWidth)
  const labels = edges.map(
    (low) => `${formatBinValue(low)}\u2013${formatBinValue(low + binWidth)}`,
  )
  return { labels, counts, edges, binWidth, binCount }
}

// Vertical limit line drawn over the histogram's category axis:
// dose d sits at fraction d / (binWidth * binCount) of the x-axis.
function makeLimitLinePlugin(
  limitRef: { current: number },
  histogram: Histogram,
): Plugin<'bar'> {
  return {
    id: 'limitLine',
    afterDatasetsDraw(chart) {
      const limit = limitRef.current
      const { left, right, top, bottom } = chart.chartArea
      // turn the limit into a pixel position on the x axis
      const span = histogram.binWidth * histogram.binCount
      const x = left + (Math.min(limit, span) / span) * (right - left)
      const { ctx } = chart

      // draw the dashed line
      ctx.save()
      ctx.strokeStyle = LIMIT_COLOR
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()
      ctx.setLineDash([])

      // the "Limit X mSv" text next to the line
      const label = `Limit ${limit.toFixed(1)} mSv`
      ctx.fillStyle = LIMIT_COLOR
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(label, Math.min(x + 8, right - ctx.measureText(label).width - 4), top + 14)
      ctx.restore()
    },
  }
}

// makes the config for the histogram view
function makeHistogramConfig(
  histogram: Histogram,
  limitRef: { current: number },
): ChartConfiguration<'bar'> {
  const limit = limitRef.current
  return {
    type: 'bar',
    data: {
      labels: histogram.labels,
      datasets: [
        {
          label: 'Participants',
          data: histogram.counts,
          // red bars when the whole bin is at or above the limit
          backgroundColor: histogram.edges.map((low) =>
            low >= limit ? ABOVE_COLOR : WITHIN_COLOR,
          ),
          // bars touch each other -> real histogram look
          barPercentage: 1,
          categoryPercentage: 1,
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
            title: (items) => {
              const first = items[0]
              if(first)
                `Bin ${first.label} mSv` 
              else
                ''
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Cumulative dose (mSv)' },
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: false },
        },
        y: {
          title: { display: true, text: 'Participants' },
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
    plugins: [makeLimitLinePlugin(limitRef, histogram)],
  }
}

// the histogram chart component
export function HistogramChart({ limit }: { limit: number }) {
  // the canvas element and the chart.js instance
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)
  const limitRef = useRef(limit)
  // I would have not used memo if it wasn't for the LLM ngl
  const histogram = useMemo(() => makeHistogram(DOSES), [])

  // create the chart once
  useEffect(() => {
    if (!canvasRef.current) return
    chart.current = new Chart(canvasRef.current, makeHistogramConfig(histogram, limitRef))
    return () => {
      chart.current?.destroy()
      chart.current = null
    }
  }, [histogram])

  // update the chart when the limit moves
  useEffect(() => {
    limitRef.current = limit
    const current = chart.current
    if (!current) return

    // recolor the bars that are above the limit
    const dataset = current.data.datasets[0]
    if (dataset) {
      dataset.backgroundColor = histogram.edges.map((low) =>
        low >= limit ? ABOVE_COLOR : WITHIN_COLOR,
      )
    }
    current.update('none')
  }, [limit, histogram])

  // the histogram itself
  return (
    <div className="chart-card">
      <canvas className="chart-canvas" ref={canvasRef} />
    </div>
  )
}
