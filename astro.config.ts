import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import remarkToc from 'remark-toc';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://vitebo.github.io',
  base: 'vitebo.github.io',
  trailingSlash: "never",
  integrations: [
    mdx(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [
      rehypeHeadingIds
    ],
    shikiConfig: {
      themes: {
        light: 'min-light',
        dark: 'min-dark',
      },
    },
  },
  i18n: {
    defaultLocale: "pt-br",
    locales: ["pt-br", "en"],
    routing: {
      prefixDefaultLocale: false,
      strategy: "pathname",
    }
  }
});
