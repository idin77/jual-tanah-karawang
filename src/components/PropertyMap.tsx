import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const SITE_COORDS: [number, number] = [-6.3289088, 107.3115949];

export type LandmarkCategory = 'fasilitas' | 'industri';

export interface MapLandmark {
  id: string;
  title: string;
  subtitle: string;
  distance: string;
  distanceMeters: number;
  category: LandmarkCategory;
  iconId: string;
  coords: [number, number];
  zoom: number;
}

export const MAP_LANDMARKS: readonly MapLandmark[] = [
  {
    id: 'spbu',
    title: 'Pom Bensin (SPBU)',
    subtitle: 'Tepat di depan lahan',
    distance: '100 m',
    distanceMeters: 100,
    category: 'fasilitas',
    iconId: '#i-fuel',
    coords: [-6.32815, 107.31125],
    zoom: 17,
  },
  {
    id: 'pergudangan',
    title: 'Pergudangan & Hotel',
    subtitle: 'Agregasi logistik & menginap',
    distance: '500 m',
    distanceMeters: 500,
    category: 'fasilitas',
    iconId: '#i-wh',
    coords: [-6.3256, 107.3088],
    zoom: 16,
  },
  {
    id: 'mall',
    title: 'Pusat Perbelanjaan & Mall',
    subtitle: 'Belanja & kuliner',
    distance: '1 km',
    distanceMeters: 1000,
    category: 'fasilitas',
    iconId: '#i-bag',
    coords: [-6.3238, 107.2995],
    zoom: 15,
  },
  {
    id: 'kampus',
    title: 'Universitas Negeri (Unsika) & Swasta (UBP)',
    subtitle: 'Pendidikan tinggi',
    distance: '1 km',
    distanceMeters: 1000,
    category: 'fasilitas',
    iconId: '#i-cap',
    coords: [-6.3236, 107.3065],
    zoom: 15,
  },
  {
    id: 'kiic',
    title: 'Kawasan Industri Mitra, Peruri, Bank BI & KIIC',
    subtitle: 'Sentra industri Karawang',
    distance: '3 km',
    distanceMeters: 3000,
    category: 'industri',
    iconId: '#i-factory',
    coords: [-6.3435, 107.2835],
    zoom: 13,
  },
  {
    id: 'tol',
    title: 'Pusat Kota, Pintu Tol & Stasiun MRT',
    subtitle: 'Akses transportasi utama',
    distance: '3 km',
    distanceMeters: 3000,
    category: 'industri',
    iconId: '#i-city',
    coords: [-6.3325, 107.281],
    zoom: 13,
  },
  {
    id: 'suryacipta',
    title: 'Kawasan Industri Surya Cipta & Artha',
    subtitle: 'Sentra industri Karawang',
    distance: '5 km',
    distanceMeters: 5000,
    category: 'industri',
    iconId: '#i-factory',
    coords: [-6.369, 107.338],
    zoom: 12,
  },
];

type MapLayerMode = 'street' | 'satellite';
type ZoomPreset = 'site' | 'radius1km' | 'regional' | 'fitAll';

interface PropertyMapProps {
  landmarks?: readonly MapLandmark[];
  siteCoords?: [number, number];
  siteRadiusMeters?: number;
  selectedLandmarkId: string | null;
  onSelectLandmark: (id: string | null) => void;
}

function createPopupElement(tag: string, title: string, subtitle: string, meta?: string): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'mp-popup';

  const tagEl = document.createElement('span');
  tagEl.className = 'mp-popup-tag';
  tagEl.textContent = tag;
  wrap.appendChild(tagEl);

  const titleEl = document.createElement('strong');
  titleEl.textContent = title;
  wrap.appendChild(titleEl);

  const subEl = document.createElement('p');
  subEl.textContent = subtitle;
  wrap.appendChild(subEl);

  if (meta) {
    const metaEl = document.createElement('div');
    metaEl.className = 'mp-popup-meta';
    metaEl.textContent = meta;
    wrap.appendChild(metaEl);
  }

  return wrap;
}

function createLandmarkPinHtml(distance: string, isActive: boolean): HTMLDivElement {
  const pin = document.createElement('div');
  pin.className = `mp-lm-pin${isActive ? ' active' : ''}`;
  const label = document.createElement('span');
  label.textContent = distance;
  pin.appendChild(label);
  return pin;
}

export default function PropertyMap({
  landmarks = MAP_LANDMARKS,
  siteCoords = SITE_COORDS,
  siteRadiusMeters = 113,
  selectedLandmarkId,
  onSelectLandmark,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsRef = useRef<L.TileLayer | null>(null);
  const radiusGroupRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const siteMarkerRef = useRef<L.Marker | null>(null);
  const landmarkMarkersRef = useRef<Record<string, L.Marker>>({});
  const onSelectRef = useRef(onSelectLandmark);

  const [layerMode, setLayerMode] = useState<MapLayerMode>('street');
  const [showSurrounding, setShowSurrounding] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(16);

  useEffect(() => {
    onSelectRef.current = onSelectLandmark;
  }, [onSelectLandmark]);

  // Initialize Leaflet map, base layers, site marker, and layer groups
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: siteCoords,
      zoom: 16,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: '&copy; Esri World Imagery',
      }
    );

    const satelliteLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.78,
      }
    );

    streetLayer.addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    L.circle(siteCoords, {
      radius: siteRadiusMeters,
      color: '#FFD409',
      weight: 3,
      fillColor: '#F7BE21',
      fillOpacity: 0.24,
    })
      .bindTooltip('Estimasi Skala Lahan ±4 Ha (40.000 m²)', {
        direction: 'top',
        sticky: true,
      })
      .addTo(map);

    const siteIcon = L.divIcon({
      className: 'mp-site-icon-wrap',
      html: `
        <div class="mp-site-pin">
          <span class="mp-site-badge">LAHAN 4 HA · SHM</span>
          <span class="mp-site-dot"></span>
        </div>
      `,
      iconSize: [164, 50],
      iconAnchor: [82, 42],
      popupAnchor: [0, -38],
    });

    const siteMarker = L.marker(siteCoords, { icon: siteIcon, zIndexOffset: 500 }).addTo(map);
    siteMarker.bindPopup(
      createPopupElement(
        'Lahan Utama · SHM',
        'Tanah Dijual 4 Hektare (40.000 m²)',
        'Jl. Raya Telukjambe, Telukjambe Timur, Kab. Karawang',
        'Zona Kuning · Tanah Darat · Ring 1'
      ),
      { maxWidth: 280 }
    );
    siteMarker.on('click', () => {
      onSelectRef.current(null);
    });
    siteMarker.openPopup();

    const radiusGroup = L.layerGroup().addTo(map);
    [
      { radius: 500, label: 'Radius 500 m' },
      { radius: 1000, label: 'Radius 1 km' },
      { radius: 3000, label: 'Radius 3 km' },
    ].forEach((ring) => {
      L.circle(siteCoords, {
        radius: ring.radius,
        color: '#0A3570',
        weight: 1.5,
        dashArray: '6 6',
        fill: false,
        opacity: 0.55,
      })
        .bindTooltip(ring.label, { sticky: true })
        .addTo(radiusGroup);
    });

    const landmarksLayer = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapRef.current = map;
    streetLayerRef.current = streetLayer;
    satelliteLayerRef.current = satelliteLayer;
    satelliteLabelsRef.current = satelliteLabels;
    radiusGroupRef.current = radiusGroup;
    landmarksLayerRef.current = landmarksLayer;
    siteMarkerRef.current = siteMarker;

    return () => {
      map.remove();
      mapRef.current = null;
      streetLayerRef.current = null;
      satelliteLayerRef.current = null;
      satelliteLabelsRef.current = null;
      radiusGroupRef.current = null;
      landmarksLayerRef.current = null;
      siteMarkerRef.current = null;
      landmarkMarkersRef.current = {};
    };
  }, [siteCoords, siteRadiusMeters]);

  // Dynamically render & update landmark pins whenever `landmarks` data or active selection changes
  useEffect(() => {
    const layer = landmarksLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    const markersRecord: Record<string, L.Marker> = {};

    landmarks.forEach((lm) => {
      const isActive = selectedLandmarkId === lm.id;
      const lmIcon = L.divIcon({
        className: 'mp-lm-icon-wrap',
        html: createLandmarkPinHtml(lm.distance, isActive),
        iconSize: [64, 28],
        iconAnchor: [32, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(lm.coords, {
        icon: lmIcon,
        zIndexOffset: isActive ? 450 : 100,
      }).addTo(layer);

      marker.bindPopup(
        createPopupElement(
          `Jarak ±${lm.distance}`,
          lm.title,
          lm.subtitle,
          lm.category === 'fasilitas' ? 'Fasilitas Sekitar' : 'Industri & Transportasi'
        ),
        { maxWidth: 260 }
      );
      marker.on('click', () => {
        onSelectRef.current(lm.id);
      });

      markersRecord[lm.id] = marker;
    });

    landmarkMarkersRef.current = markersRecord;
  }, [landmarks, selectedLandmarkId]);

  // Switch between Street and Satellite tile layers
  useEffect(() => {
    const map = mapRef.current;
    const street = streetLayerRef.current;
    const sat = satelliteLayerRef.current;
    const satLabels = satelliteLabelsRef.current;
    if (!map || !street || !sat || !satLabels) return;

    if (layerMode === 'satellite') {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(sat)) sat.addTo(map);
      if (!map.hasLayer(satLabels)) satLabels.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (map.hasLayer(satLabels)) map.removeLayer(satLabels);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [layerMode]);

  // Toggle surrounding radius rings and landmark pins layer
  useEffect(() => {
    const map = mapRef.current;
    const radiusGroup = radiusGroupRef.current;
    const landmarksLayer = landmarksLayerRef.current;
    if (!map || !radiusGroup || !landmarksLayer) return;

    if (showSurrounding) {
      if (!map.hasLayer(radiusGroup)) radiusGroup.addTo(map);
      if (!map.hasLayer(landmarksLayer)) landmarksLayer.addTo(map);
    } else {
      if (map.hasLayer(radiusGroup)) map.removeLayer(radiusGroup);
      if (map.hasLayer(landmarksLayer)) map.removeLayer(landmarksLayer);
    }
  }, [showSurrounding]);

  // Fly and open popup when user picks a landmark from card or pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLandmarkId) return;

    const target = landmarks.find((lm) => lm.id === selectedLandmarkId);
    const marker = landmarkMarkersRef.current[selectedLandmarkId];
    if (!target || !marker) return;

    if (!showSurrounding) {
      setShowSurrounding(true);
    }

    map.flyTo(target.coords, target.zoom, { duration: 0.65 });
    const timer = window.setTimeout(() => {
      marker.openPopup();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [landmarks, selectedLandmarkId, showSurrounding]);

  const handleZoomPreset = (preset: ZoomPreset) => {
    const map = mapRef.current;
    if (!map) return;
    onSelectLandmark(null);
    if (preset === 'site') {
      map.flyTo(siteCoords, 16, { duration: 0.6 });
      window.setTimeout(() => {
        siteMarkerRef.current?.openPopup();
      }, 240);
    } else if (preset === 'radius1km') {
      setShowSurrounding(true);
      map.flyTo(siteCoords, 15, { duration: 0.6 });
    } else if (preset === 'fitAll') {
      setShowSurrounding(true);
      const points: [number, number][] = [siteCoords, ...landmarks.map((lm) => lm.coords)];
      const bounds = L.latLngBounds(points);
      map.flyToBounds(bounds, { padding: [46, 46], maxZoom: 16, duration: 0.65 });
    } else {
      setShowSurrounding(true);
      map.flyTo([-6.338, 107.308], 13, { duration: 0.6 });
    }
  };

  return (
    <div className="map-interactive">
      <div className="map-toolbar" role="toolbar" aria-label="Kontrol peta interaktif">
        <div className="map-seg" role="group" aria-label="Tampilan peta">
          <button
            type="button"
            className={`map-ctrl-btn${layerMode === 'street' ? ' active' : ''}`}
            onClick={() => setLayerMode('street')}
          >
            Peta Jalan
          </button>
          <button
            type="button"
            className={`map-ctrl-btn${layerMode === 'satellite' ? ' active' : ''}`}
            onClick={() => setLayerMode('satellite')}
          >
            Satelit
          </button>
        </div>

        <div className="map-presets" role="group" aria-label="Jangkauan area">
          <button
            type="button"
            className={`map-ctrl-btn${currentZoom >= 16 && !selectedLandmarkId ? ' active' : ''}`}
            onClick={() => handleZoomPreset('site')}
          >
            Pusatkan Lahan (4 Ha)
          </button>
          <button
            type="button"
            className={`map-ctrl-btn${currentZoom === 15 && !selectedLandmarkId ? ' active' : ''}`}
            onClick={() => handleZoomPreset('radius1km')}
          >
            Area Sekitar (1 km)
          </button>
          <button
            type="button"
            className={`map-ctrl-btn${currentZoom <= 14 && !selectedLandmarkId ? ' active' : ''}`}
            onClick={() => handleZoomPreset('regional')}
          >
            Kawasan Industri &amp; Tol
          </button>
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={() => handleZoomPreset('fitAll')}
          >
            Semua Pin ({landmarks.length})
          </button>
        </div>

        <button
          type="button"
          className={`map-ctrl-btn map-toggle${showSurrounding ? ' active' : ''}`}
          aria-pressed={showSurrounding}
          onClick={() => setShowSurrounding((prev) => !prev)}
        >
          {showSurrounding ? 'Sembunyikan Radius & Titik' : 'Tampilkan Radius & Titik'}
        </button>
      </div>

      <div className="map-frame">
        <div
          ref={containerRef}
          className="leaflet-map-box"
          role="region"
          aria-label="Peta interaktif Leaflet lokasi tanah 4 hektare di Jl. Raya Telukjambe, Karawang"
        />

        <div className="map-zoom-pad" aria-label="Kontrol perbesaran peta">
          <button
            type="button"
            className="map-zoom-btn"
            aria-label="Perbesar peta"
            title="Perbesar peta"
            onClick={() => mapRef.current?.zoomIn()}
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-btn"
            aria-label="Perkecil peta"
            title="Perkecil peta"
            onClick={() => mapRef.current?.zoomOut()}
          >
            &minus;
          </button>
          <button
            type="button"
            className="map-zoom-btn reset"
            aria-label="Pusatkan ulang ke lokasi lahan"
            title="Pusatkan ulang ke lokasi lahan"
            onClick={() => handleZoomPreset('site')}
          >
            <svg className="ic" aria-hidden="true">
              <use href="#i-pin" />
            </svg>
          </button>
        </div>

        <div className="map-legend">
          <span className="map-legend-item">
            <i className="leg-dot site" aria-hidden="true" />
            Lahan 4 Ha &amp; Estimasi Skala Area
          </span>
          <span className="map-legend-item">
            <i className="leg-dot lm" aria-hidden="true" />
            {showSurrounding
              ? `${landmarks.length} Pin Landmark Aktif`
              : 'Pin Landmark Disembunyikan'}
          </span>
          <span className="map-legend-hint">Geser atau scroll untuk zoom &amp; pan</span>
        </div>
      </div>
    </div>
  );
}
