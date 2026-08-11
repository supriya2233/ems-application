import { useMemo, useState } from 'react'
import {
  announcements,
  announcementCategories,
} from '../data/announcements'

function Announcements() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        announcement.content
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' ||
        announcement.category === category

      const matchesPinned =
        !showPinnedOnly || announcement.pinned

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPinned
      )
    })
  }, [search, category, showPinnedOnly])

  const unreadCount = announcements.filter(
    (announcement) => announcement.unread,
  ).length

  return (
    <div className="module-page announcements-page">

      {/* HEADER */}

      <div className="module-header">

        <div>
          <span className="module-eyebrow">
            COMMUNICATION
          </span>

          <h1>
            Announcements
          </h1>

          <p>
            Keep employees informed about company news,
            policies and important events.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + Create Announcement
        </button>

      </div>


      {/* SUMMARY */}

      <section className="announcement-summary">

        <div className="announcement-summary-card">

          <div className="announcement-summary-icon">
            !
          </div>

          <div>
            <strong>
              {unreadCount}
            </strong>

            <span>
              Unread announcements
            </span>
          </div>

        </div>


        <div className="announcement-summary-card">

          <div className="announcement-summary-icon pinned">
            ★
          </div>

          <div>
            <strong>
              {announcements.filter(
                (item) => item.pinned,
              ).length}
            </strong>

            <span>
              Pinned announcements
            </span>
          </div>

        </div>


        <div className="announcement-summary-card">

          <div className="announcement-summary-icon">
            #
          </div>

          <div>
            <strong>
              {announcements.length}
            </strong>

            <span>
              Total announcements
            </span>
          </div>

        </div>

      </section>


      {/* FILTERS */}

      <section className="content-card announcement-controls">

        <input
          type="search"
          placeholder="Search announcements..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          {announcementCategories.map((item) => (
            <option key={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          className={`filter-toggle ${
            showPinnedOnly ? 'active' : ''
          }`}
          onClick={() =>
            setShowPinnedOnly((current) => !current)
          }
        >
          ★ Pinned only
        </button>

      </section>


      {/* ANNOUNCEMENTS */}

      {filteredAnnouncements.length > 0 ? (

        <section className="announcement-grid">

          {filteredAnnouncements.map((announcement) => (

            <article
              className={`announcement-card ${
                announcement.pinned
                  ? 'announcement-pinned'
                  : ''
              }`}
              key={announcement.id}
            >

              <div className="announcement-card-top">

                <span
                  className={`announcement-category ${announcement.category.toLowerCase()}`}
                >
                  {announcement.category}
                </span>

                <div className="announcement-card-icons">

                  {announcement.unread && (
                    <span className="unread-dot" />
                  )}

                  {announcement.pinned && (
                    <span className="pin-icon">
                      ★
                    </span>
                  )}

                </div>

              </div>


              <h2>
                {announcement.title}
              </h2>

              <p>
                {announcement.content}
              </p>


              <div className="announcement-card-footer">

                <div className="announcement-author">

                  <span>
                    {announcement.author.charAt(0)}
                  </span>

                  <div>
                    <strong>
                      {announcement.author}
                    </strong>

                    <small>
                      {announcement.date}
                    </small>
                  </div>

                </div>

                <button
                  className="announcement-read-button"
                  onClick={() =>
                    alert(
                      'Announcement details will be connected to the backend later.',
                    )
                  }
                >
                  Read more →
                </button>

              </div>

            </article>

          ))}

        </section>

      ) : (

        <div className="content-card empty-state">

          <div className="empty-state-icon">
            !
          </div>

          <h3>
            No announcements found
          </h3>

          <p>
            Try changing your search or category filter.
          </p>

          <button
            className="secondary-button"
            onClick={() => {
              setSearch('')
              setCategory('All')
              setShowPinnedOnly(false)
            }}
          >
            Clear filters
          </button>

        </div>

      )}


      {/* CREATE MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="announcement-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="module-eyebrow">
                  COMMUNICATION
                </span>

                <h2>
                  Create Announcement
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <div className="modal-form">

              <label>
                Title

                <input
                  type="text"
                  placeholder="Announcement title"
                />
              </label>


              <label>
                Category

                <select>
                  <option>Company</option>
                  <option>Policy</option>
                  <option>Event</option>
                  <option>Performance</option>
                  <option>General</option>
                  <option>Wellness</option>
                </select>

              </label>


              <label>
                Announcement

                <textarea
                  rows="5"
                  placeholder="Write your announcement..."
                />

              </label>


              <label className="checkbox-label">

                <input type="checkbox" />

                Pin this announcement

              </label>


              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={() => {
                    alert(
                      'Announcement creation will be connected to the backend later.',
                    )

                    setShowModal(false)
                  }}
                >
                  Publish Announcement
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Announcements