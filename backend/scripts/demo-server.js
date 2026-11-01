/*
 * Runs the normal backend against the demo database:
 *   npm run demo        → http://localhost:5055, database "ems_demo"
 *
 * Fill the demo database first with `npm run seed:demo`.
 * The real backend (npm run dev, port 5000, database "ems") can run
 * at the same time; the two never share data.
 */
import { DEMO_MONGO_URI, DEMO_PORT, assertDemoDatabase } from './demo-config.js'

assertDemoDatabase()

// server.js reads these; values set here win over backend/.env.
process.env.MONGO_URI = DEMO_MONGO_URI
process.env.PORT = String(DEMO_PORT)

await import('../src/server.js')
