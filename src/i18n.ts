export interface YkPlayerStrings {
  auto: string
  off: string
  subtitle: string
  subtitles: string
  speed: string
  bitrate: string
  loadError: string
  muted: string
}

export const DEFAULT_STRINGS: YkPlayerStrings = {
  auto: 'Auto',
  off: 'Off',
  subtitle: 'Subtitle',
  subtitles: 'Subtitles',
  speed: 'Speed',
  bitrate: 'Quality',
  loadError: 'Failed to load video',
  muted: 'Muted',
}

export const LOCALES: Record<string, YkPlayerStrings> = {
  en: DEFAULT_STRINGS,
  ja: {
    auto: '自動',
    off: 'オフ',
    subtitle: '字幕',
    subtitles: '字幕',
    speed: '速度',
    bitrate: '画質',
    loadError: '動画の読み込みに失敗しました',
    muted: 'ミュート',
  },
  zh: {
    auto: '自动',
    off: '关闭',
    subtitle: '字幕',
    subtitles: '字幕',
    speed: '速度',
    bitrate: '画质',
    loadError: '视频加载失败',
    muted: '静音',
  },
}

export function translate(lang: string, key: keyof YkPlayerStrings): string {
  const locale = LOCALES[lang] ?? LOCALES[lang.split('-')[0]]
  return locale?.[key] ?? DEFAULT_STRINGS[key]
}
