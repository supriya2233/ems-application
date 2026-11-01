import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History, RotateCcw } from 'lucide-react'

import ActivityTimeline from '../components/activity/ActivityTimeline'
import Button from '../components/common/Button'
import EmployeePicker from '../components/common/EmployeePicker'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import { useLiveEvents } from '../components/live/liveEventsContext'
import { getActivityModules, getActivityPage } from '../services/activityService'
import { dayStartISO, localDayKey, matchesFilters, moduleLabel } from '../utils/activity'

const PAGE_SIZE = 30
const FRESH_MS = 4000

const currentParams = () => new URLSearchParams(window.location.search)

/*
 * Activity log: everything that happened, newest first.
 *
 * The filters live in the address bar (?module=leave&employee=EMP001
 * &from=2026-11-01&to=2026-11-07&q=approved), so a filtered view can
 * be bookmarked or linked to, e.g. from an employee's profile.
 */
function Activity() {
  const [params, setParams] = useSearchParams()

  const module = params.get('module') || ''
  const employeeId = params.get('employee') || ''
  const fromDay = params.get('from') || ''
  const toDay = params.get('to') || ''
  const q = params.get('q') || ''

  // The search box updates the address bar after a short pause.
  // The timer compares with the address bar as it is *when it fires*
  // (not the `q` captured when it was set), so "Clear filters"
  // isn't undone by a search that was still waiting.
  const [searchText, setSearchText] = useState(q)
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = searchText.trim()
      if (text !== (currentParams().get('q') || '')) update({ q: text })
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  const filters = useMemo(
    () => ({
      module,
      employeeId,
      from: fromDay ? dayStartISO(fromDay) : '',
      // "To 7 Nov" includes all of 7 Nov: stop at the start of 8 Nov.
      to: toDay ? dayStartISO(toDay, 1) : '',
      q,
    }),
    [module, employeeId, fromDay, toDay, q],
  )

  const [entries, setEntries] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [modules, setModules] = useState([])
  const [freshIds, setFreshIds] = useState(() => new Set())
  const freshTimer = useRef(null)

  useEffect(() => {
    getActivityModules().then(setModules).catch(() => setModules([]))
  }, [])

  // First page whenever the filters change.
  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')

    getActivityPage(filters, { limit: PAGE_SIZE })
      .then((page) => {
        if (ignore) return
        setEntries(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load the activity log')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [filters])

  useEffect(() => () => clearTimeout(freshTimer.current), [])

  // New events appear at the top if they match the filters.
  useLiveEvents((event) => {
    if (!matchesFilters(event, filters)) return
    const entry = { ...event, _id: event.id }
    setEntries((current) => (current.some((item) => item._id === entry._id) ? current : [entry, ...current]))
    setModules((current) =>
      current.some((item) => item.module === event.module)
        ? current
        : [...current, { module: event.module, count: 1 }].sort((a, b) => a.module.localeCompare(b.module)),
    )
    setFreshIds((current) => new Set(current).add(entry._id))
    clearTimeout(freshTimer.current)
    freshTimer.current = setTimeout(() => setFreshIds(new Set()), FRESH_MS)
  })

  const loadOlder = async () => {
    setLoadingMore(true)
    try {
      const page = await getActivityPage(filters, { before: cursor, limit: PAGE_SIZE })
      setEntries((current) => [...current, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError(err.message || 'Failed to load older activity')
    } finally {
      setLoadingMore(false)
    }
  }

  /*
   * Changing a filter = changing the address bar. Starts from the
   * real current URL: a copy kept from an earlier render could be
   * out of date (a "stale closure") and bring old filters back.
   */
  function update(changes) {
    const next = currentParams()
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const isFiltered = Boolean(module || employeeId || fromDay || toDay || q)

  const clearFilters = () => {
    setSearchText('')
    setParams({}, { replace: true })
  }

  const today = localDayKey(new Date())

  return (
    <div className="activity-page">
      <PageHeader
        title="Activity log"
        description="Every change made in the app: who did what, and when. New entries appear as they happen."
      />

      <section className="ui-card" aria-labelledby="activity-results-title">
        <div className="activity-filters">
          <div className="activity-filter activity-filter-search">
            <label htmlFor="activity-search">Search</label>
            <SearchBar
              id="activity-search"
              value={searchText}
              onChange={setSearchText}
              placeholder="Words in the description…"
            />
          </div>

          <div className="activity-filter">
            <label htmlFor="activity-module">Module</label>
            <select id="activity-module" value={module} onChange={(event) => update({ module: event.target.value })}>
              <option value="">All modules</option>
              {modules.map((item) => (
                <option key={item.module} value={item.module}>
                  {moduleLabel(item.module)} ({item.count})
                </option>
              ))}
              {module && !modules.some((item) => item.module === module) && (
                <option value={module}>{moduleLabel(module)}</option>
              )}
            </select>
          </div>

          <div className="activity-filter activity-filter-employee">
            <label htmlFor="activity-employee">Employee</label>
            <EmployeePicker
              id="activity-employee"
              value={employeeId}
              allowUnassigned
              unassignedLabel="Anyone"
              unassignedHint="Show everyone’s activity"
              placeholder="Anyone"
              onChange={(employee) => update({ employee: employee?.employeeId || '' })}
            />
          </div>

          <div className="activity-filter">
            <label htmlFor="activity-from">From</label>
            <input
              id="activity-from"
              type="date"
              value={fromDay}
              max={toDay || today}
              onChange={(event) => update({ from: event.target.value })}
            />
          </div>

          <div className="activity-filter">
            <label htmlFor="activity-to">To</label>
            <input
              id="activity-to"
              type="date"
              value={toDay}
              min={fromDay || undefined}
              max={today}
              onChange={(event) => update({ to: event.target.value })}
            />
          </div>
        </div>

        <div className="activity-results-bar">
          <h2 id="activity-results-title" aria-live="polite">
            {loading
              ? 'Loading…'
              : entries.length === 0
                ? 'No entries'
                : `${entries.length}${hasMore ? '+' : ''} ${entries.length === 1 ? 'entry' : 'entries'}${isFiltered ? ' match' : ''}`}
          </h2>
          {isFiltered && (
            <Button variant="ghost" size="small" icon={<RotateCcw size={14} aria-hidden="true" />} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        {loading ? (
          <div className="activity-skeleton" aria-hidden="true">
            {[1, 2, 3, 4].map((row) => <span key={row} className="ui-skeleton" />)}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<History size={20} aria-hidden="true" />}
            title={isFiltered ? 'Nothing matches these filters' : 'No activity yet'}
            description={
              isFiltered
                ? 'Try a wider date range, another module, or clear the filters.'
                : 'Adding employees, approving leave, running payroll… every change is recorded here.'
            }
            action={isFiltered && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <ActivityTimeline entries={entries} freshIds={freshIds} />
            {hasMore && (
              <div className="activity-more">
                <Button variant="secondary" loading={loadingMore} onClick={loadOlder}>
                  Load older entries
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Activity
