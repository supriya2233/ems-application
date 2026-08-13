function Modal({
  isOpen,
  onClose,
  title,
  children,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="ui-modal-overlay"
      onClick={onClose}
    >

      <div
        className="ui-modal"
        onClick={(event) => event.stopPropagation()}
      >

        <div className="ui-modal-header">

          <h2>{title}</h2>

          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>

        <div className="ui-modal-body">
          {children}
        </div>

      </div>

    </div>
  )
}

export default Modal