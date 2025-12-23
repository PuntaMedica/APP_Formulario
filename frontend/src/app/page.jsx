// frontend/pages/editor.jsx
'use client'
import { useState, useEffect } from 'react'

export default function Editor() {
  const [previewUrl, setPreviewUrl] = useState('/editar.pdf')
  const [msg, setMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent))
  }, [])

  const handleSelectAndUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      setMsg('⚠️ No seleccionaste ningún PDF.')
      return
    }

    // Previsualiza (solo en desktop)
    if (!isMobile) setPreviewUrl(URL.createObjectURL(file))
    setMsg('')

    // Subir al backend
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: form
    })

    setMsg(res.ok ? 'Documento subido con éxito' : '❌ Error al subir')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NavBar turquesa */}
      <nav className="bg-teal-500 flex items-center justify-between px-6 py-4">
        <img src="/logo.png" alt="Logo" className="h-8" />
        <label className="bg-white text-teal-500 px-4 py-2 rounded cursor-pointer hover:bg-gray-100">
          Subir Documento
          <input
            type="file"
            accept="application/pdf"
            onChange={handleSelectAndUpload}
            className="hidden"
          />
        </label>
      </nav>

      {/* Instrucciones */}
      <div className="px-6 py-4 text-gray-700">
        <p className="mb-2">
          1. Descarga el PDF si estás en móvil, rellénalo nativamente.
        </p>
        <p className="mb-2">
          2. Luego haz clic en <strong>Subir Documento</strong> y selecciona el PDF modificado.
        </p>
      </div>

      {/* Mensaje de estado */}
      {msg && (
        <p className="px-6 text-gray-700 mb-4">{msg}</p>
      )}

      {/* Desktop: visor; Mobile: botón de descarga */}
      <div className="flex-grow px-6 pb-6">
        {isMobile ? (
          <a
            href="/editar.pdf"
            download
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Descargar PDF para editar
          </a>
        ) : (
          <embed
            src={previewUrl}
            type="application/pdf"
            className="w-full h-[90vh] border border-gray-700"
          />
        )}
      </div>
    </div>
  )
}
