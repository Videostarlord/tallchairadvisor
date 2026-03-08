import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Per-page lastmod dates — update when a page is significantly revised
const pageLastmod = {
  'https://tallchairadvisor.com/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/best-office-chairs/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/office-chairs-for-tall-people/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/why-standard-chairs-dont-fit/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/pain-ergonomics/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/fit-guides/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/back-pain-spine-height/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/knee-pain-seat-depth/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/leg-pain-circulation/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/correct-chair-dimensions/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/how-to-adjust-chair/': new Date('2026-03-08'),
  'https://tallchairadvisor.com/review/aeron-size-c/': new Date('2026-03-07'),
  'https://tallchairadvisor.com/review/gesture/': new Date('2026-03-07'),
  'https://tallchairadvisor.com/review/leap-plus/': new Date('2026-03-07'),
  'https://tallchairadvisor.com/aeron-vs-gesture/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/aeron-vs-leap-plus/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/gesture-vs-leap-plus/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/herman-miller-aeron/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/herman-miller-aeron/tall-people/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-gesture/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-gesture/seat-depth/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-leap-plus/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-leap-plus/seat-height/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/chairs/steelcase-leap-plus/tall-people/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/about/': new Date('2026-03-01'),
  'https://tallchairadvisor.com/contact/': new Date('2026-01-01'),
  'https://tallchairadvisor.com/privacy-policy/': new Date('2026-01-01'),
  'https://tallchairadvisor.com/affiliate-disclosure/': new Date('2026-01-01'),
  'https://tallchairadvisor.com/author/marcus-reid/': new Date('2026-03-08'),
};

export default defineConfig({
  site: 'https://tallchairadvisor.com',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      serialize(item) {
        const lastmod = pageLastmod[item.url];
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  output: 'static',
});
