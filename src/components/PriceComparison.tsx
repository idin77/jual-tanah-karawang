interface BenchmarkItem {
  id: string;
  label: string;
  shortLabel: string;
  segment: string;
  legality: string;
  accessScore: string;
  pricePerSqm: number;
  diffLabel: string;
  isFeatured?: boolean;
}

const PRICE_BENCHMARKS: readonly BenchmarkItem[] = [
  {
    id: 'telukjambe-site',
    label: 'Lahan Jl. Raya Telukjambe (Properti Ini)',
    shortLabel: 'Telukjambe (Lahan Ini)',
    segment: 'Zona Kuning · Komersial & Residential',
    legality: 'SHM',
    accessScore: 'Ring 1 Jalan Raya + 3 km KIIC/Tol',
    pricePerSqm: 2_500_000,
    diffLabel: 'Nego · Paling Kompetitif',
    isFeatured: true,
  },
  {
    id: 'east-industry',
    label: 'Kompetitor Kawasan Industri Karawang Timur',
    shortLabel: 'Industri Timur (Surya Cipta / Artha)',
    segment: 'Rata-rata Lahan Industri Timur',
    legality: 'HGB Kawasan',
    accessScore: 'Akses Kawasan Industri',
    pricePerSqm: 3_300_000,
    diffLabel: '+32% lebih mahal',
  },
  {
    id: 'west-industry',
    label: 'Kompetitor Kawasan Industri Karawang Barat (KIIC)',
    shortLabel: 'Industri Barat (KIIC & Tol)',
    segment: 'Rata-rata Lahan Industri Barat',
    legality: 'HGB Kawasan',
    accessScore: 'Dekat Gerbang Tol Karawang Barat',
    pricePerSqm: 3_850_000,
    diffLabel: '+54% lebih mahal',
  },
  {
    id: 'commercial-core',
    label: 'Kompetitor Koridor Komersial Utama Karawang',
    shortLabel: 'Komersial Utama (Galuh Mas / Kota)',
    segment: 'Rata-rata Lahan Komersial Primer',
    legality: 'SHM / HGB',
    accessScore: 'Pusat Bisnis & Mall',
    pricePerSqm: 4_500_000,
    diffLabel: '+80% lebih mahal',
  },
];

const MAX_BENCHMARK_PRICE = 4_500_000;

function formatMillionRupiah(value: number): string {
  const millions = value / 1_000_000;
  return `Rp ${millions.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Jt`;
}

export default function PriceComparison() {
  return (
    <div className="inv-content">
      <div className="inv-head">
        <div>
          <span className="inv-kicker">Nilai Strategis &amp; Valuasi Pasar Karawang</span>
          <h3>Perbandingan Harga Tanah per m&sup2; vs Kompetitor Kawasan</h3>
          <p>
            Dengan penawaran <strong>Rp 100 Milyard</strong> untuk luas <strong>40.000 m&sup2; (4 Ha)</strong>, biaya
            akuisisi efektif lahan ini hanya <strong>Rp 2,50 Jt/m&sup2; (masih nego)</strong> &#8212; memberi margin
            keuntungan awal jauh lebih tinggi dibanding lahan industri maupun komersial pembanding di Karawang.
          </p>
        </div>
        <div className="inv-kpis" aria-label="Ringkasan valuasi investasi">
          <div className="inv-kpi featured">
            <small>Harga Lahan Ini / m&sup2;</small>
            <strong>Rp 2,50 Jt</strong>
            <span>SHM &middot; Masih Nego</span>
          </div>
          <div className="inv-kpi">
            <small>Rata-rata Kompetitor</small>
            <strong>Rp 3,88 Jt</strong>
            <span>Industri &amp; Komersial</span>
          </div>
          <div className="inv-kpi savings">
            <small>Keunggulan Nilai Awal</small>
            <strong>Hemat &plusmn;35%</strong>
            <span>&plusmn;Rp 1,38 Jt/m&sup2; lebih hemat</span>
          </div>
        </div>
      </div>

      <div className="inv-grid">
        <div className="inv-panel">
          <div className="inv-panel-hd">
            <b>Tabel Perbandingan Harga Tanah per m&sup2; di Karawang</b>
            <span>Acuan Pasar 2026</span>
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th scope="col">Lokasi / Kompetitor</th>
                  <th scope="col">Legalitas</th>
                  <th scope="col" className="num">
                    Harga / m&sup2;
                  </th>
                  <th scope="col" className="num">
                    Perbandingan
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRICE_BENCHMARKS.map((item) => (
                  <tr key={item.id} className={item.isFeatured ? 'featured' : undefined}>
                    <td>
                      <strong>{item.label}</strong>
                      <small>
                        {item.segment} &middot; {item.accessScore}
                      </small>
                    </td>
                    <td data-label="Legalitas">
                      <span className={`inv-leg${item.isFeatured ? ' shm' : ''}`}>{item.legality}</span>
                    </td>
                    <td data-label="Harga / m²" className="num price">
                      {formatMillionRupiah(item.pricePerSqm)}
                    </td>
                    <td data-label="Perbandingan" className="num">
                      <span className={`inv-diff${item.isFeatured ? ' best' : ''}`}>{item.diffLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="inv-panel" aria-label="Grafik perbandingan harga tanah per meter persegi">
          <div className="inv-panel-hd">
            <b>Visualisasi Selisih Harga / m&sup2;</b>
            <span>Skala 0 &#8211; 4,5 Jt/m&sup2;</span>
          </div>
          <svg className="svg-sprite" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="invGoldGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFE98C" />
                <stop offset="55%" stopColor="#FFD409" />
                <stop offset="100%" stopColor="#E9A81B" />
              </linearGradient>
              <linearGradient id="invBlueGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0A3570" />
                <stop offset="100%" stopColor="#3B72BA" />
              </linearGradient>
            </defs>
          </svg>
          <ul className="inv-bars">
            {PRICE_BENCHMARKS.map((item) => {
              const widthPct = Math.round((item.pricePerSqm / MAX_BENCHMARK_PRICE) * 100);
              return (
                <li key={item.id} className={`inv-bar-row${item.isFeatured ? ' featured' : ''}`}>
                  <div className="inv-bar-meta">
                    <span className="inv-bar-name">
                      {item.shortLabel}
                      {item.isFeatured && <em className="inv-pill">Lahan Ini</em>}
                    </span>
                    <span className="inv-bar-val">
                      {formatMillionRupiah(item.pricePerSqm)}/m&sup2;
                    </span>
                  </div>
                  <div className="inv-bar-track" role="presentation">
                    <svg
                      className="inv-bar-svg"
                      viewBox="0 0 100 12"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={widthPct}
                        height="12"
                        rx="6"
                        fill={item.isFeatured ? 'url(#invGoldGrad)' : 'url(#invBlueGrad)'}
                      />
                    </svg>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="inv-scale" aria-hidden="true">
            <span>Rp 0</span>
            <span>Rp 1,5 Jt</span>
            <span>Rp 3,0 Jt</span>
            <span>Rp 4,5 Jt/m&sup2;</span>
          </div>
        </div>
      </div>

      <p className="inv-footnote">
        *Harga efektif Rp 2,50 Jt/m&sup2; dihitung dari harga penawaran Rp 100 Milyard &divide; 40.000 m&sup2; (masih
        nego). Angka kompetitor merupakan estimasi rata-rata pasar lahan komersial dan industri di kawasan Karawang.
      </p>
    </div>
  );
}
