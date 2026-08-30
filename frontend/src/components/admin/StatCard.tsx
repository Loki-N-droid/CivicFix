type StatCardProps = {
  label: string
  value: number
  hint: string
  accentClassName?: string
}

export default function StatCard({ label, value, hint, accentClassName = 'text-slate-900' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${accentClassName}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}
