interface EditorSubnavProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}

export function EditorSubnav({ tabs, active, onChange }: EditorSubnavProps) {
  return (
    <div
      className="editor-subnav sticky top-14 z-20 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            active === tab.id
              ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
