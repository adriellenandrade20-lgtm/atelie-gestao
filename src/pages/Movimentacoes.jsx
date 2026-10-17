import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'

const movementTypes = {
  entrada: {
    label: 'Entrada',
    tag: 'Entrada',
    tagClass: 'bg-[#e5eee3] text-[#496543]',
  },
  saida: {
    label: 'Saída',
    tag: 'Saída/Venda',
    tagClass: 'bg-[#e3ebf3] text-[#456785]',
  },
  perda: {
    label: 'Perda',
    tag: 'Perda/Avaria',
    tagClass: 'bg-[#f2e3df] text-[#984f43]',
  },
}

const inputClassName = 'h-10 w-full border border-[#d9d4c9] bg-white px-3 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[#5d5a50]'

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

function MovementModal({ availableItems, initialType, onClose, onSave }) {
  const [type, setType] = useState(initialType)
  const [itemKey, setItemKey] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitValue, setUnitValue] = useState('')
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedItem = availableItems.find((item) => item.key === itemKey)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await onSave({
        tipo: { entrada: 'ENTRADA', saida: 'SAIDA', perda: 'PERDA' }[type],
        itemTipo: selectedItem.itemTipo,
        itemId: selectedItem.itemId,
        quantidade: Number(quantity),
        valorUnitario: type === 'perda' || !unitValue ? undefined : Number(unitValue),
        motivo: reason.trim(),
      })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#27251f]/45 sm:items-center sm:p-5">
      <section
        aria-labelledby="movement-modal-title"
        aria-modal="true"
        className="max-h-[94vh] w-full overflow-y-auto border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-xl"
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-[#e6e1d7] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">
              Controle de estoque
            </p>
            <h2 className="mt-1 font-serif text-xl text-[#302e27]" id="movement-modal-title">
              Nova movimentação
            </h2>
          </div>
          <button
            aria-label="Fechar movimentação"
            className="border border-[#ded9ce] px-3 py-1.5 text-xs font-medium text-[#625f54] transition hover:bg-[#f0eee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#68745b]"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
            <label>
              <span className={labelClassName}>Tipo de movimentação</span>
              <select
                className={inputClassName}
                onChange={(event) => setType(event.target.value)}
                value={type}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="perda">Perda</option>
              </select>
            </label>

            <label>
              <span className={labelClassName}>Insumo ou produto</span>
              <select
                className={inputClassName}
                disabled={availableItems.length === 0}
                onChange={(event) => setItemKey(event.target.value)}
                required
                value={itemKey}
              >
                <option value="">Selecionar item</option>
                {availableItems.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name} · {item.kind}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClassName}>Quantidade {selectedItem ? `(${selectedItem.unit})` : ''}</span>
              <input
                className={inputClassName}
                min="0.001"
                onChange={(event) => setQuantity(event.target.value)}
                required
                step="any"
                type="number"
                value={quantity}
              />
            </label>

            {type !== 'perda' && (
              <label>
                <span className={labelClassName}>Valor unitário (R$)</span>
                <input
                  className={inputClassName}
                  min="0"
                  onChange={(event) => setUnitValue(event.target.value)}
                  placeholder="Opcional"
                  step="0.01"
                  type="number"
                  value={unitValue}
                />
              </label>
            )}

            <label className="sm:col-span-2">
              <span className={labelClassName}>Motivo / Observação</span>
              <textarea
                className="min-h-24 w-full resize-y border border-[#d9d4c9] bg-white px-3 py-2.5 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15"
                onChange={(event) => setReason(event.target.value)}
                placeholder="Descreva o motivo desta movimentação"
                required
                rows="3"
                value={reason}
              />
            </label>
          </div>

          {error && <p className="px-5 pb-3 text-sm text-red-700 sm:px-7" role="alert">{error}</p>}

          <footer className="flex flex-col-reverse gap-2 border-t border-[#e6e1d7] bg-[#f7f5f0] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              className="h-10 border border-[#d6d0c4] px-5 text-sm font-medium text-[#625f54] transition hover:bg-white"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="h-10 bg-[#59664d] px-5 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99] disabled:opacity-60"
              disabled={isSaving || !selectedItem}
              type="submit"
            >
              {isSaving ? 'A registar...' : 'Registar movimentação'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function Movimentacoes({ refreshKey = 0, onDataChanged = () => {} }) {
  const [movements, setMovements] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [typeFilter, setTypeFilter] = useState('todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [query, setQuery] = useState('')
  const [modalType, setModalType] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      apiRequest('/movimentacoes'),
      apiRequest('/insumos'),
      apiRequest('/produtos'),
    ])
      .then(([movementResponse, insumoResponse, productResponse]) => {
        if (!isCurrent) return
        const items = [
          ...insumoResponse.data.map((item) => ({
            key: `INSUMO:${item.id}`,
            itemId: item.id,
            itemTipo: 'INSUMO',
            name: item.nome,
            kind: 'Insumo/Pedra',
            unit: item.unidadeMedida,
          })),
          ...productResponse.data.map((item) => ({
            key: `PRODUTO:${item.id}`,
            itemId: item.id,
            itemTipo: 'PRODUTO',
            name: item.nome,
            kind: 'Produto Acabado',
            unit: 'un.',
          })),
        ]
        setAvailableItems(items)
        setMovements(movementResponse.data.map((movement) => ({
          id: movement.id,
          date: movement.data,
          type: { ENTRADA: 'entrada', SAIDA: 'saida', PERDA: 'perda' }[movement.tipo],
          itemId: `${movement.itemTipo}:${movement.itemId}`,
          quantity: movement.quantidade,
          reason: movement.motivo,
          responsible: movement.usuario.nome,
        })))
        setLoadError('')
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [refreshKey])

  const filteredMovements = movements.filter((movement) => {
    const item = availableItems.find((entry) => entry.key === movement.itemId)
    const matchesType = typeFilter === 'todos' || movement.type === typeFilter
    const movementDay = movement.date.slice(0, 10)
    const matchesFrom = !dateFrom || movementDay >= dateFrom
    const matchesTo = !dateTo || movementDay <= dateTo
    const searchText = `${item?.name ?? ''} ${item?.kind ?? ''}`.toLocaleLowerCase('pt-BR')
    const matchesQuery = searchText.includes(query.trim().toLocaleLowerCase('pt-BR'))

    return matchesType && matchesFrom && matchesTo && matchesQuery
  })

  async function addMovement(movement) {
    await apiRequest('/movimentacoes', {
      method: 'POST',
      body: movement,
    })
    onDataChanged()
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#ded9ce] pb-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">
            Controle de estoque
          </p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">
            Movimentações de Estoque
          </h1>
          <p className="mt-2 text-sm text-[#777267]">
            Histórico de entradas, saídas e perdas · {movements.length} registos
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <button
            className="h-10 bg-[#59664d] px-4 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99]"
            onClick={() => setModalType('entrada')}
            type="button"
          >
            + Nova Entrada/Saída
          </button>
          <button
            className="h-10 border border-[#c9b9ad] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#87544a] transition hover:bg-[#f3e9e5] active:scale-[0.99]"
            onClick={() => setModalType('perda')}
            type="button"
          >
            + Registrar Perda/Avaria
          </button>
        </div>
      </header>

      {loadError && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{loadError}</p>}

      <section aria-label="Filtros do histórico" className="mb-5 border border-[#ded9ce] bg-[#fbfaf7] p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,0.8fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(220px,1.2fr)]">
          <label>
            <span className={labelClassName}>Tipo</span>
            <select
              className={inputClassName}
              onChange={(event) => setTypeFilter(event.target.value)}
              value={typeFilter}
            >
              <option value="todos">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída/Venda</option>
              <option value="perda">Perda/Avaria</option>
            </select>
          </label>
          <label>
            <span className={labelClassName}>De</span>
            <input
              aria-label="Data inicial"
              className={inputClassName}
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </label>
          <label>
            <span className={labelClassName}>Até</span>
            <input
              aria-label="Data final"
              className={inputClassName}
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </label>
          <label>
            <span className={labelClassName}>Buscar item</span>
            <input
              className={inputClassName}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome do insumo ou produto..."
              type="search"
              value={query}
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="movement-history-title" className="overflow-hidden border border-[#ded9ce] bg-[#fbfaf7]">
        <header className="flex items-center justify-between border-b border-[#e4dfd5] px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-[#4c4a40]" id="movement-history-title">
            Histórico de Movimentações
          </h2>
          <span className="text-xs text-[#827b6d]">{filteredMovements.length} resultados</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e4dfd5] bg-[#f2f0e9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777267]">
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Tipo de Movimentação</th>
                <th className="px-4 py-3">Item Movimentado</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3">Motivo / Observação</th>
                <th className="px-4 py-3">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => {
                const item = availableItems.find((entry) => entry.key === movement.itemId)
                const type = movementTypes[movement.type]

                return (
                  <tr className="border-b border-[#eeeae2] last:border-0" key={movement.id}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#625f54]">
                      {new Date(movement.date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold ${type.tagClass}`}>
                        {type.tag}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-medium text-[#3f3d35]">{item?.name}</span>
                      <span className="mt-0.5 block text-[10px] text-[#918b7e]">{item?.kind}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-[#4c4a40]">
                      {numberFormat.format(movement.quantity)} {item?.unit}
                    </td>
                    <td className="max-w-[240px] px-4 py-3.5 text-sm text-[#625f54]">{movement.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-[#625f54]">{movement.responsible}</td>
                  </tr>
                )
              })}
              {!isLoading && filteredMovements.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-[#827b6d]" colSpan="6">
                    Nenhuma movimentação encontrada para estes filtros.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr><td className="px-4 py-12 text-center text-sm text-[#827b6d]" colSpan="6">A carregar movimentações…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalType && (
        <MovementModal
          availableItems={availableItems}
          initialType={modalType}
          onClose={() => setModalType(null)}
          onSave={addMovement}
        />
      )}
    </section>
  )
}

export default Movimentacoes
