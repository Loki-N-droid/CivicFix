export default function AdminIssuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Issues
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and manage every citizen report.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">Issue management is on the way</p>
        <p className="mt-1 text-sm text-slate-400">
          The full table with search, filters, and sorting arrives in the next package.
        </p>
      </div>
    </div>
  )
}
