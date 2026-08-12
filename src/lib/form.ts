import { zodResolver } from '@hookform/resolvers/zod'

export function typedZodResolver(schema: any): any {
  return zodResolver(schema)
}
