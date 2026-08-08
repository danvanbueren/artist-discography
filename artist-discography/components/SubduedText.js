'use client'

import { Typography } from '@mui/material'

/**
 * Renders text, or a subdued italic placeholder if the text is empty/missing.
 */
export default function SubduedText({
  value,
  placeholder,
  variant = 'body1',
  component,
  sx = {},
  ...props
}) {
  const isMissing = !value || typeof value !== 'string' || value.trim() === ''

  if (isMissing) {
    return (
      <Typography
        variant={variant}
        component={component}
        sx={{
          fontStyle: 'italic',
          color: 'text.secondary',
          opacity: 0.65,
          fontWeight: 400,
          ...sx,
        }}
        {...props}
      >
        {placeholder}
      </Typography>
    )
  }

  return (
    <Typography
      variant={variant}
      component={component}
      sx={sx}
      {...props}
    >
      {value}
    </Typography>
  )
}
