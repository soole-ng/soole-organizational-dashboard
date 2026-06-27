import { Car, Bus, CheckCircle2, Clock, XCircle } from 'lucide-react'

export function VehicleIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'Hiace' || type === 'Coaster') return <Bus className={className} />
  return <Car className={className} />
}

export function docStatusIcon(status: string) {
  if (status === 'approved') return <CheckCircle2 className="w-3 h-3 text-secondary-300" />
  if (status === 'pending' || status === 'uploaded') return <Clock className="w-3 h-3 text-warning" />
  return <XCircle className="w-3 h-3 text-warning" />
}
