export function stripBlockIds<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value, (key, inner: unknown) => (key === 'blockId' ? undefined : inner)))
}
