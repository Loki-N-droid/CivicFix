import type { PriorityLevel } from '../../types/issue'
import { PRIORITY_LABELS, PRIORITY_COLORS } from './chartTheme'

export default function PriorityBadge({
  priority,
  isOverridden = false,
}: {
  priority: PriorityLevel
  isOverridden?: boolean
}) {
  const color = PRIORITY_COLORS[priority]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
      title={isOverridden ? 'Priority manually overridden by an admin' : undefined}
    >
      {PRIORITY_LABELS[priority]}
      {isOverridden ? <span className="text-[10px] opacity-70">(edited)</span> : null}
    </span>
  )
}
