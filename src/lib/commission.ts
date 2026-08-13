/**
 * Mirrors payments.services.commission (soole-backend) exactly - keep both
 * in sync if the tier structure ever changes.
 *
 * Soole's commission is charged to the passenger on top of the price an org
 * or driver sets. They receive their price in full; the passenger pays
 * price + commission as a single amount.
 *
 *   - price <= 20,000: Soole keeps 10% of *what the passenger pays*
 *   - price >  20,000: a flat 2,500, regardless of how far above 20,000
 *
 * The rate applies to the total, not to the price. Those are different
 * numbers: 10% of a 200 price is 20, but 20 out of the resulting 220 is only
 * 9.09%. Grossing up first gives a true tenth - 222.23 charged, 22.23 kept.
 */
export const COMMISSION_TIER_THRESHOLD = 20000
export const COMMISSION_TIER_LOW_RATE = 0.10
export const COMMISSION_TIER_HIGH_FLAT_FEE = 2500

export function calculateSooleCommission(fare: number): number {
  const commission = fare <= COMMISSION_TIER_THRESHOLD
    ? fare / (1 - COMMISSION_TIER_LOW_RATE) - fare
    : COMMISSION_TIER_HIGH_FLAT_FEE
  // Rounded UP to the kobo, matching the backend's ROUND_CEILING. Rounded to
  // nearest here and up there, the fare shown on this screen would disagree
  // with the one the passenger is actually charged by a kobo.
  return Math.ceil(commission * 100) / 100
}

/**
 * What a passenger is charged for an org to walk away with `desiredNet`.
 *
 * Defined as net + commission(net) rather than as its own formula, matching
 * gross_fare_for_desired_net in the backend. It used to carry a parallel
 * derivation with its own tier boundary and rounding - two places to change,
 * and two chances for this screen to quote a figure that is not the one
 * charged.
 *
 * NOTE: this is for DISPLAY only. Do not send it as price_per_seat. The
 * backend adds the commission itself at checkout, so a grossed-up price
 * would have the commission applied to it a second time.
 */
export function grossFareForDesiredNet(desiredNet: number): number {
  return desiredNet + calculateSooleCommission(desiredNet)
}
