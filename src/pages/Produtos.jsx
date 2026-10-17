import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

const categories = ['Luminárias', 'Esculturas', 'Acessórios', 'Decoração']
const inputClassName = 'h-10 w-full border border-[#d9d4c9] bg-white px-3 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[#5d5a50]'

function ProductModal({ categorySuggestions, insumos, product, onClose, onSave }) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? categories[0])
  const [description, setDescription] = useState(product?.description ?? '')
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ''))
  const [imageUrl, setImageUrl] = useState(product?.image ?? '')
  const [stock, setStock] = useState(String(product?.stock ?? 0))
  const [composition, setComposition] = useState(() => (
    product
      ? product.recipe.map((part) => ({
        id: part.id,
        materialId: String(part.id),
        quantity: String(part.quantityNeeded),
      }))
      : [{ id: 1, materialId: '', quantity: '1' }]
  ))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const materials = insumos.map((insumo) => ({
    id: String(insumo.id),
    name: insumo.nome,
    unit: insumo.unidadeMedida,
    unitCost: insumo.custoUnitario,
  }))

  const productionCost = composition.reduce((total, item) => {
    const material = materials.find((entry) => entry.id === item.materialId)
    return total + (material?.unitCost ?? 0) * (Number(item.quantity) || 0)
  }, 0)
  const saleValue = Number(salePrice) || 0
  const profitMargin = saleValue > 0
    ? ((saleValue - productionCost) / saleValue) * 100
    : 0

  function updateComposition(id, field, value) {
    setComposition((current) => current.map((item) => (
      item.id === id ? { ...item, [field]: value } : item
    )))
  }

  function addMaterial() {
    setComposition((current) => [
      ...current,
      { id: Date.now() + current.length, materialId: '', quantity: '1' },
    ])
  }

  function removeMaterial(id) {
    setComposition((current) => current.filter((item) => item.id !== id))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveError('')
    try {
      await onSave({
        nome: name.trim(),
        categoria: category,
        descricao: description.trim(),
        precoVenda: saleValue,
        estoqueQtd: Number(stock) || 0,
        imagemUrl: imageUrl.trim() || null,
        fichaTecnica: composition.map((item) => ({
          insumoId: Number(item.materialId),
          quantidadeNecessaria: Number(item.quantity) || 0,
        })),
      })
      onClose()
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#27251f]/45 sm:items-center sm:p-5">
      <section
        aria-labelledby="product-modal-title"
        aria-modal="true"
        className="max-h-[94vh] w-full overflow-y-auto border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-3xl"
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e6e1d7] bg-[#fbfaf7] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">
              Catálogo de peças
            </p>
            <h2 className="mt-1 font-serif text-xl text-[#302e27]" id="product-modal-title">
              {product ? 'Editar Produto' : 'Novo produto'}
            </h2>
          </div>
          <button
            aria-label="Fechar cadastro"
            className="border border-[#ded9ce] px-3 py-1.5 text-xs font-medium text-[#625f54] transition hover:bg-[#f0eee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#68745b]"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="border-b border-[#e6e1d7] px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#4c4a40]">Dados Gerais</h3>
              <span className="text-[11px] text-[#969084]">Informações da peça</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClassName}>Nome da peça</span>
                <input
                  className={inputClassName}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Luminária Aurora"
                  required
                  value={name}
                />
              </label>
              <label>
                <span className={labelClassName}>Categoria</span>
                <input
                  className={inputClassName}
                  list="product-category-suggestions"
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  value={category}
                />
                <datalist id="product-category-suggestions">
                  {categorySuggestions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
              <label>
                <span className={labelClassName}>Preço de Venda (R$)</span>
                <input
                  className={inputClassName}
                  min="0.01"
                  onChange={(event) => setSalePrice(event.target.value)}
                  placeholder="0,00"
                  required
                  step="0.01"
                  type="number"
                  value={salePrice}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClassName}>Descrição</span>
                <textarea
                  className="min-h-20 w-full resize-y border border-[#d9d4c9] bg-white px-3 py-2.5 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Materiais, acabamento ou detalhes da peça"
                  rows="2"
                  value={description}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClassName}>Foto da peça (URL opcional)</span>
                <input
                  className={inputClassName}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="Cole aqui o endereço da sua foto"
                  type="url"
                  value={imageUrl}
                />
              </label>
              <label>
                <span className={labelClassName}>{product ? 'Estoque atual' : 'Estoque Inicial'}</span>
                <input
                  className={inputClassName}
                  min="0"
                  onChange={(event) => setStock(event.target.value)}
                  required
                  type="number"
                  value={stock}
                />
              </label>
            </div>
          </section>

          <section className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#4c4a40]">Ficha Técnica</h3>
                <p className="mt-1 text-xs text-[#898477]">Composição do Produto</p>
              </div>
              <button
                className="text-xs font-semibold text-[#59664d] underline decoration-[#b5b19f] underline-offset-4 hover:text-[#3f4a36]"
                onClick={addMaterial}
                type="button"
              >
                + Adicionar insumo
              </button>
            </div>

            <div className="space-y-2.5">
              {composition.map((item, index) => {
                const selectedMaterial = materials.find((entry) => entry.id === item.materialId)
                const lineCost = (selectedMaterial?.unitCost ?? 0) * (Number(item.quantity) || 0)

                return (
                  <div className="grid grid-cols-[minmax(0,1fr)_100px_74px] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_130px_90px_100px]" key={item.id}>
                    <label className="min-w-0">
                      <span className={labelClassName}>{index === 0 ? 'Insumo' : `Insumo ${index + 1}`}</span>
                      <select
                        className={inputClassName}
                        onChange={(event) => updateComposition(item.id, 'materialId', event.target.value)}
                        required
                        disabled={materials.length === 0}
                        value={item.materialId}
                      >
                        <option value="">Selecionar insumo</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} · {currency.format(material.unitCost)}/{material.unit}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className={labelClassName}>Quantidade</span>
                      <input
                        className={inputClassName}
                        min="0.01"
                        onChange={(event) => updateComposition(item.id, 'quantity', event.target.value)}
                        required
                        step="any"
                        type="number"
                        value={item.quantity}
                      />
                    </label>
                    <div className="pb-2 text-right">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-[#969084] sm:hidden">
                        Custo
                      </span>
                      <span className="whitespace-nowrap text-xs font-semibold text-[#4c4a40]">
                        {currency.format(lineCost)}
                      </span>
                    </div>
                    <button
                      aria-label={`Remover insumo ${index + 1}`}
                      className="col-span-3 justify-self-end pb-2 text-xs font-medium text-[#8d5145] hover:text-[#6d382f] sm:col-span-1 sm:justify-self-center"
                      disabled={composition.length === 1}
                      onClick={() => removeMaterial(item.id)}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                )
              })}
            </div>

            {materials.length === 0 && (
              <p className="mt-3 text-sm text-[#87544a]">Cadastre um insumo antes de montar a ficha técnica.</p>
            )}

            <div className="mt-5 grid gap-3 border-t border-[#e6e1d7] pt-4 sm:grid-cols-2">
              <div className="bg-[#f0eee8] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#827b6d]">
                  Custo Total de Produção (R$)
                </p>
                <p className="mt-1 text-lg font-semibold text-[#3f4a36]">{currency.format(productionCost)}</p>
              </div>
              <div className="bg-[#f0eee8] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#827b6d]">
                  Margem de Lucro Estimada (%)
                </p>
                <p className={`mt-1 text-lg font-semibold ${profitMargin < 0 ? 'text-red-700' : 'text-[#3f4a36]'}`}>
                  {profitMargin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                </p>
              </div>
            </div>
          </section>

          {saveError && <p className="px-5 pb-3 text-sm text-red-700 sm:px-7" role="alert">{saveError}</p>}

          <footer className="flex flex-col-reverse gap-2 border-t border-[#e6e1d7] bg-[#f7f5f0] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              className="h-10 border border-[#d6d0c4] px-5 text-sm font-medium text-[#625f54] transition hover:bg-white"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="h-10 bg-[#59664d] px-5 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              disabled={isSaving || materials.length === 0}
              type="submit"
            >
              {isSaving ? 'A guardar...' : product ? 'Salvar alterações' : 'Guardar produto'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ProductionModal({ products, onClose, onSave }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const product = products.find((item) => String(item.id) === productId)
  const quantityValue = Number(quantity) || 0

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await onSave({ produtoId: Number(productId), quantidade: quantityValue })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#27251f]/45 sm:items-center sm:p-5">
      <section aria-labelledby="production-modal-title" aria-modal="true" className="max-h-[94vh] w-full overflow-y-auto border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-xl" role="dialog">
        <header className="flex items-start justify-between border-b border-[#e6e1d7] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Ordem de produção</p>
            <h2 className="mt-1 font-serif text-xl text-[#302e27]" id="production-modal-title">Registrar produção</h2>
          </div>
          <button aria-label="Fechar produção" className="border border-[#ded9ce] px-3 py-1.5 text-xs font-medium text-[#625f54] hover:bg-[#f0eee8]" onClick={onClose} type="button">Fechar</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
            <label className="block">
              <span className={labelClassName}>Produto acabado</span>
              <select className={inputClassName} disabled={products.length === 0} onChange={(event) => setProductId(event.target.value)} required value={productId}>
                <option value="">Selecionar produto</option>
                {products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.stock} un. em estoque</option>)}
              </select>
            </label>
            <label className="block max-w-48">
              <span className={labelClassName}>Quantidade a produzir</span>
              <input className={inputClassName} min="1" onChange={(event) => setQuantity(event.target.value)} required step="1" type="number" value={quantity} />
            </label>

            {product && (
              <section className="border border-[#e4dfd5] bg-[#f5f3ed] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#777267]">Consumo previsto de insumos</h3>
                {product.recipe.length === 0 ? (
                  <p className="mt-3 text-sm text-[#87544a]">Este produto ainda não possui Ficha Técnica.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-[#e3ded3]">
                    {product.recipe.map((part) => {
                      const required = part.quantityNeeded * quantityValue
                      const isAvailable = part.quantityAvailable >= required
                      return (
                        <li className="flex justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0" key={part.id}>
                          <span className="text-[#4c4a40]">{part.name}</span>
                          <span className={`text-right tabular-nums ${isAvailable ? 'text-[#625f54]' : 'font-semibold text-red-700'}`}>
                            {numberFormat.format(required)} {part.unit} <span className="text-xs">/ disponível {numberFormat.format(part.quantityAvailable)} {part.unit}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <p className="mt-3 border-t border-[#e3ded3] pt-3 text-sm font-semibold text-[#3f4a36]">
                  Custo previsto: {currency.format(product.productionCost * quantityValue)}
                </p>
              </section>
            )}

            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-[#e6e1d7] bg-[#f7f5f0] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button className="h-10 border border-[#d6d0c4] px-5 text-sm font-medium text-[#625f54] hover:bg-white" onClick={onClose} type="button">Cancelar</button>
            <button className="h-10 bg-[#59664d] px-5 text-sm font-semibold text-white hover:bg-[#49563e] disabled:cursor-wait disabled:opacity-60" disabled={isSaving || !product || product.recipe.length === 0} type="submit">
              {isSaving ? 'A produzir...' : 'Confirmar produção'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ProductActions({ product, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-4">
      <button
        aria-label={`Editar ${product.name}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#59664d] hover:text-[#3f4a36]"
        onClick={() => onEdit(product)}
        type="button"
      >
        <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
        Editar
      </button>
      <button
        aria-label={`Excluir ${product.name}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#984f43] hover:text-[#7f4036]"
        onClick={() => onDelete(product)}
        type="button"
      >
        <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
        Excluir
      </button>
    </div>
  )
}

function ProductCard({ product, onEdit, onDelete }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(product.image) && !imageFailed

  return (
    <article className="overflow-hidden border border-[#ded9ce] bg-[#fbfaf7]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e5e0d5]">
        {hasImage ? (
          <img
            alt={product.name}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={product.image}
          />
        ) : (
          <div
            aria-label={`Sem foto cadastrada para ${product.name}`}
            className="flex size-full items-center justify-center bg-[#e9e6de]"
            role="img"
          >
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full border border-[#c8c2b6] font-serif text-3xl text-[#807a6d]">
              ◇
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 bg-[#fbfaf7]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#626052]">
          {product.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-[#302e27]">{product.name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#e8e4db] pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#918b7e]">Preço de venda</p>
            <p className="mt-1 text-sm font-semibold text-[#3f4a36]">{currency.format(product.salePrice)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#918b7e]">Custo de produção</p>
            <p className="mt-1 text-sm text-[#625f54]">{currency.format(product.productionCost)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#918b7e]">Lucro real</p>
            <p className="mt-1 text-sm font-semibold text-[#3f4a36]">{currency.format(product.unitProfit)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#918b7e]">Margem</p>
            <p className="mt-1 text-sm font-semibold text-[#3f4a36]">
              {product.margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            </p>
          </div>
          <div className="col-span-2 flex items-center justify-between border-t border-[#eeeae2] pt-3">
            <span className="text-xs text-[#777267]">Quantidade em estoque</span>
            <span className="text-sm font-semibold text-[#4c4a40]">{product.stock} un.</span>
          </div>
        </div>
        <div className="mt-4 border-t border-[#eeeae2] pt-3">
          <ProductActions onDelete={onDelete} onEdit={onEdit} product={product} />
        </div>
      </div>
    </article>
  )
}

function mapProduct(product) {
  const productionCost = product.fichaTecnica.reduce(
    (total, part) => total + part.quantidadeNecessaria * part.insumo.custoUnitario,
    0,
  )

  const unitProfit = product.precoVenda - productionCost

  return {
    id: product.id,
    name: product.nome,
    category: product.categoria,
    description: product.descricao,
    salePrice: product.precoVenda,
    productionCost,
    unitProfit,
    margin: product.precoVenda > 0 ? (unitProfit / product.precoVenda) * 100 : 0,
    stock: product.estoqueQtd,
    image: product.imagemUrl,
    recipe: product.fichaTecnica.map((part) => ({
      id: part.insumoId,
      name: part.insumo.nome,
      unit: part.insumo.unidadeMedida,
      quantityNeeded: part.quantidadeNecessaria,
      quantityAvailable: part.insumo.quantidade,
    })),
  }
}

function Produtos({ refreshKey = 0, onDataChanged = () => {} }) {
  const [products, setProducts] = useState([])
  const [insumos, setInsumos] = useState([])
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProductionOpen, setIsProductionOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.all([apiRequest('/produtos'), apiRequest('/insumos')])
      .then(([productResponse, insumoResponse]) => {
        if (!isCurrent) return
        setProducts(productResponse.data.map(mapProduct))
        setInsumos(insumoResponse.data)
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

  const filteredProducts = products.filter((product) => (
    `${product.name} ${product.category}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  ))
  const categorySuggestions = [...new Set([
    ...categories,
    ...products.map((product) => product.category).filter(Boolean),
  ])].sort((first, second) => first.localeCompare(second, 'pt-BR'))

  async function addProduct(product) {
    const { data } = await apiRequest('/produtos', {
      method: 'POST',
      body: product,
    })
    setProducts((current) => [mapProduct(data), ...current])
    onDataChanged()
  }

  async function updateProduct(product) {
    const { data } = await apiRequest(`/produtos/${productToEdit.id}`, {
      method: 'PUT',
      body: product,
    })
    setProducts((current) => current.map((item) => (
      item.id === productToEdit.id ? mapProduct(data) : item
    )).sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')))
    onDataChanged()
  }

  async function registerProduction(production) {
    await apiRequest('/producao', {
      method: 'POST',
      body: production,
    })
    onDataChanged()
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError('')
    try {
      await apiRequest(`/produtos/${productToDelete.id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((product) => product.id !== productToDelete.id))
      setProductToDelete(null)
      onDataChanged()
    } catch (error) {
      if (error.status === 404 || error.status === undefined) {
        setProducts((current) => current.filter((product) => product.id !== productToDelete.id))
        setProductToDelete(null)
        setLoadError('O produto foi removido desta lista, mas o servidor não confirmou a exclusão no banco de dados.')
      } else {
        setDeleteError(error.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#ded9ce] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">
            Catálogo de peças
          </p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">
            Produtos Acabados &amp; Peças Decorativas
          </h1>
          <p className="mt-2 text-sm text-[#777267]">
            {products.length} produtos cadastrados
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="h-11 shrink-0 border border-[#bfc1b1] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#526347] transition hover:bg-[#eef0e8] active:scale-[0.99]"
            onClick={() => setIsProductionOpen(true)}
            type="button"
          >
            + Registrar Produção
          </button>
          <button
            className="h-11 shrink-0 bg-[#59664d] px-4 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99]"
            onClick={() => { setProductToEdit(null); setIsModalOpen(true) }}
            type="button"
          >
            + Novo Produto
          </button>
        </div>
      </header>

      {loadError && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{loadError}</p>}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="w-full sm:max-w-sm">
          <span className="sr-only">Pesquisar por nome ou categoria</span>
          <input
            className="h-10 w-full border border-[#d9d4c9] bg-[#fbfaf7] px-3 text-sm text-[#302e27] outline-none transition placeholder:text-[#969084] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar por nome ou categoria..."
            type="search"
            value={query}
          />
        </label>

        <div aria-label="Modo de visualização" className="flex self-start border border-[#d9d4c9] bg-[#fbfaf7] p-1" role="group">
          <button
            aria-pressed={view === 'grid'}
            className={`h-8 px-3 text-xs font-medium transition ${view === 'grid' ? 'bg-[#e8e9df] text-[#46523c]' : 'text-[#777267] hover:bg-[#f0eee8]'}`}
            onClick={() => setView('grid')}
            type="button"
          >
            Grade
          </button>
          <button
            aria-pressed={view === 'table'}
            className={`h-8 px-3 text-xs font-medium transition ${view === 'table' ? 'bg-[#e8e9df] text-[#46523c]' : 'text-[#777267] hover:bg-[#f0eee8]'}`}
            onClick={() => setView('table')}
            type="button"
          >
            Tabela
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="border border-[#ded9ce] bg-[#fbfaf7] px-5 py-12 text-center text-sm text-[#827b6d]">A carregar produtos…</p>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-dashed border-[#d4cec1] bg-[#fbfaf7]/70 px-6 py-14 text-center">
          <p className="font-serif text-lg text-[#4c4a40]">{query ? 'Nenhum produto encontrado' : 'Ainda não há produtos cadastrados'}</p>
          {query && <p className="mt-1 text-sm text-[#827b6d]">Experimente outro nome ou categoria.</p>}
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              onDelete={(item) => { setDeleteError(''); setProductToDelete(item) }}
              onEdit={(item) => { setProductToEdit(item); setIsModalOpen(true) }}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#ded9ce] bg-[#fbfaf7]">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e4dfd5] bg-[#f2f0e9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777267]">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Preço de venda</th>
                <th className="px-4 py-3 text-right">Custo de produção</th>
                <th className="px-4 py-3 text-right">Lucro real</th>
                <th className="px-4 py-3 text-right">Margem</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr className="border-b border-[#eeeae2] last:border-0" key={product.id}>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#3f3d35]">{product.name}</td>
                  <td className="px-4 py-3.5 text-sm text-[#777267]">{product.category}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#3f4a36]">{currency.format(product.salePrice)}</td>
                  <td className="px-4 py-3.5 text-right text-sm text-[#625f54]">{currency.format(product.productionCost)}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#3f4a36]">{currency.format(product.unitProfit)}</td>
                  <td className="px-4 py-3.5 text-right text-sm text-[#526347]">{product.margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</td>
                  <td className="px-4 py-3.5 text-right text-sm text-[#625f54]">{product.stock} un.</td>
                  <td className="px-4 py-3.5 text-right">
                    <ProductActions
                      onDelete={(item) => { setDeleteError(''); setProductToDelete(item) }}
                      onEdit={(item) => { setProductToEdit(item); setIsModalOpen(true) }}
                      product={product}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          categorySuggestions={categorySuggestions}
          insumos={insumos}
          onClose={() => { setIsModalOpen(false); setProductToEdit(null) }}
          onSave={productToEdit ? updateProduct : addProduct}
          product={productToEdit}
        />
      )}
      {isProductionOpen && (
        <ProductionModal
          onClose={() => setIsProductionOpen(false)}
          onSave={registerProduction}
          products={products}
        />
      )}
      {productToDelete && (
        <ConfirmDeleteModal
          error={deleteError}
          isDeleting={isDeleting}
          message="Tem certeza que deseja excluir este produto?"
          onCancel={() => setProductToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  )
}

export default Produtos
