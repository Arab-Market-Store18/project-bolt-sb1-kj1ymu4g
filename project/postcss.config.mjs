/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // <--- هذا هو السطر الوحيد الذي تمت إضافته
  },
};

export default config;
