import { useMemo, useState } from 'react'
import {
  analyticsSummary,
  headcountTrend,
  departmentDistribution,
  taskCompletion,
  leaveTrend,
  attritionData,
} from '../data/analytics'

function Analytics() {
  const [range, setRange] = useState('Last 8 months')

  const maxHeadcount = Math.max(
    ...headcountTrend.map((item) => item.employees),
  )

  const maxLeave = Math.max(
    ...leaveTrend.map(
      (item) =>
        item.annual +
        item.casual +
        item.medical,
    ),
  )

  const averageTaskCompletion = useMemo(() => {
    const total = taskCompletion.reduce(
      (sum, item) => sum + item.completed,
      0,
    )

    return Math.round(total / taskCompletion.length)
  }, [])

  return (
    <div className="module-page analytics-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="module-header">

        <div>
          <span className="module-eyebrow">
            INSIGHTS
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Understand workforce trends, attendance, productivity
            and organizational performance.
          </p>
        </div>

        <select
          className="analytics-range-selector"
          value={range}
          onChange={(event) =>
            setRange(event.target.value)
          }
        >
          <option>Last 8 months</option>
          <option>Last 6 months</option>
          <option>Last 3 months</option>
          <option>This year</option>
        </select>

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="analytics-summary-grid">

        {analyticsSummary.map((item) => (

          <div
            className={`analytics-summary-card ${item.type}`}
            key={item.title}
          >

            <div className="analytics-summary-top">

              <span>
                {item.title}
              </span>

              <span className="analytics-icon">
                {item.type === 'employees' && '♙'}
                {item.type === 'active' && '✓'}
                {item.type === 'attendance' && '◷'}
                {item.type === 'attrition' && '↘'}
              </span>

            </div>

            <strong>
              {item.value}
            </strong>

            <div className="analytics-change">

              <span>
                {item.change}
              </span>

              <small>
                {item.description}
              </small>

            </div>

          </div>

        ))}

      </section>


      {/* =================================================
          HEADCOUNT + DEPARTMENT
      ================================================= */}

      <section className="analytics-two-column">

        {/* HEADCOUNT */}

        <div className="content-card analytics-card">

          <div className="section-heading">

            <div>
              <h2>
                Headcount Trend
              </h2>

              <p>
                Employee growth over time.
              </p>
            </div>

            <span className="chart-value">
              248 employees
            </span>

          </div>


          <div className="headcount-chart">

            <div className="chart-y-axis">
              <span>250</span>
              <span>200</span>
              <span>150</span>
              <span>100</span>
            </div>

            <div className="headcount-bars">

              {headcountTrend.map((item) => {

                const height =
                  (item.employees / maxHeadcount) * 100

                return (
                  <div
                    className="headcount-bar-column"
                    key={item.month}
                  >

                    <div className="headcount-bar-value">
                      {item.employees}
                    </div>

                    <div className="headcount-bar-track">

                      <div
                        className="headcount-bar"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    </div>

                    <span>
                      {item.month}
                    </span>

                  </div>
                )
              })}

            </div>

          </div>

        </div>


        {/* DEPARTMENT DISTRIBUTION */}

        <div className="content-card analytics-card">

          <div className="section-heading">

            <div>
              <h2>
                Department Distribution
              </h2>

              <p>
                Workforce by department.
              </p>
            </div>

          </div>


          <div className="department-analytics-list">

            {departmentDistribution.map((item) => (

              <div
                className="department-analytics-item"
                key={item.department}
              >

                <div className="department-analytics-header">

                  <span>
                    {item.department}
                  </span>

                  <strong>
                    {item.employees}
                  </strong>

                </div>

                <div className="analytics-progress-track">

                  <div
                    className="analytics-progress-fill"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />

                </div>

                <small>
                  {item.percentage}% of workforce
                </small>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =================================================
          TASK COMPLETION
      ================================================= */}

      <section className="content-card analytics-card">

        <div className="section-heading">

          <div>
            <h2>
              Task Completion by Department
            </h2>

            <p>
              Percentage of assigned tasks completed.
            </p>
          </div>

          <div className="analytics-highlight">
            <strong>
              {averageTaskCompletion}%
            </strong>

            <span>
              Average completion
            </span>
          </div>

        </div>


        <div className="task-analytics-list">

          {taskCompletion.map((item) => (

            <div
              className="task-analytics-row"
              key={item.department}
            >

              <div className="task-department">
                <strong>
                  {item.department}
                </strong>
              </div>

              <div className="task-progress">

                <div className="task-progress-track">

                  <div
                    className="task-completed"
                    style={{
                      width: `${item.completed}%`,
                    }}
                  />

                </div>

                <span>
                  {item.completed}%
                </span>

              </div>

              <span className="task-pending">
                {item.pending}% pending
              </span>

            </div>

          ))}

        </div>

      </section>


      {/* =================================================
          LEAVE + ATTRITION
      ================================================= */}

      <section className="analytics-two-column">

        {/* LEAVE TREND */}

        <div className="content-card analytics-card">

          <div className="section-heading">

            <div>
              <h2>
                Leave Trend
              </h2>

              <p>
                Monthly leave activity.
              </p>
            </div>

          </div>


          <div className="leave-chart">

            <div className="leave-chart-grid">

              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>

            </div>


            <div className="leave-bars">

              {leaveTrend.map((item) => {

                const total =
                  item.annual +
                  item.casual +
                  item.medical

                const height =
                  (total / maxLeave) * 100

                return (
                  <div
                    className="leave-bar-column"
                    key={item.month}
                  >

                    <div className="leave-bar-value">
                      {total}
                    </div>

                    <div className="leave-bar-track">

                      <div
                        className="leave-bar"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    </div>

                    <span>
                      {item.month}
                    </span>

                  </div>
                )
              })}

            </div>

          </div>


          <div className="chart-legend">

            <span>
              <i className="legend-square annual" />
              Annual
            </span>

            <span>
              <i className="legend-square casual" />
              Casual
            </span>

            <span>
              <i className="legend-square medical" />
              Medical
            </span>

          </div>

        </div>


        {/* ATTRITION */}

        <div className="content-card analytics-card">

          <div className="section-heading">

            <div>
              <h2>
                Attrition Rate
              </h2>

              <p>
                Monthly employee attrition.
              </p>
            </div>

            <strong className="attrition-current">
              3.8%
            </strong>

          </div>


          <div className="attrition-chart">

            {attritionData.map((item) => {

              const height =
                (item.rate / 5) * 100

              return (
                <div
                  className="attrition-column"
                  key={item.month}
                >

                  <div className="attrition-value">
                    {item.rate}%
                  </div>

                  <div className="attrition-track">

                    <div
                      className="attrition-bar"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                  </div>

                  <span>
                    {item.month}
                  </span>

                </div>
              )
            })}

          </div>


          <div className="attrition-insight">

            <span>
              ↓
            </span>

            <div>
              <strong>
                Improving retention
              </strong>

              <p>
                Attrition has decreased by 0.6% compared with
                the previous quarter.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          INSIGHT SUMMARY
      ================================================= */}

      <section className="analytics-insight-grid">

        <div className="content-card insight-card">

          <span className="module-eyebrow">
            WORKFORCE
          </span>

          <h3>
            Engineering is your largest team
          </h3>

          <p>
            Engineering represents 33% of the total workforce,
            making it the organization's largest department.
          </p>

        </div>


        <div className="content-card insight-card">

          <span className="module-eyebrow">
            PRODUCTIVITY
          </span>

          <h3>
            Task completion remains strong
          </h3>

          <p>
            The organization currently maintains an average task
            completion rate of {averageTaskCompletion}%.
          </p>

        </div>


        <div className="content-card insight-card">

          <span className="module-eyebrow">
            RETENTION
          </span>

          <h3>
            Employee retention is improving
          </h3>

          <p>
            The current attrition rate is 3.8%, showing a gradual
            improvement compared with previous months.
          </p>

        </div>

      </section>

    </div>
  )
}

export default Analytics