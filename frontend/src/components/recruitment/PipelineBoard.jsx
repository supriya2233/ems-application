import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GripVertical, UserCheck } from 'lucide-react'

import Button from '../common/Button'
import { getAvatarColor, getInitials } from '../../utils/avatar'
import { formatDay } from '../../utils/leave'
import { MOVABLE_STAGES, PIPELINE_STAGES } from '../../utils/recruitment'

const STAGE_HINTS = {
  Applied: 'New applications',
  Screening: 'CV and phone screen',
  Interview: 'Interviews under way',
  Selected: 'Ready to hire',
  Hired: 'Employee created',
  Rejected: 'Not moving forward',
}

/*
 * Candidates as cards in stage columns.
 *
 * Moving a card:
 *   - mouse: drag it onto another column (HTML drag and drop)
 *   - keyboard / touch: the "Stage" select on each card
 * Dropping a Selected card on "Hired" opens the Hire form.
 */
function PipelineBoard({ candidates, onMove, onHire, onOpen }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const dragged = candidates.find((candidate) => candidate._id === dragId)

  const canDrop = (stage) => {
    if (!dragged || dragged.status === stage || dragged.status === 'Hired') return false
    if (stage === 'Hired') return dragged.status === 'Selected'
    return true
  }

  const handleDrop = (event, stage) => {
    event.preventDefault()
    setOverStage(null)
    setDragId(null)
    if (!canDrop(stage)) return

    if (stage === 'Hired') onHire(dragged)
    else onMove(dragged, stage)
  }

  return (
    <div className="pipeline-board" aria-label="Recruitment pipeline">
      {PIPELINE_STAGES.map((stage) => {
        const cards = candidates.filter((candidate) => candidate.status === stage)
        const droppable = canDrop(stage)

        return (
          <section
            key={stage}
            className={[
              'pipeline-column',
              `pipeline-column-${stage.toLowerCase()}`,
              dragId && droppable && 'pipeline-column-droppable',
              overStage === stage && droppable && 'pipeline-column-over',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby={`stage-${stage}`}
            onDragOver={(event) => {
              if (!droppable) return
              event.preventDefault() // allows the drop
              event.dataTransfer.dropEffect = 'move'
              setOverStage(stage)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOverStage(null)
            }}
            onDrop={(event) => handleDrop(event, stage)}
          >
            <header className="pipeline-column-header">
              <div>
                <h3 id={`stage-${stage}`}>{stage}</h3>
                <p>{STAGE_HINTS[stage]}</p>
              </div>
              <span className="pipeline-count" aria-label={`${cards.length} candidates`}>
                {cards.length}
              </span>
            </header>

            {cards.length === 0 ? (
              <p className="pipeline-empty">
                {stage === 'Hired' && dragged?.status === 'Selected' ? 'Drop here to hire' : 'No candidates'}
              </p>
            ) : (
              <ul className="pipeline-cards">
                {cards.map((candidate) => (
                  <PipelineCard
                    key={candidate._id}
                    candidate={candidate}
                    dragging={dragId === candidate._id}
                    onDragStart={() => setDragId(candidate._id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverStage(null)
                    }}
                    onMove={onMove}
                    onHire={onHire}
                    onOpen={onOpen}
                  />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

function PipelineCard({ candidate, dragging, onDragStart, onDragEnd, onMove, onHire, onOpen }) {
  const hired = candidate.status === 'Hired'
  const selectId = `stage-select-${candidate._id}`

  return (
    <li
      className={`pipeline-card ${dragging ? 'pipeline-card-dragging' : ''}`}
      draggable={!hired}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', candidate._id) // Firefox needs data to start a drag
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      <div className="pipeline-card-top">
        <span
          className="pipeline-avatar"
          style={{ background: getAvatarColor(candidate.candidateName) }}
          aria-hidden="true"
        >
          {getInitials(candidate.candidateName)}
        </span>

        <div className="pipeline-card-text">
          <button type="button" className="pipeline-card-name" onClick={() => onOpen(candidate)}>
            {candidate.candidateName}
          </button>
          <span>{candidate.position}</span>
        </div>

        {!hired && <GripVertical className="pipeline-grip" size={16} aria-hidden="true" />}
      </div>

      <p className="pipeline-card-meta">
        {candidate.department || 'No department'}
        {' · '}
        {hired && candidate.hiredAt ? `hired ${formatDay(candidate.hiredAt, false)}` : `applied ${formatDay(candidate.appliedDate, false)}`}
      </p>

      <div className="pipeline-card-actions">
        {hired ? (
          candidate.employeeId ? (
            <Link className="leave-link" to={`/employees/${candidate.employeeId}`}>
              View employee {candidate.employeeId}
            </Link>
          ) : (
            <span className="pipeline-card-meta">Hired</span>
          )
        ) : (
          <>
            <label className="visually-hidden" htmlFor={selectId}>
              Stage for {candidate.candidateName}
            </label>
            <select
              id={selectId}
              className="pipeline-stage-select"
              value={candidate.status}
              onChange={(event) => onMove(candidate, event.target.value)}
            >
              {MOVABLE_STAGES.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>

            {candidate.status === 'Selected' && (
              <Button size="small" icon={<UserCheck size={14} aria-hidden="true" />} onClick={() => onHire(candidate)}>
                Hire
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  )
}

export default PipelineBoard
