import { Card, CardContent } from '../components/ui/card'

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Дашборд</h2>
        <div className="text-sm text-secondary-foreground/80">Ключевые метрики и состояние системы</div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Всего пользователей', value: '—' },
          { label: 'Активные сегодня', value: '—' },
          { label: 'Новые за неделю', value: '—' },
          { label: 'Завершённые анкеты', value: '—' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="text-xs text-secondary-foreground/80">{m.label}</div>
              <div className="mt-2 text-2xl font-semibold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-secondary-foreground/80">
          Графики/метрики подключим после того, как уточним эндпоинты статистики на FastAPI.
        </CardContent>
      </Card>
    </div>
  )
}

