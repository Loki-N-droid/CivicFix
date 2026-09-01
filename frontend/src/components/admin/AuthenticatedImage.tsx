import { useEffect, useState } from 'react'
import api from '../../services/api'

type AuthenticatedImageProps = {
  imageId: number
  alt: string
  className?: string
}

/** Issue images are served behind JWT auth, so a plain <img src> can't load
 * them — the browser won't attach an Authorization header. This fetches the
 * image as a blob through the shared axios instance (which does attach the
 * token) and renders it via a local object URL, revoked on unmount.
 *
 * Each instance is expected to be mounted with a fixed imageId (it's keyed
 * by image id in the gallery it's used from), so no reset-on-change handling
 * is needed beyond the cancellation guard below. */
export default function AuthenticatedImage({ imageId, alt, className }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let currentUrl: string | null = null
    let isCancelled = false

    api
      .get(`/api/v1/issue-images/${imageId}`, { responseType: 'blob' })
      .then((response) => {
        if (isCancelled) return
        currentUrl = URL.createObjectURL(response.data)
        setObjectUrl(currentUrl)
      })
      .catch(() => {
        if (!isCancelled) setHasError(true)
      })

    return () => {
      isCancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [imageId])

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className ?? ''}`}
      >
        Image unavailable
      </div>
    )
  }

  if (!objectUrl) {
    return <div className={`animate-pulse bg-slate-100 ${className ?? ''}`} />
  }

  return <img src={objectUrl} alt={alt} className={className} />
}
