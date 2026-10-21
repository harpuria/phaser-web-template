export type PlatformTarget = 'crazygames' | 'standalone';

/** Validate both environment configuration and explicit platform build modes. */
export function resolvePlatformTarget(
  value: unknown,
  mode?: string,
): PlatformTarget {
  if (value !== undefined && value !== 'crazygames' && value !== 'standalone') {
    throw new Error('VITE_PLATFORM must be "crazygames" or "standalone"');
  }
  const explicit =
    mode === 'crazygames' || mode === 'standalone' ? mode : undefined;
  if (explicit && value !== undefined && value !== explicit) {
    throw new Error(`VITE_PLATFORM=${value} conflicts with --mode ${explicit}`);
  }
  return explicit ?? value ?? 'crazygames';
}
