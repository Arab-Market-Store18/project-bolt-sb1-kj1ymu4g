import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ArabMarket",
    short_name: "ArabMarket",
    description: "المتجر الإلكتروني العربي",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    icons: [

    ],
    lang: "ar",
    dir: "rtl",
  }
}
