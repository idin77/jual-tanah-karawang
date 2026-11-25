import { useState } from 'react';

interface ProjectionRow {
  year: number;
  projectedValueBillions: number;
  gainBillions: number;
  gainPercent: number;
  valuePerSqmMillions: number;
}

const PROPERTY_AREA_SQM = 40_000;
const INVESTMENT_PRESETS = [90, 100, 120] as const;
const GROWTH_PRESETS = [8, 10, 12, 15] as const;
const HORIZON_OPTIONS = [5, 7, 10] as const;

function formatBillions(value: number): string {
  return `Rp ${value.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
}

function formatMillions(value: number): string {
  return `Rp ${value.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Jt`;
}

export default function RoiCalculator() {
  const [initialInput, setInitialInput] = useState<string>('100');
  const [growthInput, setGrowthInput] = useState<string>('10');
  const [horizonYears, setHorizonYears] = useState<5 | 7 | 10>(10);

  const parsedInitial = Number.parseFloat(initialInput);
  const initialBillions = Number.isFinite(parsedInitial) && parsedInitial > 0 ? Math.min(parsedInitial, 2000) : 100;

  const parsedGrowth = Number.parseFloat(growthInput);
  const annualGrowthPct =
    Number.isFinite(parsedGrowth) && parsedGrowth >= 0 ? Math.min(parsedGrowth, 50) : 10;

  const rate = annualGrowthPct / 100;

  const rows: ProjectionRow[] = Array.from({ length: horizonYears }, (_, index) => {
    const year = index + 1;
    const projectedValueBillions = initialBillions * Math.pow(1 + rate, year);
    const gainBillions = projectedValueBillions - initialBillions;
    const gainPercent = initialBillions > 0 ? (gainBillions / initialBillions) * 100 : 0;
    const valuePerSqmMillions = (projectedValueBillions * 1000) / PROPERTY_AREA_SQM;
    return {
      year,
      projectedValueBillions,
      gainBillions,
      gainPercent,
      valuePerSqmMillions,
    };
  });

  const year5Row = rows[4] ?? rows[rows.length - 1];
  const finalRow = rows[rows.length - 1];
  const maxProjected = finalRow?.projectedValueBillions || initialBillions || 1;

  return (
    <div className="roi-content">
      <div className="roi-top">
        <div className="roi-controls" aria-label="Parameter simulasi ROI properti">
          <div className="roi-field">
            <div className="roi-label-row">
              <label htmlFor="roi-initial">Investasi Awal (Rp Milyard)</label>
              <span className="roi-hint-val">{formatBillions(initialBillions)}</span>
            </div>
            <div className="roi-input-wrap">
              <span className="roi-prefix">Rp</span>
              <input
                id="roi-initial"
                type="number"
                min={1}
                max={2000}
                step={5}
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                aria-describedby="roi-initial-presets"
              />
              <span className="roi-suffix">Milyard</span>
            </div>
            <div className="roi-presets" id="roi-initial-presets">
              {INVESTMENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`map-ctrl-btn${Math.abs(initialBillions - preset) < 0.01 ? ' active' : ''}`}
                  onClick={() => setInitialInput(String(preset))}
                >
                  Rp {preset} M
                </button>
              ))}
            </div>
          </div>

          <div className="roi-field">
            <div className="roi-label-row">
              <label htmlFor="roi-growth">Estimasi Kenaikan / Tahun (%)</label>
              <span className="roi-hint-val">+{annualGrowthPct.toLocaleString('id-ID')}% / thn</span>
            </div>
            <div className="roi-input-wrap">
              <input
                id="roi-growth"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={growthInput}
                onChange={(e) => setGrowthInput(e.target.value)}
              />
              <span className="roi-suffix">% per tahun</span>
            </div>
            <input
              type="range"
              className="roi-slider"
              min={2}
              max={25}
              step={0.5}
              value={Math.min(Math.max(annualGrowthPct, 2), 25)}
              onChange={(e) => setGrowthInput(e.target.value)}
              aria-label="Atur persentase kenaikan nilai properti per tahun"
            />
            <div className="roi-presets">
              {GROWTH_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`map-ctrl-btn${Math.abs(annualGrowthPct - pct) < 0.01 ? ' active' : ''}`}
                  onClick={() => setGrowthInput(String(pct))}
                >
                  {pct}% / thn
                </button>
              ))}
            </div>
          </div>

          <div className="roi-field">
            <div className="roi-label-row">
              <span>Jangka Waktu Proyeksi</span>
              <span className="roi-hint-val">{horizonYears} Tahun</span>
            </div>
            <div className="roi-horizon-btns" role="group" aria-label="Pilih jangka waktu proyeksi">
              {HORIZON_OPTIONS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  className={`map-ctrl-btn${horizonYears === yr ? ' active' : ''}`}
                  onClick={() => setHorizonYears(yr)}
                >
                  {yr} Tahun
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="roi-summary" aria-label="Ringkasan proyeksi nilai properti">
          <div className="inv-kpi">
            <small>Modal Investasi Awal</small>
            <strong>{formatBillions(initialBillions)}</strong>
            <span>Setara {formatMillions((initialBillions * 1000) / PROPERTY_AREA_SQM)}/m&sup2;</span>
          </div>
          <div className="inv-kpi featured">
            <small>Proyeksi Tahun ke-5</small>
            <strong>{formatBillions(year5Row.projectedValueBillions)}</strong>
            <span>
              +{year5Row.gainPercent.toFixed(1).replace('.', ',')}% ({formatBillions(year5Row.gainBillions)})
            </span>
          </div>
          <div className="inv-kpi savings">
            <small>Proyeksi Tahun ke-{horizonYears}</small>
            <strong>{formatBillions(finalRow.projectedValueBillions)}</strong>
            <span>
              +{finalRow.gainPercent.toFixed(1).replace('.', ',')}% ({formatBillions(finalRow.gainBillions)})
            </span>
          </div>
        </div>
      </div>

      <div className="roi-visuals">
        <div className="inv-panel" aria-label="Grafik batang proyeksi nilai properti">
          <div className="inv-panel-hd">
            <b>Grafik Proyeksi Nilai Properti (Tahun 1 &#8211; {horizonYears})</b>
            <span>Pertumbuhan {annualGrowthPct.toLocaleString('id-ID')}% / tahun</span>
          </div>
          <svg className="svg-sprite" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="roiBaseGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0A3570" />
                <stop offset="100%" stopColor="#3B72BA" />
              </linearGradient>
              <linearGradient id="roiMilestoneGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFE98C" />
                <stop offset="55%" stopColor="#FFD409" />
                <stop offset="100%" stopColor="#E9A81B" />
              </linearGradient>
            </defs>
          </svg>
          <ul className="roi-bars">
            {rows.map((row) => {
              const widthPct = Math.max(8, Math.round((row.projectedValueBillions / maxProjected) * 100));
              const isMilestone = row.year === 5 || row.year === horizonYears;
              return (
                <li key={row.year} className={`roi-bar-row${isMilestone ? ' milestone' : ''}`}>
                  <span className="roi-bar-yr">Thn {row.year}</span>
                  <div className="inv-bar-track" role="presentation">
                    <svg className="inv-bar-svg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                      <rect
                        x="0"
                        y="0"
                        width={widthPct}
                        height="12"
                        rx="6"
                        fill={isMilestone ? 'url(#roiMilestoneGrad)' : 'url(#roiBaseGrad)'}
                      />
                    </svg>
                  </div>
                  <span className="roi-bar-val">{formatBillions(row.projectedValueBillions)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="inv-panel">
          <div className="inv-panel-hd">
            <b>Tabel Proyeksi Pertumbuhan Nilai</b>
            <span>Basis 40.000 m&sup2;</span>
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table roi-table">
              <thead>
                <tr>
                  <th scope="col">Tahun</th>
                  <th scope="col" className="num">
                    Nilai Properti
                  </th>
                  <th scope="col" className="num">
                    Kenaikan
                  </th>
                  <th scope="col" className="num">
                    Nilai / m&sup2;
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isMilestone = row.year === 5 || row.year === horizonYears;
                  return (
                    <tr key={row.year} className={isMilestone ? 'featured' : undefined}>
                      <td>
                        <strong>Tahun ke-{row.year}</strong>
                      </td>
                      <td className="num price">{formatBillions(row.projectedValueBillions)}</td>
                      <td className="num">
                        <span className="inv-diff best">
                          +{row.gainPercent.toFixed(1).replace('.', ',')}%
                        </span>
                      </td>
                      <td className="num price">{formatMillions(row.valuePerSqmMillions)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="inv-footnote">
        *Simulasi dihitung secara majemuk (compound annual growth) sebagai ilustrasi proyeksi nilai aset berdasarkan
        asumsi kenaikan tahunan yang Anda pilih.
      </p>
    </div>
  );
}
