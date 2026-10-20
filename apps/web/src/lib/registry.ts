/**
 * Registry-mode presentation helpers.
 *
 * A reachable RPC is not the same as a signer-ready registry. Keep every label
 * explicit so a simulator record is never described as an on-chain transaction.
 */
export type RegistryTone = 'emerald' | 'cyan' | 'amber';

export function registryModeLabel(mode?: string | null): string {
  switch (mode) {
    case 'ONCHAIN':
      return 'On-chain';
    case 'ONCHAIN_READ_ONLY':
      return 'RPC read-only';
    case 'SIMULATED_FALLBACK':
      return 'Sim fallback';
    case 'LOCAL_SIMULATOR':
      return 'Simulator';
    default:
      return 'Checking…';
  }
}

export function registryModeTone(mode?: string | null): RegistryTone {
  if (mode === 'ONCHAIN') return 'emerald';
  if (mode === 'ONCHAIN_READ_ONLY') return 'cyan';
  return 'amber';
}

export function registryModeTitle(mode?: string | null): string {
  switch (mode) {
    case 'ONCHAIN':
      return 'Sepolia signer configured; new commitments can be broadcast on-chain.';
    case 'ONCHAIN_READ_ONLY':
      return 'Sepolia RPC is readable, but no signer is configured; new commitments use the labelled simulator.';
    case 'SIMULATED_FALLBACK':
      return 'RPC was configured but is unavailable; new commitments use the labelled simulator.';
    case 'LOCAL_SIMULATOR':
      return 'No Sepolia signer is configured; commitments use the deterministic local simulator.';
    default:
      return 'Waiting for the provenance registry mode.';
  }
}
