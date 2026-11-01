import { useCallback, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

import Button from './Button'
import Modal from './Modal'
import { FeedbackContext } from './feedbackContext'

const TOAST_DURATION = 4000

const TOAST_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

let nextToastId = 1

function FeedbackProvider({ children }) {
  /* ---------------- Toasts ---------------- */

  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback(
    (type, message) => {
      const id = nextToastId++

      // Keep at most 3 on screen; the oldest goes first.
      setToasts((current) => [...current.slice(-2), { id, type, message }])

      setTimeout(() => dismissToast(id), TOAST_DURATION)
    },
    [dismissToast]
  )

  const toast = useMemo(
    () => ({
      success: (message) => showToast('success', message),
      error: (message) => showToast('error', message),
      info: (message) => showToast('info', message),
    }),
    [showToast]
  )

  /* ---------------- Confirm dialog ---------------- */

  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  // confirm({...}) returns a Promise that resolves to true
  // (confirmed) or false (cancelled / closed).
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolverRef.current = resolve

        setDialog({
          title: 'Are you sure?',
          message: '',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          tone: 'primary',
          ...options,
        })
      }),
    []
  )

  const closeDialog = (result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {dialog && (
        <Modal
          title={dialog.title}
          onClose={() => closeDialog(false)}
          size="sm"
          className="ui-confirm"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => closeDialog(false)}
                data-autofocus
              >
                {dialog.cancelLabel}
              </Button>

              <Button
                variant={dialog.tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </Button>
            </>
          }
        >
          {dialog.message && <p className="ui-confirm-message">{dialog.message}</p>}
        </Modal>
      )}

      {/* Always in the page so screen readers announce new toasts */}
      <div className="ui-toast-region" aria-live="polite">
        {toasts.map((item) => {
          const Icon = TOAST_ICONS[item.type]

          return (
            <div
              key={item.id}
              className={`ui-toast ui-toast-${item.type}`}
              role={item.type === 'error' ? 'alert' : 'status'}
            >
              <Icon className="ui-toast-icon" size={18} aria-hidden="true" />

              <p>{item.message}</p>

              <button
                type="button"
                className="ui-toast-close"
                onClick={() => dismissToast(item.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </FeedbackContext.Provider>
  )
}

export default FeedbackProvider
