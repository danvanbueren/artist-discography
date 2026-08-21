import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettierConfig from 'eslint-config-prettier'

const eslintConfig = [
  ...nextCoreWebVitals,
  prettierConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**'],
  },
]

export default eslintConfig
