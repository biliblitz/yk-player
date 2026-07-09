export function formatDuration(seconds: number) {
  if (!isFinite(seconds)) return '--:--'

  const totalSeconds = Math.floor(Math.max(0, seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60
  const pad = (num: number) => num.toString().padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`
}

export function percent(value: number, total: number) {
  if (!isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}

export function qualityLabel(level: { height?: number; bitrate?: number } | undefined, autoLabel = 'Auto') {
  if (!level) return autoLabel
  const resolution = level.height ? `${level.height}p` : ''
  const bitrate = level.bitrate
    ? level.bitrate >= 1_000_000
      ? `${(level.bitrate / 1_000_000).toFixed(1)} Mbps`
      : `${Math.round(level.bitrate / 1000)} kbps`
    : ''
  return [resolution, bitrate].filter(Boolean).join(' · ') || autoLabel
}
