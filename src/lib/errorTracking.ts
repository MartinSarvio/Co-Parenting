/**
 * Error Tracking — logger frontend-fejl til Supabase error_logs tabel.
 *
 * Kør docs/migration-fulltext-search.sql for at oprette error_logs tabellen.
 */

import { supabase } from './supabase';

interface ErrorReport {
  errorType: string;
  message: string;
  stack?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

/** Log fejl til Supabase (non-blocking, fejler stille) */
export async function reportError(report: ErrorReport): Promise<void> {
  try {
    await supabase.from('error_logs').insert({
      error_type: report.errorType,
      message: report.message,
      stack: report.stack?.slice(0, 2000),
      component: report.component,
      url: window.location.href,
      metadata: report.metadata || {},
    });
  } catch {
    // Fejl i error tracking — ignorer for at undgå uendelig loop
  }
}

/** Opsæt globale error handlers */
export function initErrorTracking(): void {
  // Fang ubehandlede fejl
  window.addEventListener('error', (event) => {
    reportError({
      errorType: 'unhandled_error',
      message: event.message,
      stack: event.error?.stack,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Fang ubehandlede promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    reportError({
      errorType: 'unhandled_rejection',
      message: error?.message || String(error),
      stack: error?.stack,
    });
  });
}
