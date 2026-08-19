# Sistema de diseño · SafeSpace Network

Documentación de la plataforma del **AWSpectrum Impact Lab**.
Fiel a la identidad de AWS Spectrum LATAM, ejecutada a nivel producto.

> Los valores de marca de este documento están **extraídos del `tailwind.config` real** de
> [awspectrum-latam.vercel.app](https://awspectrum-latam.vercel.app), no aproximados a ojo.

---

## 1. Punto de partida

El sitio de AWS Spectrum es cálido y acogedor, y esa calidez es el activo que hay que conservar.
Su ejecución, en cambio, es la de una landing hecha con Tailwind por CDN: `rounded-3xl` en todos
los elementos, sombras de colores en cada tarjeta, tres saltos de tamaño tipográfico sin escala
intermedia y GSAP cargado para animar entradas.

La marca es buena. Lo que se sube de nivel aquí es la ejecución.

| | AWS Spectrum | Esta plataforma |
| --- | --- | --- |
| Degradado arcoíris | wordmark, bordes, barra de scroll, adornos | **solo señales de estructura** |
| Radios | 24 / 12 px y `rounded-full` mezclados | escala de 4 pasos, asignada por rol |
| Tipografía | `text-4xl → 5xl → 7xl` | escala modular fluida con `clamp()` |
| Sombras de color | en todas las tarjetas | **una por página**, como énfasis |
| Movimiento | GSAP + ScrollTrigger + confeti | CSS, 130–190 ms |
| Temas | claro y oscuro | claro y oscuro, **recalibrados por separado** |

### Los siete movimientos

1. **El arcoíris pasa de decoración a señal.** Se reserva para indicar estructura: el riel de
   3 px de la cabecera, el indicador de página activa en la barra lateral, el filete bajo cada
   `h2` y la línea del pie. Nunca como relleno de fondo, nunca dentro de un botón. Aparece
   menos y por eso significa más. La única excepción es el wordmark del hero, donde el
   degradado **es** la marca.
2. **Escala tipográfica fluida.** Cada paso interpola entre 360 px y 1280 px de viewport, así
   que no hay saltos bruscos al redimensionar. Outfit 800 con `letter-spacing: -0.03em` en los
   tamaños grandes: ese detalle solo ya separa un titular compuesto de uno por defecto.
3. **Radios por rol, no por gusto.** Cuatro pasos, cada uno asignado a un tipo de elemento.
4. **Elevación con jerarquía.** La sombra tricolor de AWS Spectrum es el hallazgo más bonito de
   su CSS y se conserva —atenuada— pero reservada a **un solo elemento protagonista por
   página**. Todo lo demás usa sombras neutras y filetes de 1 px.
5. **Profundidad por superficie.** Cuatro capas de fondo separadas por filetes. La jerarquía se
   construye con contraste de superficie, no con sombras grandes.
6. **Movimiento discreto.** Cero dependencias de animación. Transiciones de 130–190 ms, una
   aparición al scroll de 420 ms y un punto que late en el distintivo del hero. Nada más, y
   todo bajo `prefers-reduced-motion`.
7. **La barra superior es un producto, no un adorno.** El buscador tiene ancho propio y máximo,
   altura de control y las teclas del atajo dibujadas como teclas; el tema se cambia con un
   icono. Es lo primero que se ve en las 6 páginas y en las 71 pantallas del taller.

---

## 2. Arquitectura de tokens

Tres capas, en orden de carga. Cada una solo puede usar la anterior.

```
tokens.css      Capa 1 · Primitivas     valores crudos, sin significado
theme.css       Capa 2 · Semántica      qué es cada cosa + puente con Starlight
components.css  Capa 3 · Componentes    solo consume la capa 2
```

**La regla que sostiene el sistema:** ningún componente escribe un hex. Si hace falta un color
nuevo, primero se declara arriba. Así cambiar el tema es cambiar la capa 2, y nada más.

---

## 3. Color

### Paradas de marca

| Token | Hex | Papel |
| --- | --- | --- |
| `--c-red` | `#EF4444` | parada 1 |
| `--c-orange` | `#F97316` | parada 2 |
| `--c-green` | `#22C55E` | parada 3 · también estado correcto |
| `--c-blue` | `#2563EB` | parada 4 · acento del track SafeSpace |
| `--c-purple` | `#7C3AED` | parada 5 · acento reservado al segundo track |

Los acentos de track tienen dos formas. `--track-blue` y `--track-purple` son los colores de
marca y se usan como **filete**; `--track-blue-ink` y `--track-purple-ink` son las versiones
aclaradas en tema oscuro y se usan cuando el acento es **texto**. Ver §7.

```css
--pride: linear-gradient(135deg, #ef4444 0%, #f97316 25%, #22c55e 50%, #2563eb 75%, #7c3aed 100%);
```

### Acción

**Un solo color de acción en todo el sitio: el naranja de AWS.** Si algo es naranja, se puede
pulsar. Esa correspondencia es la que hace que una interfaz se entienda sin leerla.

| Token | Hex | Uso |
| --- | --- | --- |
| `--c-action` | `#FF9900` | rellenos: botones, indicadores, foco |
| `--c-action-hover` | `#E08800` | hover de relleno |
| `--c-action-ink` | `#8A5200` | **texto** de acción sobre fondo claro |

> **Por qué existe `--c-action-ink`.** `#FF9900` sobre blanco da **2.1:1** y no alcanza AA como
> texto. En tema claro el relleno sigue siendo el naranja puro —sobre él va texto oscuro— pero
> los enlaces y el texto de acento usan la versión entintada. Es el error de accesibilidad más
> común al adoptar una paleta de marca: dar por hecho que un color vale para todo.

### Superficies y texto

| Semántico | Oscuro | Claro |
| --- | --- | --- |
| `--bg` | `#090D16` | `#FFFFFF` |
| `--surface` | `#111827` | `#F8FAFC` |
| `--surface-raised` | `#1E293B` | `#FFFFFF` |
| `--ink` | `#FFFFFF` | `#0F172A` |
| `--ink-body` | `#F1F5F9` | `#334155` |
| `--ink-muted` | `#CBD5E1` | `#475569` |
| `--ink-dim` | `#94A3B8` | `#64748B` |

`#090D16` y `#111827` son `darkBg` y `darkCard` de AWS Spectrum.

> **Corrección de una extracción previa.** `#1E293B` **no es un token del tema de AWS Spectrum**
> —en su sitio aparece solo como relleno de ilustraciones SVG—. Sus superficies elevadas son
> `slate-900` (`#0F172A`). Aquí se usa `#1E293B` como capa elevada por decisión propia, porque
> encaja mejor entre `#111827` y el texto, no por herencia de su marca.

**El tema claro no es el oscuro invertido.** Los grises se recalibran uno a uno: el evento es
presencial, con proyector y luz de sala, donde el oscuro pierde legibilidad.

---

## 4. Tipografía

Outfit para títulos, Inter para texto. Las mismas de AWS Spectrum, pero **autoalojadas** con
`@fontsource-variable`: sin petición a Google Fonts, sin salto de composición al cargar y sin
depender de una CDN externa durante el taller.

| Token | Rango | Uso |
| --- | --- | --- |
| `--t-3xl` | 2.25 → 4 rem | titular de portada |
| `--t-2xl` | 1.75 → 2.625 rem | `h1` de guía · títulos de sección de la portada |
| `--t-xl` | 1.375 → 1.875 rem | `h2` |
| `--t-lg` | 1.125 → 1.375 rem | `h3` |
| `--t-md` | 1 → 1.125 rem | entradillas |
| `--t-base` | 0.9375 → 1 rem | cuerpo |
| `--t-sm` | 0.8125 rem | texto secundario, código |
| `--t-xs` | 0.75 rem | etiquetas en versalitas |

**Tracking:** `-0.03em` en display, `-0.015em` en títulos, `+0.08em` en versalitas.
**Interlineado:** 1.08 en display, 1.25 en títulos, 1.65 en cuerpo.
**Medida:** `68ch` máximo en párrafos. Una línea más larga se lee peor, por bonita que quede.

---

## 5. Espaciado, radios y elevación

**Espaciado:** ritmo de 4 px, de `--s-1` (4 px) a `--s-24` (96 px).

**Radios — asignados por rol:**

| Token | Valor | Se aplica a |
| --- | --- | --- |
| `--r-sm` | 6 px | chips, insignias, código en línea |
| `--r-md` | 10 px | botones, campos, avisos |
| `--r-lg` | 14 px | tarjetas, bloques de código, terminal |
| `--r-xl` | 20 px | superficies grandes: billete, panel de track, cierre |
| `--r-full` | 999 px | píldoras y puntos |

**Elevación:**

| Token | Uso |
| --- | --- |
| `--e-1` … `--e-3` | escala neutra habitual |
| `--e-spectrum` | **énfasis, una vez por página** — la sombra tricolor |

```css
--e-spectrum:
  0 18px 40px -22px rgb(249 115 22 / 0.5),
  0 18px 40px -22px rgb(34 197 94 / 0.4),
  0 18px 40px -22px rgb(37 99 235 / 0.45);
```

---

## 6. Componentes

| Componente | Para qué | Detalle que importa |
| --- | --- | --- |
| `Hero` | portada | composición asimétrica; el único sitio con degradado sobre texto |
| `Ticket` | datos del evento | fecha, sede, formato y cuenta atrás en **un solo objeto** |
| `Countdown` | cuenta atrás | el servidor pinta ya los valores: sin parpadeo de ceros |
| `Stats` | cifras de portada | cada cifra lleva su procedencia debajo |
| `TrackPanel` | un track a lo ancho | descripción a la izquierda, arquitectura a la derecha |
| `Flow` | arquitectura | cada nodo dice servicio, función **y rol del equipo** |
| `Phases` | agenda | el ancho de cada barra es su peso real en los 180 min |
| `Terminal` | comandos | **copia solo los comandos**, nunca el `$` ni la salida |
| `Step` | paso numerado | para secuencias donde el orden importa |
| `Note` | aviso | 5 tipos: nota, atención, cuidado, truco, comunidad |
| `Reveal` | aparición al scroll | el estado inicial lo pone el script, no el CSS |

### Sustituciones de Starlight

| Override | Por qué |
| --- | --- |
| `Header` | su rejilla calculaba el ancho del buscador desde la barra lateral y lo dejaba estrecho; además envolvía todo en otro `.header`, duplicando el cristal y el filete |
| `ThemeSelect` | un `<select>` de tres opciones para algo de dos estados útiles; ahora es un botón con el icono del tema al que vas a cambiar |
| `ThemeProvider` | sin preferencia guardada el tema es **oscuro**, no el del sistema |
| `SiteTitle` | el nombre va como texto real, no como imagen |
| `Footer` | filete arcoíris y datos del evento |

### Por qué el billete

Antes eran tres tarjetas —cuándo, dónde, formato— más la cuenta atrás por su cuenta: cuatro
cajas grises diciendo cuatro cosas del mismo hecho. Reunidas en un objeto reconocible, con su
troquelado y su talón, ocupan menos y se leen de un vistazo. Es la única pieza de la interfaz
que se permite ser figurativa, y por eso funciona: si hubiera dos, ninguna llamaría la atención.

### Por qué `Terminal` copia solo los comandos

Es el componente que más se usará durante el taller. Si el botón copiara el bloque entero, quien
lo pegue arrastra el prompt `$` y la salida esperada, su terminal falla y pierde cinco minutos
sin entender por qué. Copiar solo los comandos es una decisión de diseño, no una comodidad.

### El color nunca va solo

Los avisos se distinguen por el color del filete izquierdo, **y además** por icono y por un
título en palabras. Quien no distinga los colores recibe la misma información.

---

## 7. Accesibilidad

Medido sobre la página renderizada con Playwright, resolviendo el fondo real de cada elemento
—no los valores que creíamos haber definido—. **38 pares en los dos temas: 76 medidas, todas
cumplen WCAG AA.** Se reproduce con `pnpm dev` en una terminal y `pnpm contrast` en otra.

| Elemento | Oscuro | Claro | Mínimo |
| --- | ---: | ---: | ---: |
| Titular del hero | 19.43:1 | 17.85:1 | 3:1 |
| Cifra destacada | 19.43:1 | 17.85:1 | 3:1 |
| Dato del billete | 17.74:1 | 17.06:1 | 4.5:1 |
| Entradilla | 13.09:1 | 7.58:1 | 4.5:1 |
| Párrafo de documentación | 11.95:1 | 7.24:1 | 4.5:1 |
| Enlace de barra lateral | 9.08:1 | 6.39:1 | 4.5:1 |
| Botón primario | 8.95:1 | 8.95:1 | 4.5:1 |
| Salida en terminal | 7.41:1 | 6.96:1 | 4.5:1 |
| Tecla del atajo (`Ctrl` `K`) | 5.71:1 | 4.76:1 | 4.5:1 |
| **Etiquetas y notas secundarias** | 6.92:1 | **4.55:1** | 4.5:1 |

> El par más ajustado es `--ink-dim` en tema claro: **4.55:1**, con 0.05 de margen. Si alguna vez
> se aclara ese token, deja de cumplir. Antes de tocarlo, volver a pasar `contrast.js`.

**Un fallo que encontró la medición:** el azul de marca `#2563EB` como *texto* sobre fondo
oscuro da 3.64:1 y no pasa. Como filete de 3 px es correcto —ahí no aplica el mínimo de texto—,
así que en lugar de cambiar el color de marca se añadieron `--track-blue-ink` y
`--track-purple-ink`, versiones aclaradas que se usan **solo cuando el acento es una palabra y
no una barra**. El filete sigue siendo el azul exacto de AWS Spectrum.

Además:

- **Foco visible** en los 13 elementos interactivos de la portada, comprobado tabulando: 2 px de
  naranja con 3 px de separación.
- **Objetivos táctiles** de 44 px de alto mínimo en botones; 36 px en los iconos de la barra.
- **Un solo `h1` visible por página** (Starlight añadía un segundo en la portada; se oculta).
- **Movimiento reducido** respetado: con la preferencia activa quedan 0 elementos animando y
  0 elementos ocultos por la aparición al scroll —el contenido se ve entero desde el principio.
- **El interruptor de tema** cambia, guarda y sobrevive a la recarga; su `aria-label` anuncia la
  acción, no el estado.
- **Sin desbordamiento horizontal** a 390, 900 ni 1440 px, en los dos temas.

> **Ojo con los desbordamientos que no se ven en el DOM.** El halo del hero era un bloque con
> `filter: blur(120px)`: el desenfoque pinta fuera de la caja y esos píxeles cuentan como scroll,
> pero como es un pseudoelemento no aparece recorriendo `querySelectorAll`. Se cambió por
> degradados radiales anclados a `inset-inline: 0`, que además se pintan más barato.

---

## 8. Reglas de uso de la marca

**Nunca:**

- Poner el degradado como fondo de un botón o de una tarjeta grande.
- Usar el naranja de AWS para algo que no se pueda pulsar.
- Cambiar las paradas del degradado o su orden.
- Aplicar `--e-spectrum` a más de un elemento por página.
- Escribir un hex dentro de un componente.

**Siempre:**

- El degradado señalando estructura, en franjas de 2–3 px.
- Un solo color de acción.
- Comprobar los dos temas antes de dar algo por terminado.

---

## 9. El logo

`Logo.jpg` original: **2080 × 1368 px, 409 KB, en CMYK** — un archivo de imprenta, inservible
para una cabecera web.

Se vectorizó de verdad, no se redibujó a ojo: se separaron por máscaras el anillo, los ojos y la
sonrisa, se trazaron con potrace y se recompusieron en SVG.

**El degradado del logo es cónico.** Midiendo los centroides de los cinco colores de marca sobre
el original, describen un arco de ~255° alrededor del centro de la nube, no una línea recta. SVG
no tiene degradados cónicos, así que se reproduce con **cuñas angulares de 5° recortadas por la
silueta**, cada una con su degradado lineal entre los colores de sus bordes. Un degradado lineal
habría puesto el violeta en el sitio equivocado; una malla de radiales convertía las mezclas en
marrón.

**La nube interior se rellena de forma explícita.** El original la deja transparente porque
asume fondo blanco; sobre el fondo oscuro del sitio la cara desaparecía por completo.

Resultado: **19 KB (5 KB comprimido)** frente a 409 KB, escalable y correcto en ambos temas.

El script que lo genera está en [`../brand/build-logo.py`](../brand/build-logo.py).

---

## 10. Cómo extender esto

**Añadir un track** — un registro en `src/config/tracks.ts` y sus páginas en
`src/content/docs/<id>/`. La barra lateral y las tarjetas de la portada se generan solas. Un
track con `enabled: false` no aparece en ninguna parte, ni siquiera en el HTML compilado.

**Cambiar datos del evento** — `src/config/event.ts`. La portada, la cuenta atrás y el pie leen
de ahí.

**Añadir un componente** — usa solo tokens de la capa 2 y documéntalo en la tabla de la
sección 6.
