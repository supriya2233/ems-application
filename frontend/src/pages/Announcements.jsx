import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarDays,
  Laptop,
  Megaphone,
  PartyPopper,
  Pencil,
  Pin,
  PinOff,
  Plus,
  ScrollText,
  Trash2,
  Users,
} from 'lucide-react'

import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../services/announcementService'
import { getDepartments } from '../services/departmentService'
import { timeAgo } from '../utils/timeAgo'

const EVERYONE = 'Everyone'

const CATEGORY_ICONS = {
  General: Megaphone,
  Company: Building2,
  Policy: ScrollText,
  Event: CalendarDays,
  Celebration: PartyPopper,
  IT: Laptop,
}

const EMPTY_FORM = { title: '', body: '', category: 'General', audience: EVERYONE, pinned: false }

const NEW_FOR_DAYS = 3
const LONG_BODY = 280

const isRecent = (date) => Date.now() - new Date(date).getTime() < NEW_FOR_DAYS * 86400000

function Announcements() {
  const toast = useToast()
  const confirm = useConfirm()
  const refreshKey = useLiveRefresh(['announcements', 'departments'])

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState(Object.keys(CATEGORY_ICONS))
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [audience, setAudience] = useState('')

  const [form, setForm] = useState(null) // { editing, values }
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let ignore = false

    Promise.all([getAnnouncements(), getDepartments()])
      .then(([result, departmentList]) => {
        if (ignore) return
        setItems(result.items)
        if (result.categories?.length) setCategories(result.categories)
        setDepartments(departmentList.map((department) => department.name).sort())
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Could not load announcements')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) => {
      if (category !== 'All' && item.category !== category) return false
      if (audience && item.audience !== audience) return false
      if (!term) return true
      return `${item.title} ${item.body} ${item.audience}`.toLowerCase().includes(term)
    })
  }, [items, search, category, audience])

  const pinned = visible.filter((item) => item.pinned)
  const others = visible.filter((item) => !item.pinned)

  const counts = useMemo(() => {
    const byCategory = { All: items.length }
    items.forEach((item) => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
    })
    return byCategory
  }, [items])

  // Keep the list sorted the way the server does: pinned, then newest.
  const sortItems = (list) =>
    [...list].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.publishedAt) - new Date(a.publishedAt),
    )

  const openCreate = () => setForm({ editing: null, values: EMPTY_FORM })

  const openEdit = (item) =>
    setForm({
      editing: item,
      values: {
        title: item.title,
        body: item.body,
        category: item.category,
        audience: item.audience,
        pinned: item.pinned,
      },
    })

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, values: { ...current.values, [field]: value } }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const values = { ...form.values, title: form.values.title.trim(), body: form.values.body.trim() }

      if (form.editing) {
        const updated = await updateAnnouncement(form.editing._id, values)
        setItems((current) => sortItems(current.map((item) => (item._id === updated._id ? updated : item))))
        toast.success('Announcement updated')
      } else {
        const created = await createAnnouncement(values)
        setItems((current) => sortItems([created, ...current]))
        toast.success('Announcement posted')
      }

      setForm(null)
    } catch (err) {
      toast.error(err.message || 'Could not save the announcement')
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async (item) => {
    setBusyId(item._id)

    try {
      const updated = await updateAnnouncement(item._id, { pinned: !item.pinned })
      setItems((current) => sortItems(current.map((other) => (other._id === updated._id ? updated : other))))
      toast.success(updated.pinned ? 'Pinned to the top' : 'Unpinned')
    } catch (err) {
      toast.error(err.message || 'Could not update the announcement')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete this announcement?',
      message: `“${item.title}” will be removed for everyone. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    setBusyId(item._id)

    try {
      await deleteAnnouncement(item._id)
      setItems((current) => current.filter((other) => other._id !== item._id))
      toast.success('Announcement deleted')
    } catch (err) {
      toast.error(err.message || 'Could not delete the announcement')
    } finally {
      setBusyId(null)
    }
  }

  const filtersActive = search || category !== 'All' || audience
  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setAudience('')
  }

  const renderList = (list) => (
    <ul className="ann-list">
      {list.map((item) => (
        <AnnouncementCard
          key={item._id}
          item={item}
          busy={busyId === item._id}
          onEdit={() => openEdit(item)}
          onPin={() => togglePin(item)}
          onDelete={() => handleDelete(item)}
        />
      ))}
    </ul>
  )

  return (
    <div className="announcements-page">
      <PageHeader
        eyebrow="Tools"
        title="Announcements"
        description="Company news, policy updates and events, for everyone or a single team."
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            New announcement
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error">{error}</div>}

      <div className="ann-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search announcements" label="Search announcements" />

        <select
          className="ui-select ann-audience"
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          aria-label="Audience"
        >
          <option value="">All audiences</option>
          <option value={EVERYONE}>Everyone</option>
          {departments.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="chip-row" role="group" aria-label="Category">
        {['All', ...categories].map((name) => (
          <button
            key={name}
            type="button"
            className="chip"
            aria-pressed={category === name}
            onClick={() => setCategory(name)}
          >
            {name}
            <span className="chip-count">{counts[name] || 0}</span>
          </button>
        ))}
      </div>

      {loading && !items.length ? (
        <div className="ui-loading">Loading announcements…</div>
      ) : !items.length ? (
        <section className="ui-card">
          <EmptyState
            icon={<Megaphone size={22} strokeWidth={1.75} />}
            title="No announcements yet"
            description="Share news, a policy change or an upcoming event. Pinned posts stay at the top for everyone."
            action={<Button icon={<Plus size={16} />} onClick={openCreate}>Post the first announcement</Button>}
          />
        </section>
      ) : !visible.length ? (
        <section className="ui-card">
          <EmptyState
            title="Nothing matches these filters"
            description="Try another search word, category or audience."
            action={filtersActive && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        </section>
      ) : (
        <>
          {pinned.length > 0 && (
            <section aria-labelledby="ann-pinned">
              <h2 id="ann-pinned" className="ann-section-title">
                <Pin size={14} aria-hidden="true" /> Pinned
              </h2>
              {renderList(pinned)}
            </section>
          )}

          {others.length > 0 && (
            <section aria-labelledby="ann-latest">
              <h2 id="ann-latest" className="ann-section-title">Latest</h2>
              {renderList(others)}
            </section>
          )}
        </>
      )}

      {form && (
        <Modal
          title={form.editing ? 'Edit announcement' : 'New announcement'}
          onClose={() => !saving && setForm(null)}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group form-full-width">
                <label htmlFor="ann-title">Title</label>
                <input
                  id="ann-title"
                  value={form.values.title}
                  onChange={setField('title')}
                  placeholder="e.g. Office closed for Diwali"
                  maxLength="120"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ann-category">Category</label>
                <select id="ann-category" value={form.values.category} onChange={setField('category')}>
                  {categories.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ann-audience">Audience</label>
                <select id="ann-audience" value={form.values.audience} onChange={setField('audience')}>
                  <option value={EVERYONE}>Everyone</option>
                  {departments.map((name) => (
                    <option key={name} value={name}>{name} team</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-full-width">
                <label htmlFor="ann-body">Message</label>
                <textarea
                  id="ann-body"
                  value={form.values.body}
                  onChange={setField('body')}
                  placeholder="What do people need to know, and by when?"
                  rows="7"
                  maxLength="4000"
                  required
                />
                <span className="form-hint">{form.values.body.length} / 4000 characters</span>
              </div>

              <label className="ann-pin-field form-full-width">
                <input type="checkbox" checked={form.values.pinned} onChange={setField('pinned')} />
                <span>
                  <strong>Pin to the top</strong>
                  <small>Pinned announcements stay above newer posts until unpinned.</small>
                </span>
              </label>
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{form.editing ? 'Save changes' : 'Post announcement'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function AnnouncementCard({ item, busy, onEdit, onPin, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = CATEGORY_ICONS[item.category] || Megaphone
  const isLong = item.body.length > LONG_BODY
  const slug = item.category.toLowerCase()

  return (
    <li className={`ann-card ${item.pinned ? 'ann-card-pinned' : ''}`}>
      <span className={`ann-icon ann-cat-${slug}`} aria-hidden="true">
        <Icon size={18} />
      </span>

      <div className="ann-content">
        <div className="ann-meta">
          <span className={`ann-category ann-cat-${slug}`}>{item.category}</span>
          <span className="ann-audience-tag">
            <Users size={13} aria-hidden="true" />
            {item.audience === EVERYONE ? 'Everyone' : `${item.audience} team`}
          </span>
          {isRecent(item.publishedAt) && <span className="ann-new">New</span>}
        </div>

        <h3>{item.title}</h3>

        <p className={`ann-body ${isLong && !expanded ? 'ann-body-clamped' : ''}`}>{item.body}</p>

        {isLong && (
          <button type="button" className="ann-more" onClick={() => setExpanded((open) => !open)} aria-expanded={expanded}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        <div className="ann-footer">
          <span className="ann-byline">
            {item.author} · <time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString('en-IN')}>{timeAgo(item.publishedAt)}</time>
          </span>

          <div className="ann-actions">
            <Button
              size="small"
              variant="ghost"
              onClick={onPin}
              disabled={busy}
              icon={item.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
              title={item.pinned ? 'Unpin' : 'Pin to top'}
            />
            <Button
              size="small"
              variant="ghost"
              onClick={onEdit}
              disabled={busy}
              icon={<Pencil size={15} />}
              aria-label={`Edit ${item.title}`}
              title="Edit"
            />
            <Button
              size="small"
              variant="ghost"
              onClick={onDelete}
              disabled={busy}
              icon={<Trash2 size={15} />}
              aria-label={`Delete ${item.title}`}
              title="Delete"
            />
          </div>
        </div>
      </div>
    </li>
  )
}

export default Announcements
