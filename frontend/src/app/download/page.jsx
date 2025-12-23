// frontend/pages/download.jsx
'use client'
import { useState, useEffect } from 'react'

export default function DownloadPage() {
  const [docs, setDocs] = useState(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [selected, setSelected] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/files')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        console.log('docs:', data)
        setDocs(data)
        const init = {}
        data.forEach(d => { init[d.numero] = false })
        setSelected(init)
      } catch (err) {
        console.error('Error al cargar docs:', err)
        setDocs([])
        setMsg('❌ No se pudieron cargar los documentos')
      }
    })()
  }, [])

  const downloadRange = () => {
    if (!start || !end || start > end) {
      setMsg('⚠️ Rango inválido')
      return
    }
    window.location.href =
      `/api/download?start=${start}&end=${end}`
  }

  const downloadAll = () => {
    window.location.href = `/api/download?start=all`
  }

  const downloadSelected = async () => {
    const nums = Object.entries(selected)
      .filter(([_, v]) => v)
      .map(([k]) => parseInt(k))
    if (nums.length === 0) {
      setMsg('⚠️ Marca al menos uno')
      return
    }
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeros: nums })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'seleccionados.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar seleccionados:', err)
      setMsg('❌ Error al generar ZIP')
    }
  }

  if (docs === null) {
    return <p className="p-6 text-gray-700">Cargando documentos…</p>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NavBar turquesa */}
      <nav className="bg-teal-500 flex items-center justify-between px-6 py-4">
        <img src="/logo.png" alt="Logo" className="h-8" />
        <h1 className="text-white text-xl">Gestor de Descargas</h1>
      </nav>

      <div className="p-6 text-gray-700">
        {msg && <p className="mb-4 text-red-600">{msg}</p>}

        {docs.length === 0 ? (
          <p className="italic">No hay documentos disponibles.</p>
        ) : (
          <>
            {/* Rango */}
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="number"
                placeholder="Del #"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="border border-gray-700 p-2 rounded w-20"
              />
              <span>al</span>
              <input
                type="number"
                placeholder="Al #"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="border border-gray-700 p-2 rounded w-20"
              />
              <button
                onClick={downloadRange}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Descargar rango
              </button>
            </div>

            {/* Todos */}
            <div className="mb-6">
              <button
                onClick={downloadAll}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Descargar todos
              </button>
            </div>

            {/* Selección por checkbox */}
            <div className="mb-4">
              <p className="font-medium mb-2">Seleccionar documentos:</p>
              <div className="grid grid-cols-3 gap-2">
                {docs.map(d => (
                  <label key={d.numero} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selected[d.numero] || false}
                      onChange={e =>
                        setSelected({
                          ...selected,
                          [d.numero]: e.target.checked
                        })
                      }
                      className="accent-teal-500"
                    />
                    <span>#{d.numero} – {d.filename}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={downloadSelected}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Descargar seleccionados
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
