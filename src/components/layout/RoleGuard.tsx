import { Navigate } from 'react-router-dom'
import { useOrg, type OrgRole } from '../../lib/OrgContext'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: JSX.Element
  allowedRoles: Array<OrgRole>
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { org } = useOrg()

  const isAllowed = allowedRoles.includes(org.role)

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
