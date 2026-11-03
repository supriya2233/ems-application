import { useEffect, useRef, useState } from 'react'

/*
 * Chart colours (dataviz reference palette, validated for colour-
 * blind separation on white with scripts/validate_palette.js).
 * Hues are handed out in this fixed order and never cycled; a
 * colour follows its category, not its rank.
 * Three of them are below 3:1 contrast on white, so every chart
 * also has a legend with values and a table view.
 */
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']

export const seriesColor = (index) => SERIES_COLORS[index] ?? '#98a2b3'

/* Gives each name a colour by its position in a fixed list. */
export const colorsFor = (names) =>
  Object.fromEntries(names.map((name, index) => [name, seriesColor(index)]))

/* 125000 → "1.3L", 1200 → "1.2k": short labels for axes. */
export const formatCompact = (value) => {
  const n = Number(value) || 0
  if (Math.abs(n) >= 1e7) return `${+(n / 1e7).toFixed(1)}Cr`
  if (Math.abs(n) >= 1e5) return `${+(n / 1e5).toFixed(1)}L`
  if (Math.abs(n) >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  return String(Math.round(n * 10) / 10)
}

/* "Nice" axis maximum and three or four ticks from 0. */
export const niceTicks = (max, count = 4) => {
  if (!max || max <= 0) return { top: 1, ticks: [0, 1] }

  const rough = max / count
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough)
  const top = Math.ceil(max / step) * step
  const ticks = []

  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100)
  }

  return { top, ticks }
}

/* Width of an element, kept up to date when it resizes. */
export function useElementWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width))
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
