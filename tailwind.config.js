/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'ui-rounded', 'sans-serif'],
      },
      colors: {
        // Fundo "preto claro", nao preto puro: reduz o brilho de borda em
        // tela OLED e cansa menos a vista de crianca.
        space: {
          950: '#07090f',
          900: '#0b0e14',
          850: '#11151e',
          800: '#171c28',
          700: '#232a3a',
          600: '#333d52',
        },
        // Tokens dos recursos. Variantes CLARAS de proposito: o fundo e
        // quase preto e todo texto colorido precisa passar em WCAG AA (4.5:1).
        oxygen: '#7dd3fc',
        power: '#fbbf24',
        food: '#4ade80',
        radiation: '#fb7185',
        radiationDeep: '#9f1239',
        science: '#60a5fa',
        life: '#2dd4bf',
        gravity: '#c4b5fd',
      },
      keyframes: {
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'deal': {
          '0%': { opacity: '0', transform: 'translateY(40px) rotate(-6deg) scale(.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0) scale(1)' },
        },
        'drift': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-ring': {
          '0%': { opacity: '.7', transform: 'scale(.95)' },
          '100%': { opacity: '0', transform: 'scale(1.35)' },
        },
      },
      animation: {
        'card-in': 'card-in .45s cubic-bezier(.2,.9,.3,1) both',
        'fade-in': 'fade-in .5s ease both',
        'deal': 'deal .5s cubic-bezier(.2,.9,.3,1) both',
        'drift': 'drift 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
