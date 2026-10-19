import { MousePointer2, Spline } from 'lucide-react'
import { META } from '../lib/componentTypes'
import { useI18n } from '../i18n/I18nProvider'

export default function Toolbar({ tool, onTool, onAdd }) {
  const { t } = useI18n()
  const type = (id) => ({ id, label: META[id].label, icon: META[id].icon, color: META[id].color })
  const items = [
    { id: 'select', label: t('tool.select'), icon: MousePointer2, color: '#E2E8F0' },
    type('tank'),
    type('pump'),
    type('valve'),
    { id: 'pipe', label: t('tool.pipe'), icon: Spline, color: '#38BDF8' },
    type('junction'),
  ]
  return (
    <aside className="w-[72px] shrink-0 flex flex-col items-center gap-1 py-3 bg-panel border-r border-line">
      {items.map(({ id, label, icon: Icon, color }) => {
        const active = tool === id
        const click = () => (id === 'select' || id === 'pipe' ? onTool(id) : onAdd(id))
        return (
          <button
            key={id}
            onClick={click}
            title={label}
            className={`group w-14 py-2 flex flex-col items-center gap-1 rounded-xl text-[11px] transition ${
              active
                ? 'bg-water text-white shadow-[0_0_14px_rgba(14,165,233,.4)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            <Icon
              size={22}
              style={{ color: active ? '#fff' : color }}
              className="group-hover:scale-110 transition"
            />
            {label}
          </button>
        )
      })}
    </aside>
  )
}
