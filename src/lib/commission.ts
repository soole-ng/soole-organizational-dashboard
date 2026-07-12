/**
 * Mirrors payments.services.commission (soole-backend) exactly - keep both
 * in sync if the tier structure ever changes.
 *
 * Soole's platform commission on a fare:
 *   - fare <= 20,000: 10% of the fare
 *   - fare > 20,000: a flat 2,500, regardless of how far above 20,000
 */
export const COMMISSION_TIER_THRESHOLD = 20000
export const COMMISSION_TIER_LOW_RATE = 0.10
export const COMMISSION_TIER_HIGH_FLAT_FEE = 2500

export function calculateSooleCommission(fare: number): number {
  const commission = fare <= COMMISSION_TIER_THRESHOLD
    ? fare * COMMISSION_TIER_LOW_RATE
    : COMMISSION_TIER_HIGH_FLAT_FEE
  return Math.round(commission * 100) / 100
}

/**
 * Inverse of calculateSooleCommission - given the amount an org actually
 * wants to net (after Soole's commission), returns the fare that must be
 * charged to the passenger to achieve it.
 */
export function grossFareForDesiredNet(desiredNet: number): number {
  const netAtThreshold = COMMISSION_TIER_THRESHOLD * (1 - COMMISSION_TIER_LOW_RATE)
  const fare = desiredNet <= netAtThreshold
    ? desiredNet / (1 - COMMISSION_TIER_LOW_RATE)
    : desiredNet + COMMISSION_TIER_HIGH_FLAT_FEE
  return Math.round(fare * 100) / 100
}
