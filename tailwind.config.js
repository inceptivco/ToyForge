/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    500: '#f43f5e', // Rose
                    600: '#e11d48',
                    900: '#881337',
                },
                clay: {
                    100: '#f5f5f5',
                    800: '#262626',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            keyframes: {
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                }
            },
            animation: {
                scroll: 'scroll 40s linear infinite',
                shimmer: 'shimmer 1.5s infinite',
            }
        },
    },
    plugins: [],
}
