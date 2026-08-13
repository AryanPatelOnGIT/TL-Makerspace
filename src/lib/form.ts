import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'
import type { z } from 'zod'

export function typedZodResolver<T extends ZodType>(schema: T): Resolver<z.input<T>, unknown, z.output<T>> {
  return zodResolver(schema) as Resolver<z.input<T>, unknown, z.output<T>>
}
