/**
 * Refund API service — routes passenger refunds through the real soole-backend
 * organization trips endpoint (organization_trips_api.py).
 */
import { organizationApi } from '../api/client'

export interface RefundPayload {
  tripId: string
  passengerId: string
  passengerName: string
  amount: number
  reason: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  message?: string
}

/**
 * POST /organizations/:orgUuid/trips/:tripId/passengers/:passengerId/refund
 */
export async function requestRefund(payload: RefundPayload): Promise<RefundResponse> {
  const orgUuid = localStorage.getItem('org_uuid')
  if (!orgUuid) throw new Error('No organization selected')

  const res: any = await organizationApi.refundPassenger(orgUuid, payload.tripId, payload.passengerId, {
    reason: payload.reason,
    amount: payload.amount,
  })

  return {
    success: true,
    refundId: res.refund_id,
    message: res.detail,
  }
}
