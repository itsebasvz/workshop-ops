// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import { TRACKS } from "./src/config/tracks.ts";
import { EVENT } from "./src/config/event.ts";

/**
 * La barra lateral se construye desde `tracks.ts`. Un track con `enabled: false`
 * no genera grupo, así que no aparece en el menú ni en el HTML compilado.
 */
const trackGroups = TRACKS.filter((track) => track.enabled).map((track) => ({
  label: `${track.emoji} ${track.name}`,
  items: [{ autogenerate: { directory: track.id } }],
}));

export default defineConfig({
  site: "https://safespace-network.vercel.app",
  integrations: [
    starlight({
      title: "SafeSpace Network",
      tagline: EVENT.tagline,
      description:
        "Guía del track SafeSpace Network del AWSpectrum Impact Lab: construye y " +
        "despliega una plataforma de recursos seguros para la comunidad LGBTQ+ sobre AWS.",
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
          href: "https://github.com/itsebasvz/safe-spot-aws-spectrum",
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
