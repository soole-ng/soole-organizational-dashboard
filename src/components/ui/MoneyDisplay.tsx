import { clsx } from 'clsx'
import { formatMoney } from '../../lib/formatters'

interface MoneyDisplayProps {
  amount: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showSign?: boolean
  muted?: boolean
}

const sizeMap = {
  xs:  'text-xs',
  sm:  'text-sm',
  md:  'text-base',
  lg:  'text-lg font-semibold',
  xl:  'text-2xl font-bold',
  '2xl': 'text-4xl font-bold',
}

export function MoneyDisplay({ amount, size = 'md', className, showSign, muted }: MoneyDisplayProps) {
  const isNegative = amount < 0
  const formatted = formatMoney(Math.abs(amount))
  const sign = showSign ? (isNegative ? '−' : '+') : (isNegative ? '−' : '')

  return (
    <span
      className={clsx(
        'stat-number tabular-nums',
        sizeMap[size],
        muted && 'text-neutral-200',
        !muted && isNegative && 'text-danger',
        !muted && !isNegative && 'text-primary-500',
        className,
      )}
    >
      {sign}{formatted}
    </span>
  )
}

interface CommissionRowProps {
  gross: number
  commission: number
  net: number
  className?: string
}

export function CommissionRow({ gross, commission, net, className }: CommissionRowProps) {
  return (
    <div className={clsx('grid grid-cols-3 gap-2 text-xs', className)}>
      <div className="text-center">
        <p className="text-neutral-200 mb-0.5">Gross</p>
        <p className="font-semibold text-primary-500 stat-number">{formatMoney(gross)}</p>
      </div>
      <div className="text-center border-x border-neutral-50">
        <p className="text-neutral-200 mb-0.5">Commission (8%)</p>
        <p className="font-semibold text-danger stat-number">−{formatMoney(commission)}</p>
      </div>
      <div className="text-center">
        <p className="text-neutral-200 mb-0.5">You Receive</p>
        <p className="font-semibold text-secondary-300 stat-number">{formatMoney(net)}</p>
      </div>
    </div>
  )
}
