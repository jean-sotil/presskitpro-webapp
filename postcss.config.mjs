/**
 * PostCSS pipeline. We use OKLCH directly; browser support is universal
 * (Safari 15.4+, Chrome 111+, Firefox 113+ — all shipped 2022–2023).
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
