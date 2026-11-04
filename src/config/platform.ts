export type PlatformTarget = 'crazygames' | 'standalone';

/**
 * Validate both environment configuration and explicit platform build modes.
 * `requireExplicit` is set for production builds so a deploy never silently picks a host.
 */
export function resolvePlatformTarget(
  value: unknown,
  mode?: string,
  requireExplicit = false,
): PlatformTarget {
  if (value !== undefined && value !== 'crazygames' && value !== 'standalone') {
    throw new Error('VITE_PLATFORM must be "crazygames" or "standalone"');
  }
  const explicit =
    mode === 'crazygames' || mode === 'standalone' ? mode : undefined;
  if (explicit && value !== undefined && value !== explicit) {
    throw new Error(`VITE_PLATFORM=${value} conflicts with --mode ${explicit}`);
  }
  if (requireExplicit && !explicit && value === undefined) {
    throw new Error(
      'Choose a deployment target: npm run build:crazygames or npm run build:standalone (or set VITE_PLATFORM)',
    );
  }
  return explicit ?? value ?? 'crazygames';
}
