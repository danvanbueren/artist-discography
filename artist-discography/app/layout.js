import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './globals.css'
import Providers from './providers'

export { generateRootMetadata as generateMetadata } from '../lib/metadata'

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link
          rel='preload'
          href='/api/logo?w=240&fmt=webp'
          as='image'
          type='image/webp'
          fetchPriority='high'
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
