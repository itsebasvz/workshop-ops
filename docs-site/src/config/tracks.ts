/**
 * Tracks del Impact Lab — única fuente de verdad.
 *
 * La barra lateral, las tarjetas de la portada y las rutas de contenido se
 * generan desde aquí. Un track con `enabled: false` no aparece en ninguna parte
 * del sitio: ni en el menú, ni en la portada, ni en el HTML generado.
 *
 * Para publicar un track: escribe sus páginas en `src/content/docs/<id>/` y pon
 * `enabled: true`. No hay que tocar nada más.
 */

export interface Track {
  id: string;
  name: string;
  emoji: string;
  /** Una línea, la que se ve en la tarjeta de la portada. */
  summary: string;
  /** Color de acento; debe existir como token --track-<accent> en theme.css. */
  accent: "blue" | "purple";
  /** Servicios de AWS que se usan, para la tarjeta. */
  services: string[];
  /**
   * La arquitectura en orden de recorrido de una petición. Se dibuja como flujo
   * en la portada, así que el orden importa: es el camino que sigue el dato.
   * `via` marca un servicio al que ese nodo llama de lado, fuera de la cadena.
   */
  stack: Array<{ service: string; role: string; what: string; via?: string }>;
  enabled: boolean;
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
    services: ["S3", "API Gateway", "Lambda", "DynamoDB"],
    stack: [
      { service: "S3", role: "Frontend", what: "Sirve el mapa y la interfaz" },
      { service: "API Gateway", role: "Cloud", what: "La puerta de entrada HTTP" },
      {
        service: "Lambda",
        role: "Backend",
        what: "La lógica, sin un servidor que mantener",
        via: "Bedrock",
      },
      { service: "DynamoDB", role: "Base de datos", what: "Los lugares seguros" },
    ],
    enabled: true,
  },
  {
    id: "sorority",
    name: "Sorority",
    emoji: "💜",
    summary:
      "Una plataforma que fortalece las redes de apoyo entre mujeres, con " +
      "registro de contactos de confianza y propagación de alertas en la red.",
    accent: "purple",
    services: ["S3", "API Gateway", "Lambda", "DynamoDB"],
    stack: [
      { service: "S3", role: "Frontend", what: "La interfaz de la red de apoyo" },
      { service: "API Gateway", role: "Cloud", what: "La puerta de entrada HTTP" },
      { service: "Lambda", role: "Backend", what: "Alertas y contactos de confianza" },
      { service: "DynamoDB", role: "Base de datos", what: "La red de cada persona" },
    ],
    // Pendiente de contenido. Mientras esté en false no se renderiza en ningún sitio.
    enabled: false,
  },
];

/** Los tracks que sí se publican. Úsalo siempre en lugar de TRACKS. */
export const activeTracks = (): Track[] => TRACKS.filter((t) => t.enabled);
