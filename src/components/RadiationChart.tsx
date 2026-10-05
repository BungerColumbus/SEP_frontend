import { useState } from 'react'
// still needed for the slider
import { RADIATION_DOSES } from '../data/radiationData'
import { HistogramChart } from './HistogramChart'
// the default dose limit for the slider
const DEFAULT_LIMIT = 5

// the component with the controls and both charts
export function RadiationChart() {
  // the slider value
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  // how many participants are above the limit + the max for the slider
  const aboveLimit = RADIATION_DOSES.filter((entry) => entry.dose > limit).length
  const maxSlider = Math.max(
    10,
    Math.ceil(Math.max(...RADIATION_DOSES.map((entry) => entry.dose))),
  )

  return (
    <section>
      <div className="controls">
        <label className="limit-control">
          <input
            type="range"
            min={0}
            max={maxSlider}
            step={0.1}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
          <span>Dose limit: {limit.toFixed(1)} mSv</span>
        </label>
        <span className="summary">
          {aboveLimit} of {RADIATION_DOSES.length} participants above the limit
        </span>
      </div>
      <HistogramChart limit={limit} />
    </section>
  )
}
