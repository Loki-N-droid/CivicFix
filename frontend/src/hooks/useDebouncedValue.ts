import { useEffect, useState } from 'react'

/** Returns `value`, updated only after it has stopped changing for `delayMs`.
 * Used for the issues search box so typing doesn't fire a request per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
