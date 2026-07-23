// Tiny inline SVG sparkline chart — single path, no dependencies.

function pointsToPath(points: number[], width: number, height: number): string {
  if (!points.length) return "";
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const xStep = width / (points.length - 1 || 1);

  return points
    .map((p, i) => {
      const x = i * xStep;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function MiniSparkline({
  data,
  width = 80,
  height = 28,
  color = "#FF6B00",
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const path = pointsToPath(data, width, height);

  if (!data.length) {
    return (
      <svg width={width} height={height} className="shrink-0" aria-hidden>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={strokeWidth} strokeDasharray="2 2" opacity={0.3} />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#spark-fill-${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
