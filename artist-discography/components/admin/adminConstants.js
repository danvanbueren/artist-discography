export const EMPTY_SET = new Set()

export const DIRTY_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: '#ff9800 !important',
      borderWidth: 2,
    },
  },
}

export const SAVED_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: '#4caf50 !important',
      borderWidth: 2,
    },
  },
}

export const DEFAULT_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
  },
}

export const PROJECT_TYPES = [
  'LP',
  'EP',
  'Single',
  'Feature',
  'Remix',
  'Bootleg',
  'Flip',
  'Edit',
  'Compilation',
  'Minimix',
  'DJ Set',
  'Mixtape',
  'Live',
  'Other',
]

export const PLATFORM_KEYS = [
  { key: 'spotify', label: 'Spotify URL' },
  { key: 'apple', label: 'Apple Music URL' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'soundcloud', label: 'SoundCloud URL' },
  { key: 'amazon', label: 'Amazon Music URL' },
  { key: 'bandcamp', label: 'Bandcamp URL' },
  { key: 'deezer', label: 'Deezer URL' },
  { key: 'itunes', label: 'iTunes URL' },
  { key: 'pandora', label: 'Pandora URL' },
  { key: 'tidal', label: 'Tidal URL' },
]

export const SOCIAL_KEYS = [
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'discord', label: 'Discord URL' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'tiktok', label: 'TikTok URL' },
  { key: 'x', label: 'X / Twitter URL' },
  { key: 'snapchat', label: 'Snapchat URL' },
]
