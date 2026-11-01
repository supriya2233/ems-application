/* Recruitment pipeline stages, in order. */
export const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Selected', 'Hired', 'Rejected']

// Stages a candidate can be moved to by hand. "Hired" only comes
// from the Hire button, because hiring creates the employee record.
export const MOVABLE_STAGES = PIPELINE_STAGES.filter((stage) => stage !== 'Hired')
