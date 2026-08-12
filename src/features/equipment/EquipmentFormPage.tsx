import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { typedZodResolver } from '@/lib/form'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/services/firebase/firestore'
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, cleanFirestoreData } from '@/lib/utils'
import type { Equipment } from '@/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/common/FormField'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const equipmentSchema = z.object({
  machineId: z.string().min(2, 'Machine ID required (e.g. laser-cutter)'),
  name: z.string().min(2, 'Name required'),
  tier: z.enum(['bookable', 'checkout', 'freely_available']),
  confirmed: z.boolean().default(false),
  category: z.enum(['Digital Fabrication', 'Heavy Duty', 'Tabletop Power', 'Electronics', 'Other']),
  description: z.string().min(10, 'Description required'),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyInfo: z.string().optional(),
  installationDate: z.string().optional(),
  status: z.enum(['available', 'reserved', 'in_use', 'under_maintenance', 'out_of_service', 'retired']),
  healthStatus: z.enum(['good', 'fair', 'poor']),
  location: z.string().min(1, 'Location required'),
  requiresTraining: z.boolean(),
})
type EquipmentFormData = z.infer<typeof equipmentSchema>

export default function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { isStaff } = useAuth()
  const queryClient = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.EQUIPMENT, id!))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() } as Equipment
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EquipmentFormData>({
    resolver: typedZodResolver(equipmentSchema),
    defaultValues: {
      tier: 'bookable',
      status: 'available',
      healthStatus: 'good',
      requiresTraining: true,
      category: 'Digital Fabrication',
    },
  })

  React.useEffect(() => {
    if (existing) {
      reset({
        machineId: existing.machineId,
        name: existing.name,
        tier: existing.tier,
        category: existing.category as any,
        description: existing.description,
        manufacturer: existing.manufacturer,
        modelNumber: existing.modelNumber,
        serialNumber: existing.serialNumber,
        purchaseDate: existing.purchaseDate,
        warrantyInfo: existing.warrantyInfo,
        installationDate: existing.installationDate,
        status: existing.status as any,
        healthStatus: existing.healthStatus as any,
        location: existing.location,
        requiresTraining: existing.requiresTraining,
      })
    }
  }, [existing, reset])


  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const payload = cleanFirestoreData({
        ...data,
        imageUrls: existing?.imageUrls ?? [],
        manualUrls: existing?.manualUrls ?? [],
        safetyDocUrls: existing?.safetyDocUrls ?? [],
      })
      if (isEdit) {
        await updateDoc(doc(db, COLLECTIONS.EQUIPMENT, id!), payload)
        toast.success('Equipment updated')
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.EQUIPMENT), payload)
        toast.success('Equipment added')
        queryClient.invalidateQueries({ queryKey: ['equipment'] })
        navigate(`/equipment/${docRef.id}`)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      navigate(`/equipment/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const onInvalid = (formErrors: any) => {
    const messages = Object.values(formErrors)
      .map((e: any) => e?.message)
      .filter(Boolean)
    toast.error(`Please fix form errors: ${messages[0] || 'Check required fields'}`)
  }

  if (!isStaff) return <div className="py-16 text-center text-muted-foreground">Admin/staff access required.</div>
  if (isLoading) return <LoadingSpinner text="Loading…" />

  const selectClasses = "flex h-10 w-full rounded-md border border-hairline bg-near-black px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-4 animate-fade-in sm:space-y-6 sm:py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Equipment' : 'Add Equipment'}</h1>
          <p className="text-muted-foreground mt-1">Manage machine details, status, and tracking info.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core identifiers and descriptions for the machine.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Machine ID" required error={errors.machineId?.message}>
              <Input placeholder="e.g. bambu-x1c" {...register('machineId')} className={errors.machineId ? 'border-destructive' : ''} />
            </FormField>
            
            <FormField label="Name" required error={errors.name?.message}>
              <Input placeholder="Bambu X1 Carbon" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
            </FormField>

            <FormField label="Category" required>
              <select className={selectClasses} {...register('category')}>
                {['Digital Fabrication', 'Heavy Duty', 'Tabletop Power', 'Electronics', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Location" required error={errors.location?.message}>
              <Input placeholder="Bay 1, Lab 2" {...register('location')} className={errors.location ? 'border-destructive' : ''} />
            </FormField>

            <FormField label="Description" required error={errors.description?.message} className="col-span-full">
              <Textarea rows={3} placeholder="Brief description of the machine and what it does..." className={cn('resize-none', errors.description ? 'border-destructive' : '')} {...register('description')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Configuration</CardTitle>
            <CardDescription>Current operational status and safety requirements.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Tier" required error={errors.tier?.message}>
              <select className={selectClasses} {...register('tier')}>
                {['bookable', 'checkout', 'freely_available'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </FormField>

            <FormField label="Status" required>
              <select className={selectClasses} {...register('status')}>
                {['available','reserved','in_use','under_maintenance','out_of_service','retired'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </FormField>

            <FormField label="Health Status" required>
              <select className={selectClasses} {...register('healthStatus')}>
                {['good','fair','poor'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>

            <div className="col-span-full flex items-center gap-3 border rounded-md p-4 bg-muted/20">
              <input type="checkbox" id="requiresTraining" {...register('requiresTraining')} className="w-4 h-4 accent-primary" />
              <div className="space-y-1">
                <Label htmlFor="requiresTraining">Requires Training to Operate</Label>
                <p className="text-sm text-muted-foreground">Users must complete certification before booking.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Details (Optional)</CardTitle>
            <CardDescription>Warranty and tracking information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Manufacturer"><Input placeholder="e.g. Bambu Lab" {...register('manufacturer')} /></FormField>
            <FormField label="Model Number"><Input placeholder="X1C-PRO" {...register('modelNumber')} /></FormField>
            <FormField label="Serial Number"><Input placeholder="SN-12345" {...register('serialNumber')} /></FormField>
            <FormField label="Purchase Date"><Input type="date" {...register('purchaseDate')} /></FormField>
            <FormField label="Installation Date"><Input type="date" {...register('installationDate')} /></FormField>
            <FormField label="Warranty Info"><Input placeholder="3 years - expires Jan 2027" {...register('warrantyInfo')} /></FormField>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:justify-end sm:gap-4 sm:pb-8">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save changes' : 'Add equipment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
