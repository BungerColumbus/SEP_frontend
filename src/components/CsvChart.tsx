import { useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'

echarts.use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

type Row = Record<string, string | number | null>

interface ChartData {
  categories: string[]
  series: { name: string; data: number[] }[]
}

function toChartData(rows: Row[]): ChartData | null {
  const firstRow = rows[0]
  if (!firstRow) return null

  const headers = Object.keys(firstRow)
  if (headers.length < 2) return null

  const categoryKey = headers[0]
  if (!categoryKey) return null
  const valueKeys = headers.slice(1).filter((key) =>
    rows.some((row) => typeof row[key] === 'number'),
  )
  if (valueKeys.length === 0) return null

  return {
    categories: rows.map((row) => String(row[categoryKey])),
    series: valueKeys.map((key) => ({
      name: key,
      data: rows.map((row) => Number(row[key] ?? 0)),
    })),
  }
}

export function CsvChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType | null>(null)
  const [data, setData] = useState<ChartData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const element = chartRef.current
    if (!element) return

    chart.current = echarts.init(element)
    const observer = new ResizeObserver(() => chart.current?.resize())
    observer.observe(element)

    return () => {
      observer.disconnect()
      chart.current?.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    if (!chart.current || !data) return

    chart.current.setOption({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value' },
      series: data.series.map((series) => ({ ...series, type: 'bar' as const })),
    })
  }, [data])

  const parseCsv = (input: string | File) => {
    Papa.parse<Row>(input, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const next = toChartData(results.data)
        if (!next) {
          setData(null)
          setError('CSV needs a header row with a label column and at least one numeric column.')
          return
        }
        setError(null)
        setData(next)
      },
      error: () => setError('Failed to parse CSV.'),
    })
  }

  const handleFile = (file: File | undefined) => {
    if (file) parseCsv(file)
  }

  const loadSample = async () => {
    try {
      const response = await fetch('/sample.csv')
      parseCsv(await response.text())
    } catch {
      setError('Could not load sample.csv.')
    }
  }

  return (
    <section>
      <div className="controls">
        <label className="file-label">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <button type="button" onClick={loadSample}>
          Load sample data
        </button>
      </div>
      {error && <p className="status">{error}</p>}
      <div className="chart-card">
        <div id="chart" ref={chartRef} />
      </div>
    </section>
  )
}
