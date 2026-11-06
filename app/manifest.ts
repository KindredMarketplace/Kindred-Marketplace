import type { MetadataRoute } from 'next';

/**
 * Web app manifest: makes Kindred installable to the phone home screen
 * (Android "Install app", iOS "Add to Home Screen").
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kindred',
    short_name: 'Kindred',
    description: 'A better way to connect. Families and independent caregivers, directly.',
    start_url: '/login?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBFAF6',
    theme_color: '#FBFAF6',
    categories: ['health', 'lifestyle', 'medical'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Messages', url: '/messages', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Browse caregivers', url: '/browse', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
