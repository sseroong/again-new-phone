import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        'ddak-orange': {
          50: '#FFF8F5',
          100: '#FFEDE4',
          200: '#FFD8C3',
          300: '#FFB899',
          400: '#FF926A',
          500: '#FF6B35',
          600: '#E85520',
          700: '#C24215',
          800: '#9C3613',
          900: '#7E2E14',
          950: '#441508',
        },
        'ddak-navy': {
          50: '#F3F6FB',
          100: '#E4EAF4',
          200: '#CED8EB',
          300: '#ACBDDC',
          400: '#849CC9',
          500: '#6880B6',
          600: '#5468A1',
          700: '#3E4F82',
          800: '#1B2A4A',
          900: '#141F38',
          950: '#0D1425',
        },
      },
    },
  },
} satisfies Partial<Config>;
