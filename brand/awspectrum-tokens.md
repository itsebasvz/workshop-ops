# Design tokens — AWS Spectrum LATAM

Extraídos del CSS del sitio oficial **https://awspectrum-latam.vercel.app** el 2026-08-18.
No son valores inventados ni aproximados: son los que usa la comunidad.

Fuentes cruzadas: [linktr.ee/awspectrum.latam](https://linktr.ee/awspectrum.latam) ·
Instagram y TikTok `@awspectrum.latam`.

---

## Identidad

| | |
| --- | --- |
| Nombre | **AWSPECTRUM LATAM** |
| Tagline | *Cloud • Community • Diversity* |
| Misión | «Construyendo visibilidad LGBTQ+ dentro del ecosistema cloud» |
| Símbolos | 🌈 arcoíris + ☁️ nube |

---

## Color

### Degradado de marca

```css
linear-gradient(135deg, #EF4444 0%, #F97316 25%, #22C55E 50%, #2563EB 75%, #7C3AED 100%)
```

Aparece también en variantes `180deg` y `to right`. Los cinco tonos son los `*-500` de la escala de
Tailwind: rojo, naranja, verde, azul y violeta.

| Parada | Hex |
| --- | --- |
| Rojo | `#EF4444` |
| Naranja | `#F97316` |
| Verde | `#22C55E` |
| Azul | `#2563EB` |
| Violeta | `#7C3AED` |

### Acento AWS

| Token | Hex |
| --- | --- |
| AWS Orange | `#FF9900` |
| AWS Orange · hover | `#E08800` |

### Superficies y texto

| Token | Hex | Uso |
| --- | --- | --- |
| Fondo | `#090D16` | base de la página |
| Superficie | `#111827` | paneles |
| Superficie elevada | `#1E293B` | tarjetas, popups |
| Texto | `#FFFFFF` | títulos |
| Texto suave | `#F1F5F9` | cuerpo |
| Texto apagado | `#CBD5E1` | secundario |
| Bordes | `rgba(148, 163, 184, …)` | separadores |

---

## Tipografía

```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap
```

| Familia | Pesos | Uso en Safe Spot |
| --- | --- | --- |
| **Outfit** | 400–800 | títulos, botones, nombres de lugar |
| **Inter** | 300–700 | cuerpo de texto e interfaz |

---

## Cómo se aplican en Safe Spot

Todos los tokens viven como custom properties al principio de
`awspectrum-safe-spot/frontend/styles.css`:

```css
:root {
  --pride: linear-gradient(135deg, #ef4444 0%, #f97316 25%, #22c55e 50%, #2563eb 75%, #7c3aed 100%);
  --aws-orange: #ff9900;
  --bg: #090d16;
  --surface: #111827;
  --surface-raised: #1e293b;
  /* … */
}
```

Decisiones de aplicación:

- El degradado se usa **con moderación**: una barra de 4 px arriba y el wordmark. Convertirlo en
  fondo de botones o tarjetas quitaría legibilidad y lo volvería decoración.
- El naranja de AWS queda reservado para **acción**: botones primarios, chip de filtro activo, marcador
  seleccionado y anillo de foco. Así el color comunica algo en vez de solo adornar.
- El tema oscuro no es solo estético: el mapa de Amazon Location se pide con `color-scheme=Dark`, de
  modo que la aplicación y el mapa son un mismo objeto visual.
