function ConfirmDeleteModal({ message, isDeleting, error, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#27251f]/45 sm:items-center sm:p-5">
      <section
        aria-labelledby="delete-confirmation-title"
        aria-modal="true"
        className="w-full border border-[#d9d4c9] bg-[#fbfaf7] shadow-2xl sm:max-w-md"
        role="dialog"
      >
        <header className="border-b border-[#e6e1d7] px-5 py-4 sm:px-6">
          <h2 className="font-serif text-xl text-[#302e27]" id="delete-confirmation-title">Confirmar exclusão</h2>
        </header>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <p className="text-sm text-[#625f54]">{message}</p>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-[#e6e1d7] bg-[#f7f5f0] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button className="h-10 border border-[#d6d0c4] px-5 text-sm font-medium text-[#625f54] hover:bg-white disabled:opacity-60" disabled={isDeleting} onClick={onCancel} type="button">Cancelar</button>
          <button className="h-10 bg-[#984f43] px-5 text-sm font-semibold text-white hover:bg-[#7f4036] disabled:opacity-60" disabled={isDeleting} onClick={onConfirm} type="button">
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default ConfirmDeleteModal