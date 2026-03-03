import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tallchairadvisor.com',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) =>
        !page.includes('/affiliate-disclosure/') &&
        !page.includes('/contact/') &&
        !page.includes('/privacy-policy/'),
      lastmod: new Date(),
    }),
  ],
  output: 'static',
});
