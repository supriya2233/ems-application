/*
 * Where the demo lives. It is a separate database, so the demo can
 * be reset at any time without touching the real data in "ems".
 *
 * Override with environment variables if needed:
 *   DEMO_MONGO_URI  (default mongodb://127.0.0.1:27017/ems_demo)
 *   DEMO_PORT       (default 5055)
 */
export const DEMO_MONGO_URI = process.env.DEMO_MONGO_URI || 'mongodb://127.0.0.1:27017/ems_demo'
export const DEMO_PORT = Number(process.env.DEMO_PORT || 5055)

/* Refuse anything that doesn't look like a demo database. */
export function assertDemoDatabase(uri = DEMO_MONGO_URI) {
  const name = new URL(uri).pathname.replace(/^\//, '')
  if (!/demo/i.test(name)) {
    throw new Error(
      `Refusing to use "${name}": the demo database name must contain "demo" ` +
        '(this script deletes everything in it).',
    )
  }
  return name
}
