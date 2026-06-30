import { Navigate } from 'react-router-dom'
import { useOrg } from '../../lib/OrgContext'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: JSX.Element
  allowedRoles: Array<'admin' | 'dispatcher' | 'finance'>
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { org } = useOrg()
  const activeRole = org.activeRole || 'admin'

  const isAllowed = allowedRoles.includes(activeRole)

  useEffect(() => {
    if (!isAllowed) {
      toast.error('You do not have permission to access this page.')
    }
  }, [isAllowed])

  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return children
}
