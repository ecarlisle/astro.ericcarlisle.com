import astroPoster from '@images/talk-astro-choose-your-own-adventure.jpg';
import d3Poster from '@images/talk-d3-nationjs-2014.jpg';
import flexboxPoster from '@images/talk-flexbox-devnexus-2015.jpg';
import responsiveDesignPoster from '@images/talk-responsive-design-devnexus-2015.jpg';
import type { ImageMetadata } from 'astro';

export type Talk = {
  videoId: string;
  title: string;
  event: string;
  year: number;
  uploadDate: string;
  duration: string;
  description: string;
  poster: ImageMetadata;
  featured: boolean;
  archival: boolean;
  eventDate?: string;
  eventUrl?: string;
};

export type ResolvedTalk = Omit<Talk, 'poster'> & {
  thumbnailUrl: string;
};

export const talks = [
  {
    videoId: 'cW4-WJq8WbE',
    title: 'Choose Your Own Adventure with Astro',
    event: 'CFE.dev Meetup',
    year: 2024,
    uploadDate: '2024-09-11',
    duration: 'PT48M12S',
    description:
      'A practical tour of Astro’s islands architecture, multi-framework component support, and rendering options.',
    poster: astroPoster,
    featured: true,
    archival: false,
    eventDate: '2024-09-10',
    eventUrl: 'https://cfe.dev/events/choose-your-adventure-astro/',
  },
  {
    videoId: 'VAclokb-vsE',
    title: 'Responsive Design: Planning, Execution & Management with Bootstrap 3',
    event: 'DevNexus',
    year: 2015,
    uploadDate: '2019-06-02',
    duration: 'PT1H5M43S',
    description:
      'A session on planning, producing, and maintaining responsive sites with Bootstrap 3, including mobile-first workflows and performance.',
    poster: responsiveDesignPoster,
    featured: false,
    archival: true,
  },
  {
    videoId: 'qqBVjr0dabM',
    title: 'Ridiculously Easy Layouts with Flexbox',
    event: 'DevNexus',
    year: 2015,
    uploadDate: '2017-10-19',
    duration: 'PT1H4M23S',
    description:
      'An introduction to building page layouts with CSS Flexbox, presented at DevNexus 2015.',
    poster: flexboxPoster,
    featured: false,
    archival: true,
  },
  {
    videoId: 'WEB3UMzbIt0',
    title: 'Dazzling Data Depiction with D3.JS',
    event: 'NationJS',
    year: 2014,
    uploadDate: '2019-06-02',
    duration: 'PT24M12S',
    description:
      'An introduction to D3.js for standards-based data visualization with HTML, CSS, SVG, and the DOM.',
    poster: d3Poster,
    featured: false,
    archival: true,
  },
] as const satisfies readonly Talk[];

export const featuredTalk = talks[0];
export const earlierTalks = talks.slice(1);
