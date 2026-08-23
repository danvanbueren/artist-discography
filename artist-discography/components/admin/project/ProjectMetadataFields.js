'use client'

import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
} from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import PersonIcon from '@mui/icons-material/Person'
import CategoryIcon from '@mui/icons-material/Category'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import AdminTextInput from '../common/AdminTextInput'
import AdminDateInput from '../common/AdminDateInput'
import { PROJECT_TYPES } from '../adminConstants'

/**
 * Grid of core metadata input fields for Project forms.
 */
export default function ProjectMetadataFields({
  prefix = 'edit',
  name,
  setName,
  nameRef,
  type,
  setType,
  typeRef,
  artist,
  setArtist,
  artistRef,
  date,
  setDate,
  dateRef,
  visibility,
  setVisibility,
  visibilityRef,
  copyright,
  setCopyright,
  copyrightRef,
  defaultArtistName,
  artistNameInput,
  isNameDuplicate,
  nameValidationError,
  dirtyFields,
  savedFields,
  getFieldSx,
  markFieldDirty,
  onTriggerSave,
}) {
  const isDirty = (f) => dirtyFields?.has?.(`${prefix}_${f}`)
  const isSaved = (f) => savedFields?.has?.(`${prefix}_${f}`)
  const getSx = (f) => (getFieldSx ? getFieldSx(`${prefix}_${f}`) : {})

  return (
    <>
      {/* Row 1: Project Title (50%) & Project Artist (50%) */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <AdminTextInput
          label='Project Title'
          fullWidth
          required
          value={name}
          onChange={(val) => {
            setName?.(val)
            if (nameRef) nameRef.current = val
            markFieldDirty?.(`${prefix}_name`, onTriggerSave)
          }}
          error={Boolean(isNameDuplicate || nameValidationError)}
          helperText={
            nameValidationError ||
            (isNameDuplicate ? 'A project with this title already exists.' : null)
          }
          isDirty={isDirty('name')}
          isSaved={isSaved('name')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <AlbumIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <AdminTextInput
          label='Project Artist'
          placeholder={artistNameInput?.trim() || defaultArtistName}
          fullWidth
          value={artist}
          onChange={(val) => {
            setArtist?.(val)
            if (artistRef) artistRef.current = val
            markFieldDirty?.(`${prefix}_artist`, onTriggerSave)
          }}
          isDirty={isDirty('artist')}
          isSaved={isSaved('artist')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      {/* Row 2: Project Type (25%), Release Date (25%), Visibility (25%), Copyright (25%) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size='small' required sx={getSx('type')}>
          <InputLabel id={`${prefix}-type-label`}>Project Type</InputLabel>
          <Select
            labelId={`${prefix}-type-label`}
            label='Project Type'
            value={type}
            onChange={(e) => {
              const val = e.target.value
              setType?.(val)
              if (typeRef) typeRef.current = val
              markFieldDirty?.(`${prefix}_type`, onTriggerSave)
            }}
            startAdornment={
              <InputAdornment position='start'>
                <CategoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            }
          >
            {PROJECT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <AdminDateInput
          label='Release Date'
          value={date}
          onChange={(val) => {
            setDate?.(val)
            if (dateRef) dateRef.current = val
            markFieldDirty?.(`${prefix}_date`, onTriggerSave)
          }}
          isDirty={isDirty('date')}
          isSaved={isSaved('date')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size='small' sx={getSx('visibility')}>
          <InputLabel id={`${prefix}-visibility-label`}>Visibility</InputLabel>
          <Select
            labelId={`${prefix}-visibility-label`}
            label='Visibility'
            value={visibility || 'public'}
            onChange={(e) => {
              const val = e.target.value
              setVisibility?.(val)
              if (visibilityRef) visibilityRef.current = val
              markFieldDirty?.(`${prefix}_visibility`, onTriggerSave)
            }}
            startAdornment={
              <InputAdornment position='start'>
                {visibility === 'private' ? (
                  <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                ) : (
                  <LockOpenIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                )}
              </InputAdornment>
            }
            renderValue={(selected) => (selected === 'private' ? 'Private' : 'Public')}
          >
            <MenuItem value='public'>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockOpenIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <span>Public</span>
              </Box>
            </MenuItem>
            <MenuItem value='private'>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <span>Private</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size='small' sx={getSx('copyright')}>
          <InputLabel id={`${prefix}-copyright-label`}>Copyright</InputLabel>
          <Select
            labelId={`${prefix}-copyright-label`}
            label='Copyright'
            value={copyright || 'cleared'}
            onChange={(e) => {
              const val = e.target.value
              setCopyright?.(val)
              if (copyrightRef) copyrightRef.current = val
              markFieldDirty?.(`${prefix}_copyright`, onTriggerSave)
            }}
            startAdornment={
              <InputAdornment position='start'>
                {copyright === 'uncleared' ? (
                  <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                ) : (
                  <LockOpenIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                )}
              </InputAdornment>
            }
            renderValue={(selected) => (selected === 'uncleared' ? 'Uncleared' : 'Cleared')}
          >
            <MenuItem value='cleared'>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockOpenIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <span>Cleared</span>
              </Box>
            </MenuItem>
            <MenuItem value='uncleared'>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <span>Uncleared</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </>
  )
}
