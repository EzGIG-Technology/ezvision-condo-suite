/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1640', 800: '#111F52', 700: '#16235A', 600: '#1E2B5E', 500: '#2A3A78' },
        night: { DEFAULT: '#0A1230', deep: '#060C22', panel: '#111C44', line: '#1E2B5E', field: '#0C1638' },
        brand: { DEFAULT: '#1D4FE0', dark: '#1842BF', soft: '#E8EEFF', ink: '#1D3FB0', light: '#7FA6FF' },
        teal: { DEFAULT: '#14A38F', dark: '#0B6B5F', soft: '#E3F6F3', bright: '#2DD4BF' },
        ice: '#F3F6FC',
        line: { DEFAULT: '#E3E9F4', soft: '#EEF2F8', strong: '#D6DEEE' },
        muted: { DEFAULT: '#5B6585', dark: '#3A4468', light: '#9FB0DB' },
        danger: { DEFAULT: '#D92D20', ink: '#B42318', soft: '#FDECEC', dot: '#E5484D' },
        warn: { DEFAULT: '#F59E0B', ink: '#A34A06', soft: '#FFF3E0' },
        grape: { soft: '#F1EBFF', ink: '#5B34B8' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,22,64,.04), 0 10px 28px -16px rgba(11,22,64,.12)',
        pop: '0 20px 48px -12px rgba(11,22,64,.35)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.45' } },
        scan: { '0%,100%': { top: '15%' }, '50%': { top: '85%' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'slide-up': 'slide-up .2s ease-out',
        'slide-in-right': 'slide-in-right .22s ease-out',
        'slide-in-left': 'slide-in-left .22s ease-out',
        pulse2: 'pulse2 1.6s ease-in-out infinite',
        scan: 'scan 1.2s ease-in-out infinite',
        shake: 'shake .4s ease-in-out',
      },
    },
  },
  plugins: [],
};
