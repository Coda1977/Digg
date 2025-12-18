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
        'editorial-sm': '5rem',     // 80px
        'editorial-md': '7.5rem',   // 120px
        'editorial-lg': '10rem',    // 160px
        'editorial-xl': '12.5rem',  // 200px
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
        'headline-xl': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],    // 96px
        'headline-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],     // 72px
        'headline-md': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],    // 60px
        'headline-sm': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],     // 48px
        'headline-xs': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],     // 32px
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],                                // 18px
        'body': ['1rem', { lineHeight: '1.65' }],                                      // 16px
        'label': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.05em' }],         // 12px
      },
      // Border widths for rules
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      // Letter spacing
      letterSpacing: {
        'headline': '-0.02em',
        'label': '0.05em',
      },
    },
  },
  plugins: [],
} satisfies Config;
