'use client'

import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
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
      <Grid size={{ xs: 12, sm: 8 }}>
        <AdminTextInput
          label='Project Title'
          fullWidth
          required
          value={name}
          onChange={(val) => {
            setName(val)
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
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth size='small' required sx={getSx('type')}>
          <InputLabel id={`${prefix}-type-label`}>Release Type</InputLabel>
          <Select
            labelId={`${prefix}-type-label`}
            label='Release Type'
            value={type}
            onChange={(e) => {
              const val = e.target.value
              setType(val)
              if (typeRef) typeRef.current = val
              markFieldDirty?.(`${prefix}_type`, onTriggerSave)
            }}
          >
            {PROJECT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <AdminTextInput
          label='Artist Name (Optional Override)'
          placeholder={`Defaults to "${artistNameInput?.trim() || defaultArtistName}"`}
          fullWidth
          value={artist}
          onChange={(val) => {
            setArtist(val)
            if (artistRef) artistRef.current = val
            markFieldDirty?.(`${prefix}_artist`, onTriggerSave)
          }}
          isDirty={isDirty('artist')}
          isSaved={isSaved('artist')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <AdminDateInput
          label='Release Date'
          value={date}
          onChange={(val) => {
            setDate(val)
            if (dateRef) dateRef.current = val
            markFieldDirty?.(`${prefix}_date`, onTriggerSave)
          }}
          isDirty={isDirty('date')}
          isSaved={isSaved('date')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size='small' sx={getSx('visibility')}>
          <InputLabel id={`${prefix}-visibility-label`}>Visibility (Gated Access)</InputLabel>
          <Select
            labelId={`${prefix}-visibility-label`}
            label='Visibility (Gated Access)'
            value={visibility || 'public'}
            onChange={(e) => {
              const val = e.target.value
              setVisibility(val)
              if (visibilityRef) visibilityRef.current = val
              markFieldDirty?.(`${prefix}_visibility`, onTriggerSave)
            }}
          >
            <MenuItem value='public'>Public (Visible to all visitors)</MenuItem>
            <MenuItem value='private'>Private (Locked behind code)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size='small' sx={getSx('copyright')}>
          <InputLabel id={`${prefix}-copyright-label`}>Copyright / Stream Clearance</InputLabel>
          <Select
            labelId={`${prefix}-copyright-label`}
            label='Copyright / Stream Clearance'
            value={copyright || 'cleared'}
            onChange={(e) => {
              const val = e.target.value
              setCopyright(val)
              if (copyrightRef) copyrightRef.current = val
              markFieldDirty?.(`${prefix}_copyright`, onTriggerSave)
            }}
          >
            <MenuItem value='cleared'>Cleared (Audio streams publicly)</MenuItem>
            <MenuItem value='uncleared'>Uncleared (Audio streams only when unlocked)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </>
  )
}
