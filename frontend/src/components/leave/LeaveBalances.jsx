/*
 * Leave balance per type, e.g. "Casual  8 of 12 left".
 *
 *   <LeaveBalances balances={[{ type, allowance, used, pending, remaining }]} />
 *   compact   one line per type, no bars (for small spaces)
 *   highlight a type to emphasise (the one being requested)
 */
function LeaveBalances({ balances = [], compact = false, highlight }) {
  if (balances.length === 0) return null

  return (
    <ul className={`leave-balances ${compact ? 'leave-balances-compact' : ''}`}>
      {balances.map((balance) => {
        const limited = balance.allowance !== null
        const usedShare = limited && balance.allowance > 0
          ? Math.min(balance.used / balance.allowance, 1)
          : 0
        const pendingShare = limited && balance.allowance > 0
          ? Math.min(balance.pending / balance.allowance, 1 - usedShare)
          : 0
        const isLow = limited && balance.remaining - balance.pending <= 0

        return (
          <li
            key={balance.type}
            className={`leave-balance ${balance.type === highlight ? 'leave-balance-highlight' : ''}`}
          >
            <span className="leave-balance-type">{balance.type}</span>

            <span className={`leave-balance-value ${isLow ? 'leave-balance-low' : ''}`}>
              {limited ? (
                <>
                  <strong>{balance.remaining}</strong> of {balance.allowance} left
                </>
              ) : (
                <>
                  <strong>{balance.used}</strong> taken · no limit
                </>
              )}
            </span>

            {!compact && limited && (
              <span
                className="leave-balance-bar"
                role="img"
                aria-label={`${balance.used} used, ${balance.pending} pending, ${balance.remaining} left`}
              >
                <span className="leave-balance-used" style={{ width: `${usedShare * 100}%` }} />
                <span className="leave-balance-pending" style={{ width: `${pendingShare * 100}%` }} />
              </span>
            )}

            {!compact && balance.pending > 0 && (
              <span className="leave-balance-note">{balance.pending} pending</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default LeaveBalances
