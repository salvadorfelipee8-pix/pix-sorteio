import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  '#0D0D0D',
          surface:  '#141414',
          elevated: '#1A1A1A',
          glass:    'rgba(255,255,255,0.04)',
        },
        gold: {
          DEFAULT: '#FFD700',
          soft:    '#C9A227',
          dim:     '#8A6E00',
          glow:    'rgba(255,215,0,0.15)',
        },
        mint: {
          DEFAULT: '#00FFA3',
          dim:     '#00CC82',
          glow:    'rgba(0,255,163,0.12)',
        },
        danger: '#FF4D4D',
        text: {
          primary:   '#F5F5F5',
          secondary: '#A0A0A0',
          muted:     '#555555',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        hero:  ['clamp(2.5rem,6vw,5rem)',  { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        title: ['clamp(1.8rem,4vw,3rem)',  { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        xl2:   ['clamp(1.2rem,2vw,1.5rem)',{ lineHeight: '1.3' }],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #C9A227 100%)',
        'gold-radial':   'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
        'hero-mesh':     `
          radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255,215,0,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0,255,163,0.04) 0%, transparent 60%),
          #0D0D0D
        `,
        'card-shine':    'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, transparent 50%, rgba(255,215,0,0.04) 100%)',
      },
      boxShadow: {
        gold:    '0 0 30px rgba(255,215,0,0.2), 0 4px 20px rgba(0,0,0,0.8)',
        'gold-sm': '0 0 12px rgba(255,215,0,0.15)',
        mint:    '0 0 20px rgba(0,255,163,0.2)',
        card:    '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        deep:    '0 20px 60px rgba(0,0,0,0.8)',
      },
      borderColor: {
        gold:    'rgba(255,215,0,0.2)',
        'gold-bright': 'rgba(255,215,0,0.5)',
        glass:   'rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'slide-up':    'slideUp 0.5s ease-out forwards',
        'fade-in':     'fadeIn 0.4s ease-out forwards',
        'digit-roll':  'digitRoll 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
        'shimmer':     'shimmer 2s linear infinite',
        'progress':    'progressFill 1.5s ease-out forwards',
        'confetti':    'confetti 1s ease-out forwards',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(255,215,0,0.1)' },
          '50%':     { boxShadow: '0 0 40px rgba(255,215,0,0.3)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        digitRoll: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progressFill: {
          from: { width: '0%' },
        },
        confetti: {
          '0%':   { transform: 'scale(0) rotate(0deg)',   opacity: '1' },
          '100%': { transform: 'scale(1.5) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
