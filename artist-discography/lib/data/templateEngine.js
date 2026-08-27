import { slugify } from './slugs'
import { formatProjectDate } from './dateUtils'

export const DEFAULT_TEMPLATE = `🔗 {url}
💽 {title} - {site_artist} {type}{collaborators_parentheses}
📆 Released {formatted_date}`

export const AVAILABLE_TOKENS = [
  {
    token: '{url}',
    label: 'Full URL',
    description: 'Direct link to the project page',
    example: 'https://example.com/release-title',
  },
  {
    token: '{slug}',
    label: 'Slug',
    description: 'URL-friendly identifier',
    example: 'release-title',
  },
  {
    token: '{title}',
    label: 'Project Title',
    description: 'Title of the release',
    example: 'Release Title',
  },
  {
    token: '{site_artist}',
    label: 'Site Artist',
    description: 'Main artist profile name',
    example: 'Artist Name',
  },
  {
    token: '{collaborators}',
    label: 'Collaborators',
    description: 'Artists excluding the site artist',
    example: 'Collaborator 1, Collaborator 2',
  },
  {
    token: '{collaborators_parentheses}',
    label: 'Collaborators (In Parentheses)',
    description: 'Parenthesized collaborators or empty if none',
    example: ' (Collaborator 1, Collaborator 2)',
  },
  {
    token: '{artist}',
    label: 'Full Artist String',
    description: 'All project artists as entered',
    example: 'Artist Name, Collaborator',
  },
  {
    token: '{type}',
    label: 'Release Type',
    description: 'Single, EP, LP, Bootleg, Remix, etc.',
    example: 'Single',
  },
  {
    token: '{formatted_date}',
    label: 'Formatted Date',
    description: 'Human-readable release date',
    example: 'Jan 1, 2026',
  },
  {
    token: '{year}',
    label: 'Release Year',
    description: '4-digit year of release',
    example: '2026',
  },
  {
    token: '{tracks_count}',
    label: 'Track Count',
    description: 'Total number of tracks',
    example: '1',
  },
  {
    token: '{first_track}',
    label: 'First Track Title',
    description: 'Name of the opening track',
    example: 'Track 1',
  },
]

export const BUILTIN_PRESETS = [
  {
    id: 'default',
    name: 'Instagram 3-Line (Default)',
    template: DEFAULT_TEMPLATE,
  },
  {
    id: 'social-post',
    name: 'Social Media Announcement',
    template: `🎵 {title} by {site_artist}{collaborators_parentheses} [{type}]
📅 Released on {formatted_date}
Stream now: {url}`,
  },
  {
    id: 'compact',
    name: 'Compact Single Line',
    template: `[{type}] {title} - {site_artist}{collaborators_parentheses} ({formatted_date}): {url}`,
  },
  {
    id: 'markdown',
    name: 'Markdown Link List',
    template: `- **[{title}]({url})** - {site_artist} {type}{collaborators_parentheses} ({formatted_date})`,
  },
  {
    id: 'hashtags',
    name: 'Hashtag Heavy',
    template: `💽 {title} ({type})
🔗 {url}
📆 {formatted_date}

#{site_artist} #{type} #NewMusic #Music`,
  },
]

/**
 * Computes token replacement values for a project.
 *
 * @param {Object} project
 * @param {string} siteArtist
 * @param {string} siteUrl
 * @returns {Object} Key-value map of tokens to string values
 */
export function getProjectTokenValues(project, siteArtist = 'Artist', siteUrl = '') {
  const cleanSiteUrl = (siteUrl || '').replace(/\/+$/, '')
  const slug = slugify(project?.name) || 'project'
  const url = cleanSiteUrl ? `${cleanSiteUrl}/${slug}` : `/${slug}`
  const title = project?.name || 'Untitled Project'
  const type = project?.type || 'Single'

  const projectArtist = typeof project?.artist === 'string' ? project.artist : ''
  const artistParts = projectArtist
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)

  const remainingArtists = artistParts.filter(
    (a) => a.toLowerCase() !== siteArtist.trim().toLowerCase(),
  )
  const collaborators = remainingArtists.join(', ')
  const collaboratorsParentheses = collaborators ? ` (${collaborators})` : ''

  const formattedDate = formatProjectDate(project?.date)
  const rawDate = project?.date || ''

  let year = ''
  if (rawDate) {
    const yMatch = rawDate.match(/^(\d{4})/)
    if (yMatch) year = yMatch[1]
  }

  const tracks = Array.isArray(project?.tracks) ? project.tracks : []
  const tracksCount = String(tracks.length || 1)
  const firstTrack = tracks[0]?.name || title

  return {
    '{url}': url,
    '{link}': url,
    '{slug}': slug,
    '{title}': title,
    '{name}': title,
    '{site_artist}': siteArtist,
    '{artist}': projectArtist || siteArtist,
    '{collaborators}': collaborators,
    '{other_artists}': collaborators,
    '{collaborators_parentheses}': collaboratorsParentheses,
    '{other_artists_parentheses}': collaboratorsParentheses,
    '{type}': type,
    '{date}': rawDate,
    '{formatted_date}': formattedDate,
    '{year}': year,
    '{tracks_count}': tracksCount,
    '{first_track}': firstTrack,
  }
}

/**
 * Interpolates a template string with project tokens.
 *
 * @param {string} templateStr
 * @param {Object} project
 * @param {string} siteArtist
 * @param {string} siteUrl
 * @returns {string}
 */
export function renderTemplate(templateStr, project, siteArtist = 'Artist', siteUrl = '') {
  if (!templateStr || typeof templateStr !== 'string') {
    return ''
  }

  const tokenValues = getProjectTokenValues(project, siteArtist, siteUrl)
  let result = templateStr

  for (const [token, value] of Object.entries(tokenValues)) {
    const escaped = token.replace(/[{}]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    result = result.replace(regex, value)
  }

  return result
}

/**
 * Sorts and renders all projects with a template string.
 *
 * @param {string} templateStr
 * @param {Array<Object>} projects
 * @param {string} siteArtist
 * @param {string} siteUrl
 * @param {Object} options
 * @param {boolean} [options.chronological=true]
 * @returns {{ sortedProjects: Array<Object>, posts: Array<{ project: Object, text: string }>, fullText: string }}
 */
export function renderAllProjectsWithTemplate(
  templateStr,
  projects = [],
  siteArtist = 'Artist',
  siteUrl = '',
  options = { chronological: true },
) {
  const isChronological = options.chronological !== false

  const sortedProjects = [...projects].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0
    const timeB = b.date ? new Date(b.date).getTime() : 0
    const validA = !isNaN(timeA) ? timeA : 0
    const validB = !isNaN(timeB) ? timeB : 0

    if (validA !== validB) {
      return isChronological ? validA - validB : validB - validA
    }
    return (a.name || '').localeCompare(b.name || '')
  })

  const effectiveTemplate = templateStr?.trim() ? templateStr : DEFAULT_TEMPLATE

  const posts = sortedProjects.map((project) => ({
    project,
    text: renderTemplate(effectiveTemplate, project, siteArtist, siteUrl),
  }))

  const fullText = posts.map((p) => p.text).join('\n\n')

  return {
    sortedProjects,
    posts,
    fullText,
  }
}
