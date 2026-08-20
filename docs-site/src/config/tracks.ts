/**
 * Tracks del Impact Lab — única fuente de verdad.
 *
 * La barra lateral, las tarjetas de la portada y las rutas de contenido se
 * generan desde aquí. Hay dos interruptores, y son distintos a propósito:
 *
 * - `announced`: el track se anuncia en la portada. Es una decisión de
 *   comunicación —lo que la gente ve al elegir— y no depende de que la
 *   documentación esté escrita.
 * - `guideReady`: el track tiene páginas en `src/content/docs/<id>/`. Solo
 *   entonces aparece en la barra lateral y su tarjeta enlaza a la guía.
 *
 * Separarlos permite anunciar un track cuyo material aún se está redactando
 * sin generar un menú que lleve a páginas que no existen.
 */

export interface Track {
  id: string;
  name: string;
  emoji: string;
  /** Una línea, la que se ve en la tarjeta de la portada. */
  summary: string;
  /** Color de acento; debe existir como token --track-<accent> en theme.css. */
  accent: "blue" | "purple";
  /** Se anuncia en la portada. */
  announced: boolean;
  /** Tiene páginas escritas: entra en la barra lateral y su tarjeta enlaza. */
  guideReady: boolean;
}

export const TRACKS: Track[] = [
  {
    id: "safespace",
    name: "SafeSpace Network",
    emoji: "🌈",
    summary:
      "Una plataforma para que las personas de la comunidad LGBTQ+ encuentren " +
      "rápido recursos confiables en su ciudad: organizaciones, apoyo psicológico " +
      "y legal, refugios y centros comunitarios.",
    accent: "blue",
    announced: true,
    guideReady: true,
  },
  {
    id: "sorority",
    name: "Sorority",
    emoji: "💜",
    summary:
      "Una plataforma que fortalece las redes de apoyo entre mujeres, con " +
      "registro de contactos de confianza y propagación de alertas en la red.",
    accent: "purple",
    announced: true,
    guideReady: false,
  },
];

/** Los que se anuncian en la portada. */
export const announcedTracks = (): Track[] => TRACKS.filter((t) => t.announced);

/** Los que tienen guía escrita: barra lateral y enlaces. */
export const documentedTracks = (): Track[] => TRACKS.filter((t) => t.guideReady);

/**
 * La arquitectura, una sola vez.
 *
 * Los dos tracks se construyen con los mismos cuatro servicios y el mismo
 * reparto de roles: dibujar el diagrama dentro de cada tarjeta repetía cuatro
 * nodos casi idénticos y hacía parecer que eran dos arquitecturas distintas.
 * Es justo al revés, y es el argumento de la sección: elijas el que elijas,
 * aprendes lo mismo.
 *
 * El orden importa: es el camino que recorre una petición.
 */
export const STACK = [
  { service: "S3", role: "Frontend", what: "Sirve la interfaz en el navegador" },
  { service: "API Gateway", role: "Cloud", what: "La puerta de entrada HTTP" },
  {
    service: "Lambda",
    role: "Backend",
    what: "La lógica, sin un servidor que mantener",
  },
  { service: "DynamoDB", role: "Base de datos", what: "Los datos de la aplicación" },
] as const;

/** Lo único que se sale del tronco común. */
export const STACK_NOTE =
  "SafeSpace Network añade Amazon Bedrock para la búsqueda en lenguaje natural.";
