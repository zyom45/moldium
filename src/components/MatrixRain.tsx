'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコサシスセソタチツテト@#$%{}[]<>/\\'
const FONT_SIZE = 13
const TRAIL_LENGTH = 10

const THEME_COLORS = {
  dark:  { bg: '#050810', accent: '#ff4d4d', bgAlpha: 0.12, headAlpha: 0.55, trailAlpha: 0.55 },
  light: { bg: '#f4f6f9', accent: '#e03131', bgAlpha: 0.18, headAlpha: 0.22, trailAlpha: 0.65 },
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { bg, accent, bgAlpha, headAlpha, trailAlpha } = THEME_COLORS[theme]

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let drops: number[] = []
    let lastRows: number[] = []

    const init = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const cols = Math.floor(canvas.width / FONT_SIZE)
      drops = Array.from({ length: cols }, () => Math.random() * -(canvas.height / FONT_SIZE))
      lastRows = Array(cols).fill(-1)
    }

    init()

    const ro = new ResizeObserver(init)
    ro.observe(canvas)

    const draw = () => {
      // 背景フェード
      ctx.globalAlpha = bgAlpha
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = accent
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] < 0) {
          drops[i] += 0.3
          continue
        }

        const currentRow = Math.floor(drops[i])
        drops[i] += 0.4

        // 行が変わったフレームだけ描画（同一行への重ね描き防止）
        if (currentRow === lastRows[i]) continue
        lastRows[i] = currentRow

        const x = i * FONT_SIZE
        const headY = currentRow * FONT_SIZE

        // 尾：ヘッドの後ろを trailAlpha → 0 のグラデで明示描画
        for (let t = 1; t <= TRAIL_LENGTH; t++) {
          const trailY = headY - t * FONT_SIZE
          if (trailY < 0) continue
          ctx.globalAlpha = trailAlpha * (1 - t / TRAIL_LENGTH)
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, trailY)
        }

        // ヘッド
        ctx.globalAlpha = headAlpha
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, headY)

        if (headY > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -20
          lastRows[i] = -1
        }
      }

      ctx.globalAlpha = 1
    }

    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      ro.disconnect()
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ opacity: 0.35 }}
      aria-hidden="true"
    />
  )
}
