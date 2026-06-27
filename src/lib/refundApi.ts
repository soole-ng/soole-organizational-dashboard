/**
 * Refund API service
 * Sends a refund request to the backend for a passenger on a trip.
 * Replace BASE_URL with your actual API endpoint before going live.
 */

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.soole.ng/v1'

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
 * POST /trips/:tripId/passengers/:passengerId/refund
 * Notifies the backend that this passenger should be refunded.
 */
export async function requestRefund(payload: RefundPayload): Promise<RefundResponse> {
  const { tripId, passengerId, ...body } = payload

  const res = await fetch(
    `${BASE_URL}/trips/${tripId}/passengers/${passengerId}/refund`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth token will be injected here once auth is wired up
        // 'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `Refund request failed (${res.status})`)
  }

  return res.json()
}
