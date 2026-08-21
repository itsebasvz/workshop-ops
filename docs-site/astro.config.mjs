// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import { TRACKS } from "./src/config/tracks.ts";
import { EVENT } from "./src/config/event.ts";

/**
 * La barra lateral se construye desde `tracks.ts`, y filtra por `guideReady`,
 * no por `announced`: un track anunciado en la portada pero sin páginas
 * escritas generaría un menú que lleva a rutas inexistentes.
 */
const trackGroups = TRACKS.filter((track) => track.guideReady).map((track) => ({
  label: `${track.emoji} ${track.name}`,
  items: [{ autogenerate: { directory: track.id } }],
}));

export default defineConfig({
  // Es la que va en el sitemap y en las URL canónicas, así que tiene que ser
  // la definitiva. `safespace-network.vercel.app` sigue respondiendo —era la
  // anterior y puede estar compartida por ahí— pero ya no es la de referencia.
  site: "https://awspectrum-impact-lab.vercel.app",
  integrations: [
    starlight({
      title: "SafeSpace Network",
      tagline: EVENT.tagline,
      description:
        "Guía del track SafeSpace Network del AWSpectrum Impact Lab: construye y " +
        "despliega un directorio de recursos con procedencia visible para la comunidad LGBTQ+ sobre AWS.",
      defaultLocale: "root",
      locales: {
        root: { label: "Español", lang: "es-MX" },
      },
      logo: {
        src: "./public/logo.svg",
        alt: "AWSpectrum LATAM",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: [
        "@fontsource-variable/outfit",
        "@fontsource-variable/inter",
        "./src/styles/tokens.css",
        "./src/styles/theme.css",
        "./src/styles/components.css",
      ],
      components: {
        Header: "./src/components/overrides/Header.astro",
        ThemeProvider: "./src/components/overrides/ThemeProvider.astro",
        SiteTitle: "./src/components/overrides/SiteTitle.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
        Footer: "./src/components/overrides/Footer.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/itsebasvz/awspectrum-safe-space",
        },
        { icon: "instagram", label: "Instagram", href: "https://instagram.com/awspectrum.latam" },
      ],
      sidebar: [
        {
          label: "Antes de empezar",
          items: [{ autogenerate: { directory: "empezar" } }],
        },
        ...trackGroups,
      ],
      pagination: true,
      lastUpdated: false,
      credits: false,
    }),
  ],
});
