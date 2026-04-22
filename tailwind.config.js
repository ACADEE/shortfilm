/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'studio-bg': '#0a0a0a',
        'studio-panel': '#141414',
        'studio-card': '#1e1e1e',
        'studio-border': '#2a2a2a',
        'studio-muted': '#666666',
        'duan-red': '#e8233a',
        'duan-red-dark': '#c41e33',
        'status-pending': '#666666',
        'status-queued': '#d97706',
        'status-processing': '#3b82f6',
        'status-ready': '#22c55e',
        'status-error': '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      aspectRatio: {
        '9/16': '9 / 16',
      },
    },
  },
  plugins: [],
}
