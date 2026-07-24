'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

// Scan barcode ISBN memakai kamera HP/laptop.
export default function BarcodeScanner({ onDetected }: { onDetected: (isbn: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    return () => { controlsRef.current?.stop() }
  }, [])

  async function start() {
    setError(''); setActive(true)
    try {
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) {
          const text = result.getText().replace(/[^0-9Xx]/g, '')
          if (text.length >= 10) {
            controls.stop(); setActive(false)
            onDetected(text)
          }
        }
      })
      controlsRef.current = controls
    } catch (e: any) {
      setError('Tidak bisa mengakses kamera: ' + (e?.message || e))
      setActive(false)
    }
  }

  function stop() { controlsRef.current?.stop(); setActive(false) }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Kamera mati
          </div>
        )}
        {active && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        {!active ? (
          <button onClick={start} className="btn-primary">📷 Mulai Scan ISBN</button>
        ) : (
          <button onClick={stop} className="btn-outline">Berhenti</button>
        )}
      </div>
      <p className="text-xs text-slate-400">Arahkan kamera ke barcode ISBN di sampul belakang buku.</p>
    </div>
  )
}
