import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Editorial Design System
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // Editorial spacing rhythm
      spacing: {
        'editorial-xs': '2.5rem',   // 40px
        'editorial-sm': '3.75rem',  // 60px
        'editorial-md': '5rem',     // 80px
        'editorial-lg': '7.5rem',   // 120px
        'editorial-xl': '10rem',    // 160px
      },
      // Paper + Ink color palette
      colors: {
        // Editorial palette
        paper: '#FAFAF8',
        ink: '#0A0A0A',
        'ink-soft': '#52525B',
        'ink-lighter': '#A1A1AA',
        'accent-red': '#DC2626',
        'accent-yellow': '#FBBF24',
        'accent-blue': '#2563EB',

        // Keep existing CSS variables for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        none: '0',
      },
      // Editorial typography scale
      fontSize: {
        'headline-xl': ['64px', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'headline-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline-md': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-sm': ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-xs': ['20px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.75' }],
        'body': ['16px', { lineHeight: '1.75' }],
        'label': ['12px', { lineHeight: '1.5', letterSpacing: '0.15em' }],
      },
      // Border widths for rules
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      // Letter spacing
      letterSpacing: {
        'headline': '-0.02em',
        'label': '0.15em',
      },
    },
  },
  plugins: [],
} satisfies Config;
