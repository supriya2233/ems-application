/*
 * Live updates with Server-Sent Events (SSE).
 *
 * The browser opens one long-lived GET request (EventSource) and
 * the server keeps writing small text messages into it:
 *
 *   event: activity
 *   data: {"type":"leave.approved", ...}
 *
 * It is one-way (server → browser), built into every browser and
 * needs no extra library. Actions still go through the normal API.
 */

const clients = new Set()

/* Format one SSE message (pure, tested). */
export function formatSSE(eventName, data) {
  return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
}

export function broadcast(eventName, data) {
  const message = formatSSE(eventName, data)

  for (const res of clients) {
    res.write(message)
  }
}

export function clientCount() {
  return clients.size
}

/* GET /api/stream */
export function streamHandler(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.flushHeaders()

  // Ask the browser to wait 3 s before reconnecting if we drop.
  res.write('retry: 3000\n\n')
  res.write(formatSSE('ready', { at: new Date().toISOString() }))

  clients.add(res)

  // A comment line every 25 s keeps proxies from closing an
  // idle connection.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
  })
}
