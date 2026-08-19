/**
 * Datos del evento, en un solo sitio.
 *
 * Todo lo de aquí sale de la página de Luma (https://luma.com/kbcjp3b4). Si allí
 * cambia una fecha o una sede, este archivo es el único que hay que tocar: la
 * portada, la cuenta atrás y el pie leen de aquí.
 */

export const EVENT = {
  name: "AWSpectrum Impact Lab",
  tagline: "Construye tecnología con impacto real",
  /** Inicio en UTC. 27 ago 2026, 16:00 en Ciudad de México (CST, UTC−6). */
  startsAt: "2026-08-27T22:00:00.000Z",
  endsAt: "2026-08-28T02:00:00.000Z",
  timeZone: "America/Mexico_City",
  /** Texto ya formateado: evitamos depender de Intl en el cliente para algo fijo. */
  dateLabel: "Jueves 27 de agosto, 2026",
  timeLabel: "16:00 – 20:00 h · CDMX",
  durationLabel: "3 horas de construcción",
  venue: {
    name: "Centro Cultural Futurama",
    address: "Cda. de Otavalo 15, Lindavista, Gustavo A. Madero, 07300 CDMX",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=19.4930664,-99.1333391",
  },
  registrationUrl: "https://luma.com/kbcjp3b4",
  hosts: ["Nico", "Aquiles"],
  organizers: [
    "AWSpectrum",
    "SBG UVEG",
    "SBG UNAM",
    "SBG FES Aragón",
    "SBG Centro",
    "UG Playa Vicente",
  ],
  /** Lo que cada participante se lleva a casa. */
  deliverables: [
    "Un MVP funcional y desplegado en AWS",
    "Un repositorio con tu historial de commits y pull requests",
    "Un README profesional del proyecto",
    "Un diagrama de arquitectura",
    "Un pitch de 3 minutos reutilizable en entrevistas",
  ],
  /** Lo que hay que traer. */
  bring: [
    "Tu laptop (indispensable)",
    "Cuenta de GitHub",
    "Ganas de trabajar en equipo",
  ],
} as const;

/** Roles dentro de cada equipo. El orden es el que se muestra. */
export const ROLES = [
  { id: "frontend", label: "Frontend", hint: "Interfaz, mapa y experiencia de uso" },
  { id: "backend", label: "Backend", hint: "Funciones Lambda y lógica de la API" },
  { id: "cloud", label: "Cloud", hint: "Infraestructura como código y despliegue" },
  { id: "data", label: "Base de datos", hint: "Modelo de datos y calidad de la información" },
  { id: "docs", label: "Documentación", hint: "README, diagrama y pitch final" },
] as const;

export type Role = (typeof ROLES)[number];
