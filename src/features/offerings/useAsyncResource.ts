import { useCallback, useEffect, useRef, useState } from 'react'
import { isApiError } from '@/api'

export type AsyncStatus = 'loading' | 'error' | 'success'

export type AsyncResource<TData> = {
  status: AsyncStatus
  data: TData | null
  errorMessage: string
  reload: () => void
}

type SettledRequest<TData> = {
  load: () => Promise<TData>
  attempt: number
  data: TData | null
  errorMessage: string
}

const FALLBACK_ERROR_MESSAGE = 'Something went wrong while loading. Please try again.'

function toErrorMessage(error: unknown): string {
  return isApiError(error) ? error.message : FALLBACK_ERROR_MESSAGE
}

export function useAsyncResource<TData>(load: () => Promise<TData>): AsyncResource<TData> {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledRequest<TData> | null>(null)
  const latestRequestId = useRef(0)

  useEffect(() => {
    const requestId = latestRequestId.current + 1
    latestRequestId.current = requestId
    let subscribed = true

    const settle = (data: TData | null, errorMessage: string) => {
      if (!subscribed || latestRequestId.current !== requestId) {
        return
      }

      setSettled({ load, attempt, data, errorMessage })
    }

    load()
      .then((data) => settle(data, ''))
      .catch((error: unknown) => settle(null, toErrorMessage(error)))

    return () => {
      subscribed = false
    }
  }, [load, attempt])

  const reload = useCallback(() => {
    setAttempt((previous) => previous + 1)
  }, [])

  const isSettled = settled !== null && settled.load === load && settled.attempt === attempt

  if (!isSettled) {
    return { status: 'loading', data: null, errorMessage: '', reload }
  }

  return {
    status: settled.errorMessage ? 'error' : 'success',
    data: settled.data,
    errorMessage: settled.errorMessage,
    reload,
  }
}
