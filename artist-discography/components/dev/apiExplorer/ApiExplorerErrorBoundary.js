'use client'

import { Component } from 'react'
import { Paper, Alert, AlertTitle, Button } from '@mui/material'

export default class ApiExplorerErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('API Explorer Component Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2.5,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
          }}
        >
          <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>API Explorer Encountered an Error</AlertTitle>
            {this.state.error?.message ||
              'An unexpected rendering error occurred inside the API Explorer console.'}
          </Alert>
          <Button
            variant='outlined'
            color='error'
            size='small'
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Reload API Explorer
          </Button>
        </Paper>
      )
    }
    return this.props.children
  }
}
