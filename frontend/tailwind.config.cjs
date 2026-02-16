module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#0f1117',
          surface: '#161921',
          card: '#1c1f2e',
          'card-hover': '#232738',
          border: '#2a2d3e',
          'border-light': '#353849',
        },
        priority: {
          critical: '#ef4444',
          high: '#f59e0b',
          medium: '#3b82f6',
          low: '#22c55e',
        }
      },
    },
  },
  plugins: [],
}
