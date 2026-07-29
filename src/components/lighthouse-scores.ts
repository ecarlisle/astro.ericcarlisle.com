/**
 * Type definitions for Lighthouse per-page score data used by the
 * PageQualityFooter component.
 */

export interface LighthousePageScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface LighthousePageData {
  route: string;
  scores: LighthousePageScores;
  timestamp: string | null;
  lighthouseVersion: string | null;
  formFactor: string;
}

export interface LighthouseScoresFile {
  generatedAt: string;
  commitSha: string;
  lighthouseVersion: string | null;
  pages: LighthousePageData[];
}
