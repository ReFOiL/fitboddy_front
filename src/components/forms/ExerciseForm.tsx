import { useState, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { Film, Loader2, Trash2, Upload } from 'lucide-react'

import {
  listContraindications,
  listMuscles,
  queryKeys,
  uploadVideo,
} from '../../api'
import type { ExerciseCreate } from '../../types/workout'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Select } from '../ui/select'

const formSchema = z.object({
  name: z.string().min(1, 'Введите название').max(128),
  description: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(1000).nullable()).optional(),
  video_url: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(500).nullable()).optional(),
  equipment: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(64).nullable()).optional(),
  is_cardio: z.coerce.boolean().default(false),
  difficulty: z.coerce.number().int().min(1).max(5).default(1),
  muscle_ids: z.array(z.number().int()).default([]),
  contraindication_ids: z.array(z.number().int()).default([]),
})

type FormData = z.output<typeof formSchema>

export type ExerciseFormValues = ExerciseCreate

export function ExerciseForm(props: {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ExerciseCreate>
  isSubmitting?: boolean
  onSubmit: (values: ExerciseFormValues) => Promise<void>
}) {
  const musclesQuery = useQuery({
    queryKey: queryKeys.muscles.all,
    queryFn: listMuscles,
    networkMode: 'always',
  })
  const contraindicationsQuery = useQuery({
    queryKey: queryKeys.contraindications.all,
    queryFn: listContraindications,
    networkMode: 'always',
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormData>,
    defaultValues: {
      name: props.defaultValues?.name ?? '',
      description: props.defaultValues?.description ?? null,
      video_url: props.defaultValues?.video_url ?? null,
      equipment: props.defaultValues?.equipment ?? null,
      is_cardio: props.defaultValues?.is_cardio ?? false,
      difficulty: props.defaultValues?.difficulty ?? 1,
      muscle_ids: props.defaultValues?.muscle_ids ?? [],
      contraindication_ids: props.defaultValues?.contraindication_ids ?? [],
    },
  })

  const muscles = musclesQuery.data ?? []
  const contraindications = contraindicationsQuery.data ?? []

  const toggleMuscle = (id: number) => {
    const current = form.getValues('muscle_ids') ?? []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    form.setValue('muscle_ids', next, { shouldDirty: true })
  }

  const toggleContraindication = (id: number) => {
    const current = form.getValues('contraindication_ids') ?? []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    form.setValue('contraindication_ids', next, { shouldDirty: true })
  }

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentVideoKey = form.watch('video_url')

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (ext !== '.mp4' && ext !== '.mov') {
      toast.error('Разрешены только .mp4 и .mov')
      return
    }
    setUploading(true)
    try {
      const { object_key } = await uploadVideo(file)
      form.setValue('video_url', object_key, { shouldDirty: true })
      toast.success('Видео загружено')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clearVideo = () => {
    form.setValue('video_url', null, { shouldDirty: true })
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={form.handleSubmit(async (raw) => {
        const values: ExerciseFormValues = {
          name: raw.name.trim(),
          description: raw.description ?? null,
          video_url: raw.video_url ?? null,
          equipment: raw.equipment ?? null,
          is_cardio: raw.is_cardio,
          difficulty: raw.difficulty,
          muscle_ids: raw.muscle_ids,
          contraindication_ids: raw.contraindication_ids,
        }
        await props.onSubmit(values)
      })}
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <label className="text-sm">Название</label>
            <Input {...form.register('name')} placeholder="Например: Жим лёжа" />
            {form.formState.errors.name?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.name.message}</div>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm">Описание</label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              {...form.register('description')}
              placeholder="Краткое описание упражнения…"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm">Видео</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov"
              className="hidden"
              onChange={handleVideoFile}
              disabled={uploading}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Загрузка…' : 'Загрузить видео'}
              </Button>
              {currentVideoKey ? (
                <>
                  <span className="flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/15 px-2.5 py-1.5 text-sm text-secondary-foreground/90">
                    <Film className="h-4 w-4 shrink-0" />
                    Видео загружено
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearVideo}
                    className="text-destructive hover:text-destructive"
                    aria-label="Удалить видео"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
            <p className="text-xs text-secondary-foreground/70">Форматы: .mp4, .mov (макс. 50 МБ)</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm">Оборудование</label>
              <Input {...form.register('equipment')} placeholder="штанга, гантели…" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Сложность (1–5)</label>
              <Select
                value={String(form.watch('difficulty'))}
                onValueChange={(v) => form.setValue('difficulty', Number(v), { shouldDirty: true })}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...form.register('is_cardio')} />
            Кардио
          </label>

          <div className="space-y-2">
            <div className="text-sm font-medium">Мышцы</div>
            {musclesQuery.isLoading && (
              <div className="text-xs text-secondary-foreground/80">Загрузка…</div>
            )}
            <div className="flex flex-wrap gap-2">
              {muscles.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 bg-secondary/15 px-3 py-2 text-sm transition-colors hover:bg-secondary/25"
                >
                  <input
                    type="checkbox"
                    checked={(form.watch('muscle_ids') ?? []).includes(m.id)}
                    onChange={() => toggleMuscle(m.id)}
                  />
                  {m.name}
                </label>
              ))}
              {muscles.length === 0 && !musclesQuery.isLoading && (
                <span className="text-sm text-secondary-foreground/70">Нет мышечных групп в справочнике</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Противопоказания</div>
            {contraindicationsQuery.isLoading && (
              <div className="text-xs text-secondary-foreground/80">Загрузка…</div>
            )}
            <div className="flex flex-wrap gap-2">
              {contraindications.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 bg-secondary/15 px-3 py-2 text-sm transition-colors hover:bg-secondary/25"
                >
                  <input
                    type="checkbox"
                    checked={(form.watch('contraindication_ids') ?? []).includes(c.id)}
                    onChange={() => toggleContraindication(c.id)}
                  />
                  {c.name}
                </label>
              ))}
              {contraindications.length === 0 && !contraindicationsQuery.isLoading && (
                <span className="text-sm text-secondary-foreground/70">Нет противопоказаний в справочнике</span>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={Boolean(props.isSubmitting)}>
            {props.mode === 'create' ? 'Создать упражнение' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
