import type { IssueStatus } from '../../types/issue'
import { STATUS_LABELS, STATUS_COLORS } from './chartTheme'

export default function StatusBadge({ status }: { status: IssueStatus }) {
  const color = STATUS_COLORS[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUS_LABELS[status]}
    </span>
  )
}
