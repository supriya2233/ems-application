import TaskModal from './TaskModal'

/* Edit an existing task. */
function EditTaskModal({ task, onClose, onUpdate }) {
  return <TaskModal task={task} onClose={onClose} onSave={(data) => onUpdate(task._id, data)} />
}

export default EditTaskModal
