import TaskModal from './TaskModal'

/* New task. `initialStatus` pre-selects the board column it was added from. */
function AddTaskModal({ onClose, onCreate, initialStatus }) {
  return <TaskModal initialStatus={initialStatus} onClose={onClose} onSave={onCreate} />
}

export default AddTaskModal
