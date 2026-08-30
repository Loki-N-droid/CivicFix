export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Categories
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage issue categories and their priority weights.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">Category management is on the way</p>
        <p className="mt-1 text-sm text-slate-400">
          Create, edit, and activate/deactivate categories arrives in a later package.
        </p>
      </div>
    </div>
  )
}
