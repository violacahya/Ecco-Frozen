"use client";

export function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 520;
  const height = 230;
  const padding = { top: 16, right: 12, bottom: 34, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 4);
  const ticks = 4;
  const slot = innerW / Math.max(data.length, 1);
  const barWidth = Math.min(38, slot * 0.5);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Grafik pelanggan baru per bulan">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f9bff" />
            <stop offset="100%" stopColor="#0b6bd1" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, index) => {
          const value = (max / ticks) * index;
          const y = padding.top + innerH - (value / max) * innerH;
          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e8eef7"
                strokeDasharray={index === 0 ? "0" : "4 5"}
              />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="chart-tick">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const barH = (item.value / max) * innerH;
          const x = padding.left + slot * index + (slot - barWidth) / 2;
          const y = padding.top + innerH - barH;
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={barWidth / 2.4}
                fill="url(#barGradient)"
                className="chart-bar"
              >
                <title>{`${item.label}: ${item.value} pelanggan`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={padding.top + innerH + 22}
                textAnchor="middle"
                className="chart-label"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <svg viewBox="0 0 140 140" role="img" aria-label="Distribusi status pelanggan">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef3fa" strokeWidth={stroke} />
          {total > 0 &&
            data.map((item) => {
              const length = (item.value / total) * circumference;
              const circle = (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${Math.max(length - 3, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="donut-center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {data.map((item) => (
          <li key={item.label}>
            <span className="legend-dot" style={{ background: item.color }} />
            <span className="legend-label">{item.label}</span>
            <span className="legend-value">
              {item.value}
              <small>{total ? ` · ${Math.round((item.value / total) * 100)}%` : ""}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
