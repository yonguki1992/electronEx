import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config';
const config = mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // dir: path.resolve(__dirname, 'test'),
      include: [
        ...configDefaults.include,
      ],
      exclude: [
        ...configDefaults.exclude,
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        './src/config/**',
      ],
    },
  })
)
export default config;