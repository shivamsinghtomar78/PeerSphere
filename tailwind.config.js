/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism color palette
        // Primary accent colors
        accent: {
          DEFAULT: 'var(--ps-accent)',
          dark: 'var(--ps-accent-dark)',
          light: 'var(--ps-accent-light)',
        },
        
        // Surface colors for glass cards
        surface: {
          DEFAULT: 'var(--ps-surface)',
          raised: 'var(--ps-surface-raised)',
          sunken: 'var(--ps-surface-sunken)',
        },
        
        // Canvas/background colors
        canvas: {
          DEFAULT: 'var(--ps-canvas)',
          subtle: 'var(--ps-canvas-subtle)',
        },
        
        // Text colors
        text: {
          DEFAULT: 'var(--ps-text)',
          muted: 'var(--ps-text-muted)',
          faint: 'var(--ps-text-faint)',
          inverse: 'var(--ps-text-inverse)',
        },
        
        // Border colors
        border: {
          DEFAULT: 'var(--ps-border)',
          strong: 'var(--ps-border-strong)',
          subtle: 'var(--ps-border-subtle)',
        },
        
        // Semantic colors
        success: 'var(--ps-success)',
        warning: 'var(--ps-warning)',
        danger: 'var(--ps-danger)',
        info: 'var(--ps-info)',
        
        // Focus ring
        focus: 'var(--ps-focus)',
      },
      
      // Custom spacing for glassmorphism
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Custom border radius for glass effect
      borderRadius: {
        '4xl': '2rem',
        'glass': '1rem',
      },
      
      // Custom box shadows for glassmorphism
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.12)',
      },
      
      // Custom backdrop blur for glass effect
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      
      // Custom animation for transitions
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // Custom transition timing
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Custom transition duration
      transitionDuration: {
        'slow': '300ms',
        'slower': '400ms',
      },
    },
  },
  plugins: [],
};
