'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Stack,
} from '@mui/material'

import LockIcon from '@mui/icons-material/Lock'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AlbumIcon from '@mui/icons-material/Album'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import LinkIcon from '@mui/icons-material/Link'
import ImageIcon from '@mui/icons-material/Image'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import ShareIcon from '@mui/icons-material/Share'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SyncIcon from '@mui/icons-material/Sync'
import PendingIcon from '@mui/icons-material/Pending'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { slugify } from '../lib/slugs'

const isProjectSlugDuplicate = (name, projectsList, excludeIndex = -1) => {
  const targetSlug = slugify(name)
  if (!targetSlug) return false
  return projectsList.some((p, idx) => {
    if (excludeIndex >= 0 && idx === excludeIndex) return false
    return slugify(p.name) === targetSlug
  })
}

const getDuplicateTrackSlugIndexes = (tracksList) => {
  const dupIndexes = new Set()
  const map = new Map()
  tracksList.forEach((t, idx) => {
    const s = slugify(t.name)
    if (!s) return
    if (!map.has(s)) map.set(s, [])
    map.get(s).push(idx)
  })
  map.forEach((indexes) => {
    if (indexes.length > 1) {
      indexes.forEach((i) => dupIndexes.add(i))
    }
  })
  return dupIndexes
}

const PROJECT_TYPES = [
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

const PLATFORM_KEYS = [
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

const SOCIAL_KEYS = [
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'discord', label: 'Discord URL' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'tiktok', label: 'TikTok URL' },
  { key: 'x', label: 'X / Twitter URL' },
  { key: 'snapchat', label: 'Snapchat URL' },
]

const createEmptyTrack = () => ({
  id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: '',
  artist: '',
  audioFile: null,
  audioFileName: '',
  links: {
    spotify: '',
    apple: '',
    youtube: '',
    soundcloud: '',
    amazon: '',
    bandcamp: '',
    deezer: '',
    itunes: '',
    pandora: '',
    tidal: '',
  },
})

const resolveOverrideArtist = (artistVal, primaryName, projectArtistVal) => {
  if (!artistVal || typeof artistVal !== 'string') return ''
  const trimmed = artistVal.trim()
  if (!trimmed) return ''
  const primary = (primaryName || '').trim()
  if (primary && trimmed === primary) return ''
  const projArtist = (projectArtistVal || '').trim()
  if (projArtist && trimmed === projArtist) return ''
  if (trimmed === 'Artist') return ''
  return trimmed
}

export default function AdminDashboardClient({ adminAccess = true, defaultArtistName = 'Artist', initialData = {} }) {
  const router = useRouter()
  // Tabs: 0 = Artist Profile, 1 = Manage Projects
  const [activeTab, setActiveTab] = useState(() => {
    const existingName = initialData?.artist?.name
    return Boolean(existingName && existingName.trim()) ? 1 : 0
  })

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // System Data
  const [artistData, setArtistData] = useState(() => initialData?.artist ?? {})
  const [projectsList, setProjectsList] = useState(() => initialData?.projects ?? [])

  // ----------------------------------------------------
  // MANAGE PROJECTS STATE
  // ----------------------------------------------------
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [selectedProjIndex, setSelectedProjIndex] = useState(0)

  // New Project Form
  const [name, setName] = useState('')
  const [type, setType] = useState('Single')
  const [artist, setArtist] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [tracks, setTracks] = useState([createEmptyTrack()])

  // Edit Project Form
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('Single')
  const [editArtist, setEditArtist] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCoverFile, setEditCoverFile] = useState(null)
  const [editCoverPreview, setEditCoverPreview] = useState(null)
  const [editTracks, setEditTracks] = useState([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState(null)
  const [trackToCopy, setTrackToCopy] = useState(null)
  const [copyTargetProjectIndex, setCopyTargetProjectIndex] = useState(0)
  const [isCopyingTrack, setIsCopyingTrack] = useState(false)

  const nameRef = useRef(name)
  const typeRef = useRef(type)
  const artistRef = useRef(artist)
  const dateRef = useRef(date)
  const coverFileRef = useRef(coverFile)
  const tracksRef = useRef(tracks)

  const editNameRef = useRef(editName)
  const editTypeRef = useRef(editType)
  const editArtistRef = useRef(editArtist)
  const editDateRef = useRef(editDate)
  const editCoverFileRef = useRef(editCoverFile)
  const editTracksRef = useRef(editTracks)

  useEffect(() => { nameRef.current = name }, [name])
  useEffect(() => { typeRef.current = type }, [type])
  useEffect(() => { artistRef.current = artist }, [artist])
  useEffect(() => { dateRef.current = date }, [date])
  useEffect(() => { coverFileRef.current = coverFile }, [coverFile])
  useEffect(() => { tracksRef.current = tracks }, [tracks])

  useEffect(() => { editNameRef.current = editName }, [editName])
  useEffect(() => { editTypeRef.current = editType }, [editType])
  useEffect(() => { editArtistRef.current = editArtist }, [editArtist])
  useEffect(() => { editDateRef.current = editDate }, [editDate])
  useEffect(() => { editCoverFileRef.current = editCoverFile }, [editCoverFile])
  useEffect(() => { editTracksRef.current = editTracks }, [editTracks])

  // ----------------------------------------------------
  // ARTIST PROFILE STATE
  // ----------------------------------------------------
  const [artistNameInput, setArtistNameInput] = useState(() => artistData?.name || defaultArtistName)
  const [artistBioInput, setArtistBioInput] = useState(() => artistData?.bio || '')
  const [artistPlatforms, setArtistPlatforms] = useState(() => artistData?.links?.platforms || {})
  const [artistSocials, setArtistSocials] = useState(() => artistData?.links?.socials || {})

  const artistNameInputRef = useRef(artistNameInput)
  const artistBioInputRef = useRef(artistBioInput)
  const artistPlatformsRef = useRef(artistPlatforms)
  const artistSocialsRef = useRef(artistSocials)

  useEffect(() => { artistNameInputRef.current = artistNameInput }, [artistNameInput])
  useEffect(() => { artistBioInputRef.current = artistBioInput }, [artistBioInput])
  useEffect(() => { artistPlatformsRef.current = artistPlatforms }, [artistPlatforms])
  useEffect(() => { artistSocialsRef.current = artistSocials }, [artistSocials])

  // ----------------------------------------------------
  // AUTO-SAVE TRACKING & HIGHLIGHTS
  // ----------------------------------------------------
  const [dirtyFields, setDirtyFields] = useState(new Set())
  const [savedFields, setSavedFields] = useState(new Set())
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState(null)

  const autoSaveDebounceRef = useRef(null)
  const savedHighlightTimeoutRef = useRef(null)

  // Global Status Messages
  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Check stored auth session
  useEffect(() => {
    try {
      const storedAuth = sessionStorage.getItem('admin_authenticated')
      const storedPass = sessionStorage.getItem('admin_password')
      if (storedAuth === 'true' && storedPass) {
        setIsAuthenticated(true)
        setPassword(storedPass)
      }
    } catch (err) { }
  }, [])

  // Sync initialData when passed
  useEffect(() => {
    if (initialData?.artist) {
      setArtistData(initialData.artist)
      setArtistNameInput(initialData.artist.name || defaultArtistName)
      setArtistBioInput(initialData.artist.bio || '')
      setArtistPlatforms(initialData.artist.links?.platforms || {})
      setArtistSocials(initialData.artist.links?.socials || {})
      if (initialData.artist.name && initialData.artist.name.trim()) {
        setActiveTab(1)
      }
    }
    if (initialData?.projects) {
      setProjectsList(initialData.projects)
      if (initialData.projects.length === 0) {
        setIsCreatingNew(false)
        setSelectedProjIndex(-1)
      }
    }
  }, [initialData, defaultArtistName])

  // Populate Edit Project form when selecting project index
  useEffect(() => {
    if (!isCreatingNew && projectsList.length > 0 && selectedProjIndex >= 0 && selectedProjIndex < projectsList.length) {
      const proj = projectsList[selectedProjIndex]
      const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
      setEditName(proj.name || '')
      setEditType(proj.type || 'Single')
      setEditArtist(resolveOverrideArtist(proj.artist, primaryName))
      setEditDate(proj.date || new Date().toISOString().split('T')[0])
      setEditCoverFile(null)
      setEditCoverPreview(proj.cover || null)

      const formattedTracks = (proj.tracks ?? []).map((t, idx) => ({
        id: `edit-track-${idx}-${Date.now()}`,
        name: t.name || '',
        artist: resolveOverrideArtist(t.artist, primaryName, proj.artist),
        audio: t.audio || t.audioUrl || '',
        hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
        audioFile: null,
        audioFileName: '',
        links: {
          spotify: '',
          apple: '',
          youtube: '',
          soundcloud: '',
          amazon: '',
          bandcamp: '',
          deezer: '',
          itunes: '',
          pandora: '',
          tidal: '',
          ...(t.links || {}),
        },
      }))
      setEditTracks(formattedTracks)
    }
  }, [selectedProjIndex, isCreatingNew, defaultArtistName])

  // Cover image preview cleanups
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(coverFile)
    setCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [coverFile])

  useEffect(() => {
    if (!editCoverFile) return
    const objectUrl = URL.createObjectURL(editCoverFile)
    setEditCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [editCoverFile])

  // Helper to mark a field dirty and trigger debounced auto-save
  const markFieldDirty = useCallback((fieldKey, saveCallback, delayMs = 1000) => {
    setDirtyFields((prev) => new Set(prev).add(fieldKey))
    setSavedFields((prev) => {
      const next = new Set(prev)
      next.delete(fieldKey)
      return next
    })

    if (autoSaveDebounceRef.current) {
      clearTimeout(autoSaveDebounceRef.current)
    }

    autoSaveDebounceRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      const keysToSave = Array.from(fieldKey ? [fieldKey] : [])
      const success = await saveCallback()

      setIsAutoSaving(false)
      if (success) {
        setLastSavedTime(new Date().toLocaleTimeString())
        setDirtyFields((prev) => {
          const next = new Set(prev)
          keysToSave.forEach((k) => next.delete(k))
          return next
        })
        setSavedFields((prev) => {
          const next = new Set(prev)
          keysToSave.forEach((k) => next.add(k))
          return next
        })

        if (savedHighlightTimeoutRef.current) {
          clearTimeout(savedHighlightTimeoutRef.current)
        }
        savedHighlightTimeoutRef.current = setTimeout(() => {
          setSavedFields(new Set())
        }, 1500)
      }
    }, delayMs)
  }, [])

  // ----------------------------------------------------
  // AUTO-SAVE: ARTIST PROFILE
  // ----------------------------------------------------
  const executeSaveArtist = async () => {
    try {
      const res = await fetch('/api/admin/artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name: artistNameInputRef.current.trim(),
          bio: artistBioInputRef.current.trim(),
          platforms: artistPlatformsRef.current,
          socials: artistSocialsRef.current,
        }),
      })
      const result = await res.json()
      return res.ok && result.success
    } catch (err) {
      setErrorMessage(`Auto-save error: ${err.message}`)
      return false
    }
  }

  // ----------------------------------------------------
  // AUTO-SAVE: CREATE NEW PROJECT
  // ----------------------------------------------------
  const executeCreateProject = async () => {
    const currentName = nameRef.current
    const currentType = typeRef.current
    const currentArtist = artistRef.current
    const currentDate = dateRef.current
    const currentCoverFile = coverFileRef.current
    const currentTracks = tracksRef.current

    if (!currentName.trim()) return false
    if (isProjectSlugDuplicate(currentName, projectsList, -1)) {
      setErrorMessage(`Cannot save: A project named "${currentName.trim()}" (slug: "${slugify(currentName)}") already exists.`)
      return false
    }
    const dupTracks = getDuplicateTrackSlugIndexes(currentTracks)
    if (dupTracks.size > 0) {
      setErrorMessage('Cannot save: Duplicate track titles detected within the project.')
      return false
    }
    try {
      const formData = new FormData()
      formData.append('password', password)
      formData.append('name', currentName.trim())
      formData.append('type', currentType)
      formData.append('artist', currentArtist.trim() || defaultArtistName)
      formData.append('date', currentDate)

      if (currentCoverFile) {
        formData.append('coverFile', currentCoverFile)
      }

      const cleanTracks = currentTracks.map((t, idx) => {
        if (t.audioFile) {
          formData.append(`track_${idx}_audioFile`, t.audioFile)
        }
        return {
          name: t.name.trim(),
          artist: t.artist.trim(),
          links: t.links,
        }
      })

      formData.append('tracks', JSON.stringify(cleanTracks))

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: formData,
      })

      const result = await res.json()
      if (res.ok && result.success) {
        if (result.createdProject) {
          const createdProj = result.createdProject
          setProjectsList((prev) => [createdProj, ...prev])
          
          const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
          const formattedTracks = (createdProj.tracks ?? []).map((t, idx) => ({
            id: `edit-track-${idx}-${Date.now()}`,
            name: t.name || '',
            artist: resolveOverrideArtist(t.artist, primaryName, createdProj.artist),
            audio: t.audio || t.audioUrl || '',
            hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
            audioFile: null,
            audioFileName: '',
            links: {
              spotify: '',
              apple: '',
              youtube: '',
              soundcloud: '',
              amazon: '',
              bandcamp: '',
              deezer: '',
              itunes: '',
              pandora: '',
              tidal: '',
              ...(t.links || {}),
            },
          }))
          setEditName(createdProj.name || '')
          setEditType(createdProj.type || 'Single')
          setEditArtist(resolveOverrideArtist(createdProj.artist, primaryName))
          setEditDate(createdProj.date || new Date().toISOString().split('T')[0])
          setEditCoverFile(null)
          setEditCoverPreview(createdProj.cover || null)
          setEditTracks(formattedTracks)
          editTracksRef.current = formattedTracks

          setSelectedProjIndex(0)
          setIsCreatingNew(false)
        }
        setName('')
        setCoverFile(null)
        setCoverPreview(null)
        setTracks([createEmptyTrack()])
        try {
          router.refresh()
        } catch (e) { }
        return true
      }
      setErrorMessage(result.error || 'Failed to save project.')
      return false
    } catch (err) {
      setErrorMessage(`Auto-save creation error: ${err.message}`)
      return false
    }
  }

  // ----------------------------------------------------
  // AUTO-SAVE: UPDATE EXISTING PROJECT
  // ----------------------------------------------------
  const executeUpdateProject = async (overrideTracks = null) => {
    const currentName = editNameRef.current
    const currentType = editTypeRef.current
    const currentArtist = editArtistRef.current
    const currentDate = editDateRef.current
    const currentCoverFile = editCoverFileRef.current
    const currentTracks = overrideTracks || editTracksRef.current

    if (!currentName.trim() || selectedProjIndex < 0 || selectedProjIndex >= projectsList.length) return false
    if (isProjectSlugDuplicate(currentName, projectsList, selectedProjIndex)) {
      setErrorMessage(`Cannot save: A project named "${currentName.trim()}" (slug: "${slugify(currentName)}") already exists.`)
      return false
    }
    const dupTracks = getDuplicateTrackSlugIndexes(currentTracks)
    if (dupTracks.size > 0) {
      setErrorMessage('Cannot save: Duplicate track titles detected within the project.')
      return false
    }
    try {
      const formData = new FormData()
      formData.append('password', password)
      formData.append('action', 'update')
      formData.append('projectIndex', selectedProjIndex)
      formData.append('name', currentName.trim())
      formData.append('type', currentType)
      formData.append('artist', currentArtist.trim())
      formData.append('date', currentDate)

      if (currentCoverFile) {
        formData.append('coverFile', currentCoverFile)
      }

      const cleanTracks = currentTracks.map((t, idx) => {
        if (t.audioFile) {
          formData.append(`track_${idx}_audioFile`, t.audioFile)
        }
        return {
          name: t.name.trim(),
          artist: t.artist.trim(),
          links: t.links,
        }
      })

      formData.append('tracks', JSON.stringify(cleanTracks))

      const res = await fetch('/api/admin/project', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: formData,
      })

      const result = await res.json()
      if (res.ok && result.success) {
        if (result.updatedProject) {
          setProjectsList((prev) => {
            const next = [...prev]
            next[selectedProjIndex] = result.updatedProject
            return next
          })
          if (result.updatedProject.cover) {
            setEditCoverPreview(result.updatedProject.cover)
          }

          const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
          const updatedFormattedTracks = (result.updatedProject.tracks ?? []).map((t, idx) => ({
            id: editTracksRef.current[idx]?.id || `edit-track-${idx}-${Date.now()}`,
            name: t.name || '',
            artist: resolveOverrideArtist(t.artist, primaryName, result.updatedProject.artist),
            audio: t.audio || t.audioUrl || '',
            hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
            audioUrl: t.audioUrl || '',
            audioFile: null,
            audioFileName: '',
            links: {
              spotify: '',
              apple: '',
              youtube: '',
              soundcloud: '',
              amazon: '',
              bandcamp: '',
              deezer: '',
              itunes: '',
              pandora: '',
              tidal: '',
              ...(t.links || {}),
            },
          }))
          setEditTracks(updatedFormattedTracks)
          editTracksRef.current = updatedFormattedTracks
        }
        setEditCoverFile(null)
        try {
          router.refresh()
        } catch (e) { }
        return true
      }
      return false
    } catch (err) {
      setErrorMessage(`Auto-save update error: ${err.message}`)
      return false
    }
  }

  // Authentication submit
  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.ok && data.authenticated) {
        setIsAuthenticated(true)
        try {
          sessionStorage.setItem('admin_authenticated', 'true')
          sessionStorage.setItem('admin_password', password)
        } catch (e) { }
      } else {
        setAuthError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setAuthError('Network error during authentication')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    try {
      sessionStorage.removeItem('admin_authenticated')
      sessionStorage.removeItem('admin_password')
    } catch (e) { }
  }

  // ----------------------------------------------------
  // SUBMIT: DELETE PROJECT
  // ----------------------------------------------------
  const handleDeleteProject = async () => {
    setDeleteConfirmOpen(false)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('password', password)
      formData.append('action', 'delete')
      formData.append('projectIndex', selectedProjIndex)

      const res = await fetch('/api/admin/project', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: formData,
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setStatusMessage(result.message)

        const nextList = projectsList.filter((_, i) => i !== selectedProjIndex)
        setProjectsList(nextList)

        if (nextList.length === 0) {
          setIsCreatingNew(false)
          setSelectedProjIndex(-1)
        } else {
          const nextIndex = Math.min(selectedProjIndex, nextList.length - 1)
          const nextProj = nextList[nextIndex]
          const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
          const formattedTracks = (nextProj.tracks ?? []).map((t, tIdx) => ({
            id: `edit-track-${tIdx}-${Date.now()}`,
            name: t.name || '',
            artist: resolveOverrideArtist(t.artist, primaryName, nextProj.artist),
            audio: t.audio || t.audioUrl || '',
            hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
            audioFile: null,
            audioFileName: '',
            links: {
              spotify: '',
              apple: '',
              youtube: '',
              soundcloud: '',
              amazon: '',
              bandcamp: '',
              deezer: '',
              itunes: '',
              pandora: '',
              tidal: '',
              ...(t.links || {}),
            },
          }))
          setEditName(nextProj.name || '')
          setEditType(nextProj.type || 'Single')
          setEditArtist(resolveOverrideArtist(nextProj.artist, primaryName))
          setEditDate(nextProj.date || new Date().toISOString().split('T')[0])
          setEditCoverFile(null)
          setEditCoverPreview(nextProj.cover || null)
          setEditTracks(formattedTracks)
          editTracksRef.current = formattedTracks
          setSelectedProjIndex(nextIndex)
        }

        try {
          router.refresh()
        } catch (e) { }
      } else {
        setErrorMessage(result.error || 'Failed to delete project.')
      }
    } catch (err) {
      setErrorMessage(`Delete failed: ${err.message}`)
    }
  }

  // ----------------------------------------------------
  // CONFIRM TRACK DELETE & TRACK COPY HANDLERS
  // ----------------------------------------------------
  const confirmDeleteTrack = () => {
    if (!trackToDelete) return
    const { index, isEditing } = trackToDelete
    if (isEditing) {
      if (editTracks.length <= 1) {
        setTrackToDelete(null)
        return
      }
      const n = editTracks.filter((_, i) => i !== index)
      setEditTracks(n)
      editTracksRef.current = n
      markFieldDirty(`edit_del_${index}`, () => executeUpdateProject(n), 100)
    } else {
      if (tracks.length <= 1) {
        setTrackToDelete(null)
        return
      }
      setTracks((prev) => prev.filter((_, i) => i !== index))
    }
    setTrackToDelete(null)
  }

  const handleCopyTrack = async () => {
    if (!trackToCopy) return
    setIsCopyingTrack(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/copy-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          sourceProjectIndex: trackToCopy.sourceProjectIndex,
          sourceTrackIndex: trackToCopy.trackIndex,
          targetProjectIndex: copyTargetProjectIndex,
        }),
      })

      const result = await res.json()
      if (res.ok && result.success) {
        setStatusMessage(result.message)

        if (result.updatedTargetProject && typeof result.targetProjectIndex === 'number') {
          setProjectsList((prev) => {
            const next = [...prev]
            next[result.targetProjectIndex] = result.updatedTargetProject
            return next
          })

          if (result.targetProjectIndex === selectedProjIndex) {
            const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
            const updatedTracks = (result.updatedTargetProject.tracks ?? []).map((t, idx) => ({
              id: editTracksRef.current[idx]?.id || `edit-track-${idx}-${Date.now()}`,
              name: t.name || '',
              artist: resolveOverrideArtist(t.artist, primaryName, result.updatedTargetProject.artist),
              audio: t.audio || t.audioUrl || '',
              hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
              audioFile: null,
              audioFileName: '',
              links: {
                spotify: '',
                apple: '',
                youtube: '',
                soundcloud: '',
                amazon: '',
                bandcamp: '',
                deezer: '',
                itunes: '',
                pandora: '',
                tidal: '',
                ...(t.links || {}),
              },
            }))
            setEditTracks(updatedTracks)
            editTracksRef.current = updatedTracks
          }
        }

        setTrackToCopy(null)
      } else {
        setErrorMessage(result.error || 'Failed to copy track.')
      }
    } catch (err) {
      setErrorMessage(`Error copying track: ${err.message}`)
    } finally {
      setIsCopyingTrack(false)
    }
  }

  // Input Field Sx Style Helper for Unsaved (Dirty) and Saved (Green) highlights
  const getFieldSx = (fieldKey) => {
    const isDirty = dirtyFields.has(fieldKey)
    const isSaved = savedFields.has(fieldKey)

    if (isDirty) {
      return {
        '& .MuiOutlinedInput-root': {
          transition: 'all 0.3s ease',
          '& fieldset': { borderColor: '#ff9800 !important', borderWidth: 2 },
          boxShadow: '0 0 0 3px rgba(255, 152, 0, 0.4)',
        },
      }
    }

    if (isSaved) {
      return {
        '& .MuiOutlinedInput-root': {
          transition: 'all 0.3s ease',
          '& fieldset': { borderColor: '#4caf50 !important', borderWidth: 2 },
          boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.5)',
        },
      }
    }

    return {
      '& .MuiOutlinedInput-root': {
        transition: 'all 0.3s ease',
      },
    }
  }

  // 1. Admin access disabled view
  if (!adminAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <LockIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Admin Access Disabled
          </Typography>
          <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
            Access to the admin portal is currently disabled. To enable access, set <code>"adminAccess": true</code> in <code>data/artist-data.json</code>.
          </Alert>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            Return to Discography
          </Button>
        </Paper>
      </Container>
    )
  }

  // 2. Authentication view
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 28, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'primary.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32, color: 'primary.contrastText' }} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Site Owner Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter password to unlock site management tools
            </Typography>
          </Box>

          {authError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Admin Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isAuthLoading || !password}
              sx={{ py: 1.4, borderRadius: 2, fontWeight: 600 }}
            >
              {isAuthLoading ? <CircularProgress size={24} /> : 'Unlock Admin Panel'}
            </Button>
            <Button
              variant="text"
              startIcon={<HomeIcon />}
              href="/"
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              Back to Discography
            </Button>
          </Box>
        </Paper>
      </Container>
    )
  }

  // Compute slug validation variables
  const isEditNameDuplicate = !isCreatingNew && isProjectSlugDuplicate(editName, projectsList, selectedProjIndex)
  const editDupTrackIndexes = !isCreatingNew ? getDuplicateTrackSlugIndexes(editTracks) : new Set()
  const isNewNameDuplicate = isCreatingNew && isProjectSlugDuplicate(name, projectsList, -1)
  const newDupTrackIndexes = isCreatingNew ? getDuplicateTrackSlugIndexes(tracks) : new Set()

  // 3. Admin Full Widescreen Dashboard with Auto-Save
  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, md: 2.5 },
        height: { md: '100vh' },
        maxHeight: { md: '100vh' },
        display: { md: 'flex' },
        flexDirection: { md: 'column' },
        overflow: { md: 'hidden' },
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Bar */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          flexShrink: 0,
          borderRadius: 3,
          backgroundColor: 'rgba(25, 25, 35, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AlbumIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Discography Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              All changes are automatically saved to disk following edits
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Live Auto-Save Status Badge */}
          {isAutoSaving ? (
            <Chip
              icon={<SyncIcon sx={{ animation: 'spin 1s infinite linear', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
              label="Auto-saving changes..."
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : dirtyFields.size > 0 ? (
            <Chip
              icon={<PendingIcon />}
              label={`Unsaved changes (${dirtyFields.size})...`}
              color="warning"
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : savedFields.size > 0 ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="Saved to disk!"
              color="success"
              sx={{ fontWeight: 700, py: 0.5, animation: 'pulse 1s 1' }}
            />
          ) : lastSavedTime ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Saved at ${lastSavedTime}`}
              color="default"
              variant="outlined"
              sx={{ color: 'text.secondary', py: 0.5 }}
            />
          ) : null}

          <Button
            variant="outlined"
            size="small"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            View Site
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Lock Panel
          </Button>
        </Box>
      </Paper>

      {/* Global Status Messages */}
      {statusMessage && (
        <Alert severity="success" onClose={() => setStatusMessage(null)} sx={{ mb: 2, flexShrink: 0, borderRadius: 2 }}>
          {statusMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2, flexShrink: 0, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Tab Navigation: Artist Profile | Manage Projects */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          backgroundColor: 'rgba(20, 20, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', px: 2, pt: 1, flexShrink: 0 }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Artist Profile" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }} />
          <Tab icon={<AlbumIcon />} iconPosition="start" label="Manage Projects" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }} />
        </Tabs>

        <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* ========================================================================= */}
          {/* TAB 0: ARTIST PROFILE (AUTO-SAVING) */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
              <Grid container spacing={3}>
                {/* Left Column: Artist Bio & Details */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" /> Artist Profile Information
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField
                        label="Artist Name"
                        required
                        fullWidth
                        value={artistNameInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setArtistNameInput(val)
                          artistNameInputRef.current = val
                          markFieldDirty('artistName', executeSaveArtist)
                        }}
                        sx={getFieldSx('artistName')}
                      />
                      <TextField
                        label="Artist Bio / Description"
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Write a bio describing the artist project..."
                        value={artistBioInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setArtistBioInput(val)
                          artistBioInputRef.current = val
                          markFieldDirty('artistBio', executeSaveArtist)
                        }}
                        sx={getFieldSx('artistBio')}
                      />
                    </Stack>
                  </Paper>
                </Grid>

                {/* Right Column: Platform Links & Social Accounts */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={3}>
                    {/* Platforms */}
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinkIcon color="primary" /> Artist Streaming Platform URLs
                      </Typography>
                      <Grid container spacing={2}>
                        {PLATFORM_KEYS.map(({ key, label }) => (
                          <Grid key={key} size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label={label}
                              size="small"
                              fullWidth
                              value={artistPlatforms[key] || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setArtistPlatforms((prev) => {
                                  const next = { ...prev, [key]: val }
                                  artistPlatformsRef.current = next
                                  return next
                                })
                                markFieldDirty(`platform_${key}`, executeSaveArtist)
                              }}
                              sx={getFieldSx(`platform_${key}`)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>

                    {/* Socials */}
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShareIcon color="primary" /> Social Media Accounts
                      </Typography>
                      <Grid container spacing={2}>
                        {SOCIAL_KEYS.map(({ key, label }) => (
                          <Grid key={key} size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label={label}
                              size="small"
                              fullWidth
                              value={artistSocials[key] || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setArtistSocials((prev) => {
                                  const next = { ...prev, [key]: val }
                                  artistSocialsRef.current = next
                                  return next
                                })
                                markFieldDirty(`social_${key}`, executeSaveArtist)
                              }}
                              sx={getFieldSx(`social_${key}`)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: MANAGE PROJECTS (INDEPENDENT COLUMN SCROLLING) */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <Grid
              container
              spacing={3}
              sx={{
                flexGrow: 1,
                height: { md: '100%' },
                minHeight: 0,
              }}
            >
              {/* Left Sidebar Column: Projects List & Add Button */}
              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{
                  height: { md: '100%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(28, 28, 38, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    height: { md: '100%' },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Button
                    variant={isCreatingNew ? 'contained' : 'outlined'}
                    color="secondary"
                    size="large"
                    fullWidth
                    disabled={dirtyFields.size > 0}
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setIsCreatingNew(true)
                      setSelectedProjIndex(-1)
                    }}
                    sx={{ mb: 2.5, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}
                  >
                    Add New Project
                  </Button>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      px: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Existing Releases ({projectsList.length})
                    </Typography>
                    {dirtyFields.size > 0 && !isCreatingNew && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        <SyncIcon sx={{ fontSize: 13 }} /> Saving…
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      pr: 0.5,
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3 },
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {isCreatingNew && (
                        <ListItemButton
                          selected={true}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            border: '1px dashed',
                            borderColor: 'secondary.main',
                            backgroundColor: 'rgba(206, 147, 216, 0.12)',
                            py: 1.5,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center' }}>
                            {coverPreview ? (
                              <Box
                                component="img"
                                src={coverPreview}
                                alt="Cover preview"
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1.5,
                                  objectFit: 'cover',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                }}
                              />
                            ) : (
                              <AlbumIcon color="secondary" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            slotProps={{
                              primary: { component: 'div' },
                              secondary: { component: 'div' },
                            }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                  {name.trim() || 'New Project'}
                                </Typography>
                                <Chip label="Draft" color="secondary" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                {type || 'Single'} • {tracks.length} track{tracks.length === 1 ? '' : 's'}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      )}
                      {projectsList.map((p, idx) => {
                        const hasCover = Boolean(p.cover || p.hasCover)
                        const trks = p.tracks ?? []
                        const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length
                        const hasAllAudio = trks.length > 0 && audioCount === trks.length
                        const linkCount = trks.reduce(
                          (acc, t) => acc + Object.values(t.links ?? {}).filter((l) => l && typeof l === 'string' && l.trim() !== '').length,
                          0
                        )
                        const hasLinks = linkCount > 0
                        const isComplete = hasCover && hasAllAudio && hasLinks
                        const isSelected = !isCreatingNew && selectedProjIndex === idx

                        return (
                          <ListItemButton
                            key={idx}
                            selected={isSelected}
                            disabled={dirtyFields.size > 0 && !isSelected}
                            onClick={() => {
                              const primaryName = (artistNameInputRef.current || artistData?.name || defaultArtistName).trim()
                              const formattedTracks = (p.tracks ?? []).map((t, tIdx) => ({
                                id: `edit-track-${tIdx}-${Date.now()}`,
                                name: t.name || '',
                                artist: resolveOverrideArtist(t.artist, primaryName, p.artist),
                                audio: t.audio || t.audioUrl || '',
                                hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
                                audioFile: null,
                                audioFileName: '',
                                links: {
                                  spotify: '',
                                  apple: '',
                                  youtube: '',
                                  soundcloud: '',
                                  amazon: '',
                                  bandcamp: '',
                                  deezer: '',
                                  itunes: '',
                                  pandora: '',
                                  tidal: '',
                                  ...(t.links || {}),
                                },
                              }))
                              setIsCreatingNew(false)
                              setEditName(p.name || '')
                              setEditType(p.type || 'Single')
                              setEditArtist(resolveOverrideArtist(p.artist, primaryName))
                              setEditDate(p.date || new Date().toISOString().split('T')[0])
                              setEditCoverFile(null)
                              setEditCoverPreview(p.cover || null)
                              setEditTracks(formattedTracks)
                              editTracksRef.current = formattedTracks
                              setSelectedProjIndex(idx)
                            }}
                            sx={{
                              borderRadius: 2,
                              mb: 1,
                              border: '1px solid',
                              borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                              py: 1.5,
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center' }}>
                              {p.cover ? (
                                <Box
                                  component="img"
                                  src={p.cover}
                                  alt={p.name || 'Cover'}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1.5,
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                  }}
                                />
                              ) : (
                                <AlbumIcon color={isSelected ? 'primary' : 'action'} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              slotProps={{
                                primary: { component: 'div' },
                                secondary: { component: 'div' },
                              }}
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                                    {p.name || 'Untitled Project'}
                                  </Typography>
                                  {isComplete ? (
                                    <Chip label="Complete" color="success" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                  ) : (
                                    <Chip label="Incomplete" color="warning" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {p.type || 'Single'} • {trks.length} track{trks.length === 1 ? '' : 's'}
                                  </Typography>
                                  {!isComplete && (
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                      {!hasCover && <Chip label="No Art" color="error" variant="outlined" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />}
                                      {!hasAllAudio && (
                                        <Chip
                                          label={audioCount === 0 ? 'No Audio' : `${audioCount}/${trks.length} Audio`}
                                          color="warning"
                                          variant="outlined"
                                          size="small"
                                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                        />
                                      )}
                                      {!hasLinks && <Chip label="No Links" color="info" variant="outlined" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />}
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItemButton>
                        )
                      })}
                    </List>
                  </Box>
                </Paper>
              </Grid>

              {/* Right Main Column: Create OR Edit Form (Independent Scroll) */}
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{
                  height: { md: '100%' },
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    height: { md: '100%' },
                    overflowY: { md: 'auto' },
                    pr: { md: 1 },
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3 },
                  }}
                >
                  {isCreatingNew ? (
                    /* CREATE NEW PROJECT FORM (AUTO-SAVING) */
                    <Stack spacing={3}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AddIcon color="secondary" /> Create New Project
                        </Typography>
                        <Grid container spacing={2.5}>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                              label="Project Title"
                              placeholder="e.g. Post Mortem, Sugar Water"
                              fullWidth
                              required
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value)
                                markFieldDirty('new_name', executeCreateProject)
                              }}
                              error={isNewNameDuplicate}
                              helperText={isNewNameDuplicate ? 'A project with this title / URL slug already exists.' : null}
                              sx={{
                                ...getFieldSx('new_name'),
                                ...(isNewNameDuplicate && {
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#f44336 !important', borderWidth: 2 },
                                    boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.4)',
                                  },
                                }),
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required sx={getFieldSx('new_type')}>
                              <InputLabel id="new-type-label">Release Type</InputLabel>
                              <Select
                                labelId="new-type-label"
                                label="Release Type"
                                value={type}
                                onChange={(e) => {
                                  setType(e.target.value)
                                  markFieldDirty('new_type', executeCreateProject)
                                }}
                              >
                                {PROJECT_TYPES.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Artist Name (Optional Override)"
                              placeholder={`Defaults to "${artistNameInput.trim() || defaultArtistName}"`}
                              fullWidth
                              value={artist}
                              onChange={(e) => {
                                const val = e.target.value
                                setArtist(val)
                                artistRef.current = val
                                markFieldDirty('new_artist', executeCreateProject)
                              }}
                              sx={getFieldSx('new_artist')}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Release Date"
                              type="date"
                              fullWidth
                              required
                              value={date}
                              onChange={(e) => {
                                setDate(e.target.value)
                                markFieldDirty('new_date', executeCreateProject)
                              }}
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={getFieldSx('new_date')}
                            />
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2.5 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Cover Artwork
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          {coverPreview && (
                            <Box component="img" src={coverPreview} alt="Cover preview" sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover' }} />
                          )}
                          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                            Upload Cover Image File (.jpg, .png)
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setCoverFile(e.target.files[0])
                                  markFieldDirty('new_cover', executeCreateProject)
                                }
                              }}
                            />
                          </Button>
                          {coverFile && <Chip label={`Selected: ${coverFile.name}`} color="primary" onDelete={() => setCoverFile(null)} size="small" />}
                        </Box>
                      </Paper>

                      {/* Track Builder */}
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MusicNoteIcon color="primary" /> Track List ({tracks.length})
                          </Typography>
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setTracks((prev) => [...prev, createEmptyTrack()])
                              markFieldDirty('new_add_track', executeCreateProject)
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Add Track
                          </Button>
                        </Box>

                        <Stack spacing={2}>
                          {tracks.map((track, index) => (
                            <Card key={track.id} variant="outlined" sx={{ backgroundColor: 'rgba(20, 20, 28, 0.8)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                  <Chip label={`Track #${index + 1}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" disabled={index === 0} onClick={() => setTracks((prev) => { const n = [...prev]; const t = n[index]; n[index] = n[index - 1]; n[index - 1] = t; return n })}>
                                      <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" disabled={index === tracks.length - 1} onClick={() => setTracks((prev) => { const n = [...prev]; const t = n[index]; n[index] = n[index + 1]; n[index + 1] = t; return n })}>
                                      <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={tracks.length <= 1}
                                      onClick={() => {
                                        setTrackToDelete({
                                          index,
                                          isEditing: false,
                                          trackName: track.name.trim() || `Track #${index + 1}`,
                                        })
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <Grid container spacing={1.5}>
                                  <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                      label="Track Title"
                                      required
                                      fullWidth
                                      size="small"
                                      value={track.name}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setTracks((prev) => { const n = [...prev]; n[index].name = val; return n })
                                        markFieldDirty(`new_track_${index}_title`, executeCreateProject)
                                      }}
                                      error={newDupTrackIndexes.has(index)}
                                      helperText={newDupTrackIndexes.has(index) ? 'Track titles in a project must be unique.' : null}
                                      sx={{
                                        ...getFieldSx(`new_track_${index}_title`),
                                        ...(newDupTrackIndexes.has(index) && {
                                          '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#f44336 !important', borderWidth: 2 },
                                            boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.4)',
                                          },
                                        }),
                                      }}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                      label="Track Artist (Optional Override)"
                                      placeholder={`Defaults to "${artist.trim() || artistNameInput.trim() || defaultArtistName}"`}
                                      fullWidth
                                      size="small"
                                      value={track.artist}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setTracks((prev) => { const n = [...prev]; n[index].artist = val; return n })
                                        markFieldDirty(`new_track_${index}_artist`, executeCreateProject)
                                      }}
                                      sx={getFieldSx(`new_track_${index}_artist`)}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 2 }}>
                                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Button variant="contained" component="label" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                          Upload Audio File (.flac, .mp3, .wav)
                                          <input
                                            type="file"
                                            accept="audio/*"
                                            hidden
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) {
                                                const file = e.target.files[0]
                                                setTracks((prev) => { const n = [...prev]; n[index].audioFile = file; n[index].audioFileName = file.name; return n })
                                                markFieldDirty(`new_track_${index}_audio`, executeCreateProject)
                                              }
                                            }}
                                          />
                                        </Button>
                                        {track.audioFileName ? (
                                          <Chip icon={<CheckCircleIcon />} label={track.audioFileName} color="success" size="small" onDelete={() => setTracks((prev) => { const n = [...prev]; n[index].audioFile = null; n[index].audioFileName = ''; return n })} />
                                        ) : (
                                          <Chip icon={<MusicNoteIcon />} label="No audio file attached" color="warning" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                        )}
                                      </Box>
                                    </Paper>
                                  </Grid>

                                  <Grid size={{ xs: 12 }}>
                                    <Accordion defaultExpanded elevation={0} sx={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <LinkIcon fontSize="small" color="action" /> Streaming Links ({Object.values(track.links).filter(Boolean).length})
                                        </Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <Grid container spacing={1.5}>
                                          {PLATFORM_KEYS.map(({ key, label }) => (
                                            <Grid key={key} size={{ xs: 12, sm: 6 }}>
                                              <TextField
                                                label={label}
                                                size="small"
                                                fullWidth
                                                value={track.links[key] || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value
                                                  setTracks((prev) => { const n = [...prev]; n[index].links[key] = val; return n })
                                                  markFieldDirty(`new_track_${index}_${key}`, executeCreateProject)
                                                }}
                                                sx={getFieldSx(`new_track_${index}_${key}`)}
                                              />
                                            </Grid>
                                          ))}
                                        </Grid>
                                      </AccordionDetails>
                                    </Accordion>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Paper>
                    </Stack>
                  ) : selectedProjIndex >= 0 && selectedProjIndex < projectsList.length ? (
                    /* EDIT EXISTING PROJECT FORM (AUTO-SAVING) */
                    <Stack spacing={3}>
                      {/* Project Metadata & Artwork */}
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditIcon color="primary" /> Editing: {editName || 'Project'}
                          </Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteConfirmOpen(true)}
                            sx={{ borderRadius: 2 }}
                          >
                            Delete Project
                          </Button>
                        </Box>

                        <Grid container spacing={2.5}>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                              label="Project Title"
                              fullWidth
                              required
                              value={editName}
                              onChange={(e) => {
                                const val = e.target.value
                                setEditName(val)
                                editNameRef.current = val
                                markFieldDirty('edit_name', executeUpdateProject)
                              }}
                              error={isEditNameDuplicate}
                              helperText={isEditNameDuplicate ? 'A project with this title / URL slug already exists.' : null}
                              sx={{
                                ...getFieldSx('edit_name'),
                                ...(isEditNameDuplicate && {
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#f44336 !important', borderWidth: 2 },
                                    boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.4)',
                                  },
                                }),
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required sx={getFieldSx('edit_type')}>
                              <InputLabel id="edit-type-label">Release Type</InputLabel>
                              <Select
                                labelId="edit-type-label"
                                label="Release Type"
                                value={editType}
                                onChange={(e) => {
                                  setEditType(e.target.value)
                                  markFieldDirty('edit_type', executeUpdateProject)
                                }}
                              >
                                {PROJECT_TYPES.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Artist Name (Optional Override)"
                              placeholder={`Defaults to "${artistNameInput.trim() || defaultArtistName}"`}
                              fullWidth
                              value={editArtist}
                              onChange={(e) => {
                                const val = e.target.value
                                setEditArtist(val)
                                editArtistRef.current = val
                                markFieldDirty('edit_artist', executeUpdateProject)
                              }}
                              sx={getFieldSx('edit_artist')}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Release Date"
                              type="date"
                              fullWidth
                              required
                              value={editDate}
                              onChange={(e) => {
                                setEditDate(e.target.value)
                                markFieldDirty('edit_date', executeUpdateProject)
                              }}
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={getFieldSx('edit_date')}
                            />
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2.5 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Replace / Update Artwork
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          {editCoverPreview && (
                            <Box component="img" src={editCoverPreview} alt="Cover preview" sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover' }} />
                          )}
                          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small" sx={{ borderRadius: 2 }}>
                            Upload New Cover File
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditCoverFile(e.target.files[0])
                                  markFieldDirty('edit_cover', executeUpdateProject, 100)
                                }
                              }}
                            />
                          </Button>
                          {editCoverFile && <Chip label={`Selected: ${editCoverFile.name}`} color="primary" onDelete={() => setEditCoverFile(null)} size="small" />}
                        </Box>
                      </Paper>

                      {/* Edit Tracks */}
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(28, 28, 38, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MusicNoteIcon color="primary" /> Edit Tracks ({editTracks.length})
                          </Typography>
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              const n = [...editTracks, createEmptyTrack()]
                              setEditTracks(n)
                              editTracksRef.current = n
                              markFieldDirty('edit_add_track', () => executeUpdateProject(n), 100)
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Add Track
                          </Button>
                        </Box>

                        <Stack spacing={2}>
                          {editTracks.map((track, index) => (
                            <Card key={track.id} variant="outlined" sx={{ backgroundColor: 'rgba(20, 20, 28, 0.8)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                  <Chip label={`Track #${index + 1}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      title="Copy Track to Another Project"
                                      onClick={() => {
                                        setTrackToCopy({
                                          track,
                                          sourceProjectIndex: selectedProjIndex,
                                          trackIndex: index,
                                        })
                                        const defaultTarget = projectsList.length > 1 && selectedProjIndex === 0 ? 1 : 0
                                        setCopyTargetProjectIndex(defaultTarget)
                                      }}
                                    >
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" disabled={index === 0} onClick={() => { const n = [...editTracks]; const t = n[index]; n[index] = n[index - 1]; n[index - 1] = t; setEditTracks(n); editTracksRef.current = n; markFieldDirty(`edit_move_${index}`, () => executeUpdateProject(n), 100) }}>
                                      <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" disabled={index === editTracks.length - 1} onClick={() => { const n = [...editTracks]; const t = n[index]; n[index] = n[index + 1]; n[index + 1] = t; setEditTracks(n); editTracksRef.current = n; markFieldDirty(`edit_move_${index}`, () => executeUpdateProject(n), 100) }}>
                                      <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={editTracks.length <= 1}
                                      onClick={() => {
                                        setTrackToDelete({
                                          index,
                                          isEditing: true,
                                          trackName: track.name.trim() || `Track #${index + 1}`,
                                        })
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <Grid container spacing={1.5}>
                                  <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                      label="Track Title"
                                      required
                                      fullWidth
                                      size="small"
                                      value={track.name}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setEditTracks((prev) => { const n = [...prev]; n[index].name = val; return n })
                                        markFieldDirty(`edit_track_${index}_title`, executeUpdateProject)
                                      }}
                                      error={editDupTrackIndexes.has(index)}
                                      helperText={editDupTrackIndexes.has(index) ? 'Track titles in a project must be unique.' : null}
                                      sx={{
                                        ...getFieldSx(`edit_track_${index}_title`),
                                        ...(editDupTrackIndexes.has(index) && {
                                          '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#f44336 !important', borderWidth: 2 },
                                            boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.4)',
                                          },
                                        }),
                                      }}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                      label="Track Artist (Optional Override)"
                                      placeholder={`Defaults to "${editArtist.trim() || artistNameInput.trim() || defaultArtistName}"`}
                                      fullWidth
                                      size="small"
                                      value={track.artist}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setEditTracks((prev) => { const n = [...prev]; n[index].artist = val; return n })
                                        markFieldDirty(`edit_track_${index}_artist`, executeUpdateProject)
                                      }}
                                      sx={getFieldSx(`edit_track_${index}_artist`)}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 2 }}>
                                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Button variant="contained" component="label" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                          Replace Audio File
                                          <input
                                            type="file"
                                            accept="audio/*"
                                            hidden
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) {
                                                const file = e.target.files[0]
                                                setEditTracks((prev) => { const n = [...prev]; n[index].audioFile = file; n[index].audioFileName = file.name; return n })
                                                markFieldDirty(`edit_track_${index}_audio`, executeUpdateProject, 100)
                                              }
                                            }}
                                          />
                                        </Button>
                                        {track.audioFileName ? (
                                          <Chip icon={<CheckCircleIcon />} label={`New: ${track.audioFileName}`} color="success" size="small" onDelete={() => setEditTracks((prev) => { const n = [...prev]; n[index].audioFile = null; n[index].audioFileName = ''; return n })} />
                                        ) : track.hasAudio || track.audio ? (
                                          <Chip icon={<CheckCircleIcon />} label={`Audio file attached (${track.audio || 'Local audio'})`} color="success" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                        ) : (
                                          <Chip icon={<MusicNoteIcon />} label="No audio file attached" color="warning" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                        )}
                                      </Box>
                                    </Paper>
                                  </Grid>

                                  <Grid size={{ xs: 12 }}>
                                    <Accordion defaultExpanded elevation={0} sx={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <LinkIcon fontSize="small" color="action" /> Streaming Links ({Object.values(track.links).filter(Boolean).length})
                                        </Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <Grid container spacing={1.5}>
                                          {PLATFORM_KEYS.map(({ key, label }) => (
                                            <Grid key={key} size={{ xs: 12, sm: 6 }}>
                                              <TextField
                                                label={label}
                                                size="small"
                                                fullWidth
                                                value={track.links[key] || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value
                                                  setEditTracks((prev) => { const n = [...prev]; n[index].links[key] = val; return n })
                                                  markFieldDirty(`edit_track_${index}_${key}`, executeUpdateProject)
                                                }}
                                                sx={getFieldSx(`edit_track_${index}_${key}`)}
                                              />
                                            </Grid>
                                          ))}
                                        </Grid>
                                      </AccordionDetails>
                                    </Accordion>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Paper>
                    </Stack>
                  ) : null}
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              backgroundColor: 'rgba(25, 25, 35, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              p: 1,
              maxWidth: 450,
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3, color: 'error.main', fontWeight: 700 }}>
          Delete Project?
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{editName}</strong> from your discography? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteProject} sx={{ borderRadius: 2 }}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Track Confirmation Dialog */}
      <Dialog
        open={Boolean(trackToDelete)}
        onClose={() => setTrackToDelete(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              backgroundColor: 'rgba(25, 25, 35, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              p: 1,
              maxWidth: 420,
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3, color: 'error.main', fontWeight: 700 }}>
          Delete Track?
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1">
            Are you sure you want to delete track <strong>"{trackToDelete?.trackName}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setTrackToDelete(null)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDeleteTrack} sx={{ borderRadius: 2 }}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Track Dialog */}
      <Dialog
        open={Boolean(trackToCopy)}
        onClose={() => setTrackToCopy(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              backgroundColor: 'rgba(25, 25, 35, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              p: 1.5,
              minWidth: 380,
              maxWidth: 500,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContentCopyIcon color="primary" /> Copy Track to Another Project
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Copying track <strong>"{trackToCopy?.track?.name || 'Untitled Track'}"</strong> into a destination project. Any audio file will also be duplicated as an independent copy.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="target-project-label">Destination Project</InputLabel>
            <Select
              labelId="target-project-label"
              label="Destination Project"
              value={copyTargetProjectIndex}
              onChange={(e) => setCopyTargetProjectIndex(Number(e.target.value))}
            >
              {projectsList.map((p, idx) => (
                <MenuItem key={idx} value={idx}>
                  {p.name || `Project #${idx + 1}`} {idx === trackToCopy?.sourceProjectIndex ? '(Current Project)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setTrackToCopy(null)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCopyTrack}
            disabled={isCopyingTrack || projectsList.length === 0}
            startIcon={isCopyingTrack ? <CircularProgress size={16} color="inherit" /> : <ContentCopyIcon />}
            sx={{ borderRadius: 2 }}
          >
            {isCopyingTrack ? 'Copying…' : 'Copy Track'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
