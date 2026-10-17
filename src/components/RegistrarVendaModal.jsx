import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import { currencyFormat } from '../data/financeiro.js'

const inputClassName = 'h-10 w-full border border-[#d9d4c9] bg-white px-3 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[#5d5a50]'

function RegistrarVendaModal({ onClose, onSave }) {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    apiRequest('/produtos')
      .then(({ data }) => {
        if (!isCurrent) return
        setProducts(data)
        if (data[0]) {
          setProductId(String(data[0].id))
          setUnitPrice(String(data[0].precoVenda))
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  const product = products.find((item) => String(item.id) === productId)
  const quantityValue = Number(quantity) || 0
  const saleTotal = quantityValue * (Number(unitPrice) || 0)
  const unitCost = product?.fichaTecnica.reduce(
    (total, part) => total + part.quantidadeNecessaria * part.insumo.custoUnitario,
    0,
  ) ?? 0
  const estimatedCost = quantityValue * unitCost

  function handleProductChange(event) {
    const nextProduct = products.find((item) => String(item.id) === event.target.value)
    setProductId(event.target.value)
    setUnitPrice(String(nextProduct?.precoVenda ?? ''))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await onSave({
        produtoId: Number(productId),
        quantidade: quantityValue,
        valorUnitario: Number(unitPrice),
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
        aria-labelledby="sale-modal-title"
        aria-modal="true"
        className="w-full border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-lg"
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-[#e6e1d7] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">
              Caixa do ateliê
            </p>
            <h2 className="mt-1 font-serif text-xl text-[#302e27]" id="sale-modal-title">
              Registrar nova venda
            </h2>
          </div>
          <button
            aria-label="Fechar venda"
            className="border border-[#ded9ce] px-3 py-1.5 text-xs font-medium text-[#625f54] transition hover:bg-[#f0eee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#68745b]"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
            <label className="sm:col-span-2">
              <span className={labelClassName}>Peça vendida</span>
              <select
                className={inputClassName}
                disabled={isLoading || products.length === 0}
                onChange={handleProductChange}
                required
                value={productId}
              >
                {isLoading && <option value="">A carregar produtos...</option>}
                {!isLoading && products.length === 0 && <option value="">Nenhum produto disponível</option>}
                {products.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome} · {item.estoqueQtd} un. disponíveis</option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClassName}>Quantidade</span>
              <input
                className={inputClassName}
                max={product?.estoqueQtd}
                min="1"
                onChange={(event) => setQuantity(event.target.value)}
                required
                step="1"
                type="number"
                value={quantity}
              />
            </label>
            <label>
              <span className={labelClassName}>Preço unitário (R$)</span>
              <input
                className={inputClassName}
                min="0.01"
                onChange={(event) => setUnitPrice(event.target.value)}
                required
                step="0.01"
                type="number"
                value={unitPrice}
              />
            </label>
            <div className="sm:col-span-2 grid grid-cols-2 gap-3 border-t border-[#e6e1d7] pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Total da venda</p>
                <p className="mt-1 text-base font-semibold text-[#3f4a36]">{currencyFormat.format(saleTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Custo estimado</p>
                <p className="mt-1 text-base font-semibold text-[#625f54]">{currencyFormat.format(estimatedCost)}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
          </div>
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
              disabled={isLoading || isSaving || !product}
              type="submit"
            >
              {isSaving ? 'A registrar...' : 'Confirmar venda'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default RegistrarVendaModal
