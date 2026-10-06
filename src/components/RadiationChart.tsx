import { useMemo, useState } from 'react'
// still needed for the slider
import { RADIATION_DOSES } from '../data/radiationData'
import type { RadiationDose } from '../data/radiationData'
import { REGION_SCAN_STATUSES } from '../data/patientRegionScanStatus'
import { HistogramChart } from './HistogramChart'
import { LineChart } from './LineChart'
import { StatusChart } from './StatusChart'
import { StatusPieChart } from './StatusPieChart'

// the default dose limit for the slider
const DEFAULT_LIMIT = 20

// every region a scan can be done in
const SCANNED_REGIONS = [
  'Head',
  'Chest',
  'Abdomen',
  'Thorax',
  'Pelvis',
  'Lumbar Spine',
]

// participants that show up in the scan status file at all
const KNOWN_PARTICIPANTS = new Set(
  REGION_SCAN_STATUSES.map((row) => row.participant),
)

// keeps only the participants that are missing every one of the given
// scans (participants without any scan data count as missing too)
function missingScans(entries: RadiationDose[], regions: string[]): RadiationDose[] 
{
  if (regions.length === 0) return entries
  const missingSets = regions.map((region) =>
    new Set(
      REGION_SCAN_STATUSES
        .filter((row) => row.scannedRegion === region && !row.scanned)
        .map((row) => row.participant),
    ),
  )
  return entries.filter((entry) =>
    missingSets.every(
      (missing) => missing.has(entry.participant) || !KNOWN_PARTICIPANTS.has(entry.participant),
    ),
  )
}

// the component with the controls and both charts
export function RadiationChart() {
  // the slider value
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  // the regions ticked in the checkboxes
  const [regions, setRegions] = useState<string[]>([])

  // the cohort after applying the region checkboxes
  const filtered = useMemo(() => missingScans(RADIATION_DOSES, regions), [regions])

  // how many participants are above the limit + the max for the slider
  const aboveLimit = filtered.filter((entry) => entry.dose > limit).length
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
        // check boxes for the regionsthat have been scanned and have been not scanned
        <fieldset className="region-control">
          <legend>Missing scans in:</legend>
          {SCANNED_REGIONS.map((region) => (
            <label key={region}>
              <input
                type="checkbox"
                checked={regions.includes(region)}
                onChange={() =>
                  setRegions((current) =>
                    current.includes(region)
                      ? current.filter((kept) => kept !== region)
                      : [...current, region],
                  )
                }
              />
              <span>{region}</span>
            </label>
          ))}
        </fieldset>
        <span className="summary">
          {aboveLimit} of {filtered.length} participants above the limit
          {regions.length > 0 ? ` (filtered from ${RADIATION_DOSES.length})` : ''}
        </span>
      </div>
      <HistogramChart limit={limit} entries={filtered} />
      <LineChart limit={limit} entries={filtered} />
      <StatusChart limit={limit} entries={filtered} />
      <StatusPieChart limit={limit} entries={filtered} />
    </section>
  )
}
