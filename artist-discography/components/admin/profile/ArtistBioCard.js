'use client'

import { Stack } from '@mui/material'
import AdminTextInput from '../common/AdminTextInput'

/**
 * Artist name and biography multiline text input fields.
 */
export default function ArtistBioCard({
  artistNameInput,
  setArtistNameInput,
  artistNameInputRef,
  artistBioInput,
  setArtistBioInput,
  artistBioInputRef,
  dirtyFields,
  savedFields,
  markFieldDirty,
  executeSaveArtist,
}) {
  return (
    <Stack
      spacing={2.5}
      sx={{
        flexGrow: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AdminTextInput
        label='Artist Name'
        required
        fullWidth
        value={artistNameInput}
        onChange={(val) => {
          setArtistNameInput(val)
          if (artistNameInputRef) artistNameInputRef.current = val
          markFieldDirty?.('artistName', executeSaveArtist)
        }}
        isDirty={dirtyFields?.has?.('artistName')}
        isSaved={savedFields?.has?.('artistName')}
      />

      <AdminTextInput
        label='Artist Bio / Description'
        multiline
        fullWidth
        placeholder='Write a bio describing the artist project...'
        value={artistBioInput}
        onChange={(val) => {
          setArtistBioInput(val)
          if (artistBioInputRef) artistBioInputRef.current = val
          markFieldDirty?.('artistBio', executeSaveArtist)
        }}
        isDirty={dirtyFields?.has?.('artistBio')}
        isSaved={savedFields?.has?.('artistBio')}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          '& .MuiInputBase-root': {
            flexGrow: 1,
            height: '100%',
            alignItems: 'flex-start',
          },
          '& .MuiInputBase-input': {
            height: '100% !important',
          },
        }}
      />
    </Stack>
  )
}
