import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx'

const currencyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })
const inputClassName = 'h-10 w-full border border-[#d9d4c9] bg-white px-3 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[#5d5a50]'

function NewInsumoModal({ categorySuggestions, insumo, onClose, onSaved }) {
  const isEditing = Boolean(insumo)
  const [form, setForm] = useState(() => ({
    nome: insumo?.nome ?? '',
    categoria: insumo?.categoria ?? 'Pedras Naturais',
    quantidade: String(insumo?.quantidade ?? 0),
    unidadeMedida: insumo?.unidadeMedida ?? 'g',
    custoUnitario: String(insumo?.custoUnitario ?? 0),
    estoqueMinimo: String(insumo?.estoqueMinimo ?? 0),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const { data } = await apiRequest(isEditing ? `/insumos/${insumo.id}` : '/insumos', {
        method: isEditing ? 'PUT' : 'POST',
        body: {
          ...form,
          quantidade: Number(form.quantidade),
          custoUnitario: Number(form.custoUnitario),
          estoqueMinimo: Number(form.estoqueMinimo),
        },
      })
      onSaved(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#27251f]/45 sm:items-center sm:p-5">
      <section
        aria-labelledby="new-insumo-title"
        aria-modal="true"
        className="max-h-[94vh] w-full overflow-y-auto border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-xl"
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-[#e6e1d7] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Cadastro de estoque</p>
            <h2 className="mt-1 font-serif text-xl text-[#302e27]" id="new-insumo-title">
              {isEditing ? 'Editar insumo' : 'Novo insumo'}
            </h2>
          </div>
          <button
            aria-label="Fechar cadastro de insumo"
            className="border border-[#ded9ce] px-3 py-1.5 text-xs font-medium text-[#625f54] hover:bg-[#f0eee8]"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
            <label className="sm:col-span-2">
              <span className={labelClassName}>Nome do insumo</span>
              <input className={inputClassName} onChange={(event) => updateField('nome', event.target.value)} required value={form.nome} />
            </label>
            <label>
              <span className={labelClassName}>Categoria</span>
              <input className={inputClassName} list="insumo-category-suggestions" onChange={(event) => updateField('categoria', event.target.value)} required value={form.categoria} />
              <datalist id="insumo-category-suggestions">
                {categorySuggestions.map((item) => <option key={item} value={item} />)}
              </datalist>
            </label>
            <label>
              <span className={labelClassName}>Unidade de medida</span>
              <select className={inputClassName} onChange={(event) => updateField('unidadeMedida', event.target.value)} value={form.unidadeMedida}>
                {['g', 'kg', 'ml', 'l', 'un.', 'm'].map((unit) => <option key={unit}>{unit}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClassName}>Quantidade atual</span>
              <input className={inputClassName} min="0" onChange={(event) => updateField('quantidade', event.target.value)} required step="any" type="number" value={form.quantidade} />
            </label>
            <label>
              <span className={labelClassName}>Custo unitário (R$)</span>
              <input className={inputClassName} min="0" onChange={(event) => updateField('custoUnitario', event.target.value)} required step="0.01" type="number" value={form.custoUnitario} />
            </label>
            <label>
              <span className={labelClassName}>Estoque mínimo</span>
              <input className={inputClassName} min="0" onChange={(event) => updateField('estoqueMinimo', event.target.value)} required step="any" type="number" value={form.estoqueMinimo} />
            </label>
            {error && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-[#e6e1d7] bg-[#f7f5f0] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button className="h-10 border border-[#d6d0c4] px-5 text-sm font-medium text-[#625f54] hover:bg-white" onClick={onClose} type="button">Cancelar</button>
            <button className="h-10 bg-[#59664d] px-5 text-sm font-semibold text-white hover:bg-[#49563e] disabled:opacity-60" disabled={isSaving} type="submit">
              {isSaving ? 'A guardar...' : isEditing ? 'Guardar alterações' : 'Guardar insumo'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function Insumos({ refreshKey = 0, onDataChanged = () => {} }) {
  const [insumos, setInsumos] = useState([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState(null)
  const [insumoToDelete, setInsumoToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    apiRequest('/insumos')
      .then(({ data }) => {
        if (isCurrent) setInsumos(data)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [refreshKey])

  const filteredInsumos = insumos.filter((item) => (
    `${item.nome} ${item.categoria}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  ))
  const categorySuggestions = [...new Set([
    'Pedras Naturais',
    ...insumos.map((item) => item.categoria).filter(Boolean),
  ])].sort((first, second) => first.localeCompare(second, 'pt-BR'))
  const lowStockCount = insumos.filter((item) => item.quantidade <= item.estoqueMinimo).length
  const inventoryValue = insumos.reduce((total, item) => total + item.quantidade * item.custoUnitario, 0)

  function handleSaved(insumo) {
    setInsumos((current) => [
      ...current.filter((item) => item.id !== insumo.id),
      insumo,
    ].sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR')))
    setIsModalOpen(false)
    setEditingInsumo(null)
    onDataChanged()
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError('')
    try {
      await apiRequest(`/insumos/${insumoToDelete.id}`, { method: 'DELETE' })
      setInsumos((current) => current.filter((item) => item.id !== insumoToDelete.id))
      setInsumoToDelete(null)
      onDataChanged()
    } catch (requestError) {
      if (requestError.status === 404 || requestError.status === undefined) {
        setInsumos((current) => current.filter((item) => item.id !== insumoToDelete.id))
        setInsumoToDelete(null)
        setError('O insumo foi removido desta lista, mas o servidor não confirmou a exclusão no banco de dados.')
      } else {
        setDeleteError(requestError.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#ded9ce] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Matérias-primas e pedras</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">Insumos &amp; Pedras</h1>
          <p className="mt-2 text-sm text-[#777267]">Cadastro e níveis de estoque salvos localmente.</p>
        </div>
        <button className="h-10 shrink-0 bg-[#59664d] px-4 text-sm font-semibold text-white hover:bg-[#49563e]" onClick={() => { setEditingInsumo(null); setIsModalOpen(true) }} type="button">
          + Novo Insumo
        </button>
      </header>

      {error && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

      <section aria-label="Resumo do estoque" className="mb-5 grid gap-3 sm:grid-cols-3">
        <article className="border border-[#ded9ce] bg-[#fbfaf7] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Insumos cadastrados</p>
          <p className="mt-2 text-xl font-semibold text-[#302e27]">{numberFormat.format(insumos.length)}</p>
        </article>
        <article className="border border-[#ded9ce] bg-[#fbfaf7] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Abaixo do mínimo</p>
          <p className="mt-2 text-xl font-semibold text-[#984f43]">{numberFormat.format(lowStockCount)}</p>
        </article>
        <article className="border border-[#ded9ce] bg-[#fbfaf7] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Valor em estoque</p>
          <p className="mt-2 text-xl font-semibold text-[#526347]">{currencyFormat.format(inventoryValue)}</p>
        </article>
      </section>

      <section className="overflow-hidden border border-[#ded9ce] bg-[#fbfaf7]">
        <header className="flex flex-col gap-3 border-b border-[#e4dfd5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-[#4c4a40]">Lista de Insumos</h2>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Buscar insumo</span>
            <input className={inputClassName} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou categoria..." type="search" value={query} />
          </label>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e4dfd5] bg-[#f2f0e9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777267]">
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3 text-right">Custo unitário</th>
                <th className="px-4 py-3 text-right">Estoque mínimo</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsumos.map((item) => {
                const isLow = item.quantidade <= item.estoqueMinimo
                return (
                  <tr className="border-b border-[#eeeae2] last:border-0" key={item.id}>
                    <td className="px-4 py-3.5 text-sm font-medium text-[#3f3d35]">{item.nome}</td>
                    <td className="px-4 py-3.5 text-sm text-[#777267]">{item.categoria}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-[#4c4a40]">{numberFormat.format(item.quantidade)} {item.unidadeMedida}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-[#625f54]">{currencyFormat.format(item.custoUnitario)} / {item.unidadeMedida}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-[#625f54]">{numberFormat.format(item.estoqueMinimo)} {item.unidadeMedida}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 text-[11px] font-semibold ${isLow ? 'bg-[#f2e3df] text-[#984f43]' : 'bg-[#e5eee3] text-[#496543]'}`}>
                        {isLow ? 'Reposição necessária' : 'Em estoque'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-xs font-semibold text-[#59664d] underline underline-offset-4 hover:text-[#3f4a36]"
                          onClick={() => { setEditingInsumo(item); setIsModalOpen(true) }}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-[#984f43] underline underline-offset-4 hover:text-[#7f4036]"
                          onClick={() => { setDeleteError(''); setInsumoToDelete(item) }}
                          type="button"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && filteredInsumos.length === 0 && (
                <tr><td className="px-4 py-12 text-center text-sm text-[#827b6d]" colSpan="7">{query ? 'Nenhum insumo encontrado.' : 'Ainda não há insumos cadastrados.'}</td></tr>
              )}
              {isLoading && <tr><td className="px-4 py-12 text-center text-sm text-[#827b6d]" colSpan="7">A carregar insumos…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <NewInsumoModal categorySuggestions={categorySuggestions} insumo={editingInsumo} onClose={() => { setIsModalOpen(false); setEditingInsumo(null) }} onSaved={handleSaved} />
      )}
      {insumoToDelete && (
        <ConfirmDeleteModal
          error={deleteError}
          isDeleting={isDeleting}
          message="Tem certeza que deseja excluir este insumo?"
          onCancel={() => setInsumoToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  )
}

export default Insumos
