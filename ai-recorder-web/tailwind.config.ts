import { colors } from "./styles/tailwind/color";

const px0_40 = new Array(41).fill(0).map((_, i) => `${i}px`);
const px0_300 = new Array(301).fill(0).map((_, i) => `${i}px`);

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        ...px0_300,
      },
      borderWidth: {
        ...px0_40,
      },
      borderRadius: {
        ...px0_40,
      },
      fontSize: {
        ...px0_300,
      },
      colors,
    },
  },
  plugins: [],
};
export default config;
