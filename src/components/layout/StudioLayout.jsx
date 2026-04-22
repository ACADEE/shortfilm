export default function StudioLayout({ left, center, right }) {
  return (
    <div className="flex flex-1 overflow-hidden divide-x divide-studio-border min-h-0">
      {/* Column 1 — Writing Room */}
      <div className="w-1/3 min-w-0 overflow-y-auto bg-studio-panel">
        {left}
      </div>
      {/* Column 2 — Casting */}
      <div className="w-1/3 min-w-0 overflow-y-auto bg-studio-panel">
        {center}
      </div>
      {/* Column 3 — Filming */}
      <div className="w-1/3 min-w-0 overflow-y-auto bg-studio-panel">
        {right}
      </div>
    </div>
  )
}
