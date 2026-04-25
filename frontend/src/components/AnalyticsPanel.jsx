import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { C } from '../constants/theme';
import { API } from '../services/api';
import { ISO2_NUM, NUM_ISO2 } from '../utils/countryMap';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

function WorldMap({ clicksByCountry }) {
  const maxClicks = Math.max(...Object.values(clicksByCountry || {}), 1);
  return (
    <div style={{ background: C.card, borderRadius: 10, overflow: 'hidden', marginTop: 10, border: `1px solid ${C.border}` }}>
      <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const iso2 = NUM_ISO2[Number(geo.id)];
              const count = (clicksByCountry || {})[iso2] || 0;
              const intensity = count > 0 ? Math.min(1, 0.2 + (count / maxClicks) * 0.8) : 0;
              const fill = count > 0 ? `rgba(108,99,255,${intensity.toFixed(2)})` : C.border;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  title={`${iso2 || 'Unknown'}: ${count} clicks`}
                  fill={fill}
                  stroke={C.bg}
                  strokeWidth={0.5}
                  style={{ default: { outline: 'none' }, hover: { fill: C.accent2, outline: 'none', cursor: 'pointer' }, pressed: { outline: 'none' } }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

function HourlyBarChart({ data }) {
  const max = Math.max(...data, 1);
  const [tip, setTip] = useState(null);
  return (
    <div style={{ position: 'relative' }}>
      {tip !== null && (
        <div style={{ position: 'absolute', top: -28, left: `${(tip / 24) * 100}%`, transform: 'translateX(-50%)', background: C.card, border: `1px solid ${C.border2}`, borderRadius: 5, padding: '2px 8px', fontFamily: C.mono, fontSize: 11, color: C.text, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
          {tip}:00 · {data[tip]}
        </div>
      )}
      <div style={{ display: 'flex', gap: 3, height: 52, alignItems: 'flex-end', paddingTop: 4 }}>
        {data.map((v, i) => (
          <div key={i} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)}
            style={{
              flex: 1, background: tip === i ? 'rgba(108,99,255,0.7)' : (v ? C.accent : 'rgba(255,255,255,0.06)'), borderRadius: 2,
              height: `${Math.max(3, (v / max) * 100)}%`,
              opacity: v > 0 ? 1 : 0.25, transition: 'height .3s, opacity .3s, background .1s', borderRadius: 2,
              cursor: 'default',
            }} />
        ))}
      </div>
    </div>
  );
}

function Pct({ obj, total }) {
  if (!obj || !total) return <span style={{ color: C.muted, fontFamily: C.mono, fontSize: 12 }}>—</span>;
  const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
      {sorted.map(([k, v]) => (
        <span key={k} style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>
          <span style={{ color: C.text }}>{k}</span> {((v / total) * 100).toFixed(0)}%
        </span>
      ))}
    </div>
  );
}

function BreakdownRow({ label, obj, total }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <Pct obj={obj} total={total} />
    </div>
  );
}

export function AnalyticsPanel({ code, token, statsEndpoint }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    const endpoint = statsEndpoint ? `${API}${statsEndpoint}` : `${API}/api/stats/${code}`;
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code, token]);

  if (loading) return <div style={{ padding: '12px 0', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading analytics…</div>;
  if (!data?.analytics) return null;

  const { analytics, clicks, total_scans } = data;
  const totalClicks = total_scans ?? clicks ?? 0;

  const rangeClicks = range === '24h' ? analytics.clicks_last_24h
    : range === '7d' ? analytics.clicks_last_7d
    : range === '30d' ? analytics.clicks_last_30d
    : totalClicks;

  const RANGES = [['24h', analytics.clicks_last_24h], ['7d', analytics.clicks_last_7d], ['30d', analytics.clicks_last_30d], ['all', totalClicks]];

  const hasUTM = Object.keys(analytics.clicks_by_utm_source || {}).length > 0 ||
    Object.keys(analytics.clicks_by_utm_medium || {}).length > 0 ||
    Object.keys(analytics.clicks_by_utm_campaign || {}).length > 0;

  return (
    <div style={{ padding: '14px 0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {RANGES.map(([r, v]) => (
          <button key={r} onClick={() => setRange(r)} style={{
            background: range === r ? C.accent : 'none',
            color: range === r ? '#000' : C.muted,
            border: `1px solid ${range === r ? C.accent : C.border2}`,
            borderRadius: 5, padding: '3px 10px', fontFamily: C.mono, fontSize: 11, cursor: 'pointer', transition: 'all .15s',
          }}>{r} <span style={{ opacity: 0.7 }}>({v ?? 0})</span></button>
        ))}
        {analytics.bot_clicks > 0 && (
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, background: `${C.border2}`, border: `1px solid ${C.border2}`, borderRadius: 5, padding: '3px 8px' }}>
            🤖 {analytics.bot_clicks} bot
          </span>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Clicks today by hour (UTC)</div>
        <HourlyBarChart data={analytics.clicks_today_by_hour || new Array(24).fill(0)} />
      </div>

      <BreakdownRow label="Country" obj={analytics.clicks_by_country} total={rangeClicks} />

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowMap(m => !m)} style={{
          background: 'none', border: `1px solid ${C.border2}`, borderRadius: 5, color: C.muted,
          fontFamily: C.mono, fontSize: 11, cursor: 'pointer', padding: '3px 10px', transition: 'color .15s, border-color .15s',
        }}>{showMap ? '▲ hide map' : '▼ show world map'}</button>
        {showMap && <WorldMap clicksByCountry={analytics.clicks_by_country} />}
      </div>

      <BreakdownRow label="Device" obj={analytics.clicks_by_device} total={rangeClicks} />
      <BreakdownRow label="Browser" obj={analytics.clicks_by_browser} total={rangeClicks} />
      <BreakdownRow label="OS" obj={analytics.clicks_by_os} total={rangeClicks} />
      <BreakdownRow label="Referrer" obj={analytics.clicks_by_referrer} total={rangeClicks} />

      {hasUTM && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>UTM Tracking</div>
          <BreakdownRow label="Source" obj={analytics.clicks_by_utm_source} total={rangeClicks} />
          <BreakdownRow label="Medium" obj={analytics.clicks_by_utm_medium} total={rangeClicks} />
          <BreakdownRow label="Campaign" obj={analytics.clicks_by_utm_campaign} total={rangeClicks} />
        </div>
      )}
    </div>
  );
}
