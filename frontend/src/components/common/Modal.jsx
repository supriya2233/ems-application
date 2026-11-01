import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/*
 * Accessible dialog.
 *
 *   isOpen   defaults to true, so pages can also write
 *            {show && <Modal …>} without passing isOpen.
 *   size     sm | md (default) | lg
 *   footer   optional buttons row pinned under the body
 *
 * Behaviour:
 *   - Escape or a click on the dimmed backdrop closes it
 *   - focus moves into the dialog, Tab stays inside it, and
 *     focus returns to the button that opened it on close
 *   - the page behind does not scroll while it is open
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Several dialogs can be open at once (a confirm on top of a
// form), so count them and unlock scrolling after the last one.
let openDialogs = 0

function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const previouslyFocused = document.activeElement
    const panel = panelRef.current

    // Prefer an element marked data-autofocus, then the first
    // form field, then the dialog itself.
    const target =
      panel.querySelector('[data-autofocus]') ||
      panel.querySelector(
        '.ui-modal-body input:not([type="hidden"]), .ui-modal-body select, .ui-modal-body textarea'
      ) ||
      panel

    target.focus()

    openDialogs += 1
    document.body.style.overflow = 'hidden'

    return () => {
      openDialogs -= 1

      if (openDialogs === 0) {
        document.body.style.overflow = ''
      }

      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  // Key handling sits on the dialog itself, so with two dialogs
  // open only the top one (which holds focus) reacts.
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onCloseRef.current?.()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)]

    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable.at(-1)

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="ui-modal-overlay"
      onMouseDown={(event) => {
        // Only a press that starts on the backdrop closes it, so
        // selecting text and releasing outside doesn't.
        if (event.target === event.currentTarget) {
          onClose?.()
        }
      }}
    >

      <div
        ref={panelRef}
        className={`ui-modal ui-modal-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >

        <div className="ui-modal-header">

          <h2 id={titleId}>{title}</h2>

          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>

        </div>

        <div className="ui-modal-body">
          {children}
        </div>

        {footer && (
          <div className="ui-modal-footer">
            {footer}
          </div>
        )}

      </div>

    </div>,
    document.body
  )
}

export default Modal
