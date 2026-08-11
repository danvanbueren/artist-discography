import { loadArtistData } from '../../lib/artistData'
import DevArtistDiscographyView from '../../components/DevArtistDiscographyView'
import { Container, Paper, Typography, Alert, Button, Box } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import HomeIcon from '@mui/icons-material/Home'

export async function generateMetadata() {
  let artistName = ''
  try {
    const { data } = loadArtistData()
    artistName = data?.artist?.name?.trim() || ''
  } catch (err) { }

  const name = artistName || 'Artist'

  return {
    title: 'Dev Dashboard',
    description: `Developer preview dashboard for ${name}.`,
  }
}

export default function DevPage() {
  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {
    console.error('Error loading artist data in DevPage:', err)
  }

  const data = dataResult?.data ?? {}
  const health = dataResult?.health ?? { isHealthy: false, createdNewFile: false, issues: ['Failed to load data'] }
  const devAccess = data?.devAccess !== false

  if (!devAccess) {
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LockIcon sx={{ fontSize: 56, color: 'error.main' }} />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Dev Mode Access Disabled
          </Typography>
          <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
            Access to the developer tools page (<code>/dev</code>) is currently disabled. To enable access, set <code>"devAccess": true</code> in <code>data/artist-data.json</code>.
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

  return (
    <DevArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
