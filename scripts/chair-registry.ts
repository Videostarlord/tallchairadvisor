import type { ChairRegistryEntry } from './types.js';

export const CHAIR_REGISTRY: ChairRegistryEntry[] = [
  {
    chairId: 'steelcase-gesture',
    brand: 'Steelcase',
    model: 'Gesture',
    reviewPath: '/review/gesture/',
    searches: [
      'Steelcase Gesture tall person',
      'Steelcase Gesture review tall',
      'Steelcase Gesture seat depth tall',
      'Steelcase Gesture 6 foot',
      'Steelcase Gesture long term review',
    ],
    comparisonSearches: [
      'Steelcase Gesture vs Leap Plus tall',
      'Gesture vs Aeron tall person',
    ],
    subredditScopes: ['officechairs', 'Ergonomics', 'homeoffice', 'WorkFromHome'],
    aliases: ['steelcase gesture', 'gesture chair', 'gesture office chair'],
    postDateLimitDefault: '2022-01-01',
    commentDateLimitDefault: '2022-01-01',
  },
  {
    chairId: 'herman-miller-aeron',
    brand: 'Herman Miller',
    model: 'Aeron Size C',
    reviewPath: '/review/aeron-size-c/',
    searches: [
      'Herman Miller Aeron Size C tall',
      'Aeron size C tall person review',
      'Aeron size C seat depth tall',
      'Herman Miller Aeron tall 6 foot',
      'Aeron size C long term review',
    ],
    comparisonSearches: [
      'Aeron vs Leap Plus tall',
      'Aeron vs Gesture tall person',
    ],
    subredditScopes: ['officechairs', 'Ergonomics', 'homeoffice', 'WorkFromHome'],
    aliases: ['herman miller aeron', 'aeron size c', 'aeron chair', 'miller aeron'],
    postDateLimitDefault: '2022-01-01',
    commentDateLimitDefault: '2022-01-01',
  },
  {
    chairId: 'steelcase-leap-plus',
    brand: 'Steelcase',
    model: 'Leap Plus',
    reviewPath: '/review/leap-plus/',
    searches: [
      'Steelcase Leap Plus tall',
      'Steelcase Leap Plus review tall person',
      'Steelcase Leap Plus seat depth',
      'Leap Plus tall user 6 foot',
      'Steelcase Leap Plus long term',
    ],
    comparisonSearches: [
      'Leap Plus vs Aeron tall',
      'Leap Plus vs Gesture tall person',
    ],
    subredditScopes: ['officechairs', 'Ergonomics', 'homeoffice', 'WorkFromHome'],
    aliases: ['steelcase leap plus', 'leap plus chair', 'leap plus office chair'],
    postDateLimitDefault: '2022-01-01',
    commentDateLimitDefault: '2022-01-01',
  },
];

export function getChairById(chairId: string): ChairRegistryEntry | undefined {
  return CHAIR_REGISTRY.find((c) => c.chairId === chairId);
}
