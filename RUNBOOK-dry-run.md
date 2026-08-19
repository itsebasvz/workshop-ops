# 🧪 Safe Spot — runbook del ensayo

**Cómo ejecutar el workshop exactamente como lo hará una participante, y qué debes ver en cada paso.**

Este documento vive **fuera** del repo que clonan las participantes. Es para el equipo.

- Repo del ensayo: `safe-spot-aws-spectrum/`
- Cuenta usada en la validación: `180670196186` · región `us-east-1`
- Fecha del ensayo: **2026-08-18**
- Resultado: ✅ ciclo completo verificado dos veces desde cero

---

## Tiempos reales medidos

| Paso | Tiempo | Bloque del Notion |
| --- | ---: | --- |
| `./scripts/preflight.sh` | 9 s | — |
| `sam build` | 3 s | 15 min · CloudShell + SAM |
| `sam deploy` (creación en frío) | **70 s** | 15 min · CloudShell + SAM |
| `./scripts/publish-frontend.sh` | 13 s | 15 min · primer resultado visual |
| `python3 scripts/seed.py` | 2 s | 15 min · datos con significado |
| **Total de cero a app funcionando** | **97 s** | |
| `sam sync --code` (por función) | ~2 s | 20 min · experimentación |
| `./scripts/cleanup.sh` | ~40 s | 15 min · demo + cleanup |

> **Gate C del Notion superado con margen enorme.** El camino crítico técnico cabe en menos de 2
> minutos de reloj; los 15 minutos del bloque quedan íntegros para explicar qué está pasando, que es
> justamente el objetivo pedagógico.

---

## Antes de empezar

```bash
cd safe-spot-aws-spectrum
```

Requisitos que asume el ensayo: AWS CloudShell en `us-east-1`, o un entorno local con AWS CLI, SAM
CLI, `python3` y `boto3`.

> ⚠️ **Si ensayas fuera de CloudShell** y `preflight.sh` te marca `boto3 no está instalado`, eso es
> correcto: es el único bloqueo que puede aparecer en una máquina local. CloudShell trae `boto3`
> preinstalado. Para el ensayo local: `pip3 install --user boto3`, o usa un entorno virtual.

---

## Paso 1 · Preflight

```bash
./scripts/preflight.sh
```

**Debes ver:**

```
🌈 Safe Spot · preflight
Región objetivo: us-east-1 · Stack: safe-spot

Herramientas
  ✓ AWS CLI aws-cli/…
  ✓ AWS SAM CLI …
  ✓ Python …
  ✓ boto3 disponible (lo necesita scripts/seed.py)

Cuenta y región
  ✓ Credenciales activas · cuenta …
  ✓ Región us-east-1

Servicios
  ✓ Amazon Bedrock · amazon.nova-micro-v1:0 responde
  ✓ Amazon Location accesible
  ✓ S3 Block Public Access · sin bloqueo a nivel de cuenta

Estado previo
  ✓ No hay una stack 'safe-spot' previa · deploy limpio

✓ Todo listo. Continúa con: sam build && sam deploy
```

**Qué comprobar como facilitadora:**

- El script **no modifica nada**. Si detecta Block Public Access a nivel de cuenta, lo reporta y
  explica las opciones; no lo desactiva. Es intencional.
- Si Bedrock falla, sale como **aviso**, no como bloqueo: el workshop continúa con el plan B.

---

## Paso 2 · Build y deploy

```bash
sam build && sam deploy
```

**Debes ver:** `Build Succeeded`, luego la tabla de recursos y
`Successfully created/updated stack - safe-spot in us-east-1`.

**Momento de enseñanza mientras aprovisiona (~70 s):** abre en la consola
**CloudFormation → Stacks → safe-spot → Resources**. Ahí se ve que SAM terminó creando una stack de
CloudFormation, y que dentro viven la tabla, las Lambdas, el HTTP API, el bucket y la API key.

**Outputs esperados:** `ApiUrl`, `WebsiteUrl`, `WebsiteBucketName`, `PlacesTableName`,
`MapsApiKeyName`, `AllowedSignals`, `AllowedCategories`.

---

## Paso 3 · Publicar el frontend

```bash
./scripts/publish-frontend.sh
```

**Debes ver:**

```
  ✓ Outputs leídos de la stack safe-spot
  ✓ API key de Amazon Location obtenida (safe-spot-maps-key)
  ✓ frontend/config.js generado
  ✓ Frontend sincronizado con s3://safe-spot-web-<cuenta>

Abre tu Safe Spot:
  http://safe-spot-web-<cuenta>.s3-website-us-east-1.amazonaws.com
```

**Momento de enseñanza:** abre `frontend/config.js`. Explica por qué existe este script: CloudFormation
crea la API key de Location pero **no devuelve su valor** por `Fn::GetAtt` —solo el nombre y el ARN—,
así que hay que pedírselo a la API con `aws location describe-key`. No es magia, son 3 pasos legibles.

**Al abrir la URL debes ver:** el mapa oscuro de CDMX cargado, sin pines todavía (el seed va después).

---

## Paso 4 · Cargar los datos

```bash
python3 scripts/seed.py
```

**Debes ver** los 18 nombres uno a uno y `✓ 18 lugares cargados`.

**Momento de enseñanza:** abre `data/seed.json` y mira el bloque `provenance` de cualquier registro.
Cada dato declara de dónde viene y cuándo se verificó. Luego abre
**DynamoDB → Tablas → safe-spot-places → Explorar elementos** para ver los mismos items en la tabla.

Recarga el sitio: ahora hay 18 pines.

---

## Paso 5 · Las tres rutas

```bash
API=$(aws cloudformation describe-stacks --stack-name safe-spot \
      --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
```

### `GET /places`

```bash
curl -s "$API/places" | head -c 300
```
Esperado: `{"places": [...], "count": 18}`

### `POST /search` — con IA

```bash
curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"busco un café tranquilo para una cita con mi novia y me importa que tenga baño neutral"}'
```
Esperado:
```json
{"criteria": {"category": "cafe", "signals": ["neutral_bathroom", "quiet"]}, "source": "bedrock"}
```

### `POST /places` — válido y rechazado

```bash
# válido → 201
curl -s -X POST "$API/places" -H 'content-type: application/json' \
  -d '{"name":"Café de prueba","category":"cafe","latitude":19.4155,"longitude":-99.1605,"signals":["quiet"]}'

# inválido → 400 con la lista de errores
curl -s -X POST "$API/places" -H 'content-type: application/json' \
  -d '{"name":"","category":"nave_espacial","latitude":999,"longitude":"x","signals":["hackeame"]}'
```

El segundo debe devolver **400** y **no escribir nada** en la tabla. Es el mejor momento para explicar
por qué una API pública nunca confía en su entrada.

---

## Paso 6 · Verificar el plan B de la IA

Vale la pena ensayarlo al menos una vez antes del evento, porque es el rescue path del módulo de IA.

```bash
# rompe Bedrock a propósito
aws lambda update-function-configuration --function-name safe-spot-search \
  --environment 'Variables={BEDROCK_MODEL_ID=amazon.modelo-que-no-existe-v1:0,ALLOWED_SIGNALS=lgbtq_space\,neutral_bathroom\,accessible\,pronouns_respected\,couples_friendly\,quiet\,inclusive_healthcare,ALLOWED_CATEGORIES=cafe\,restaurant\,bar\,bookstore\,clinic\,community_center\,museum\,park\,coworking\,shop}' \
  --region us-east-1 >/dev/null
aws lambda wait function-updated-v2 --function-name safe-spot-search --region us-east-1

curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"café tranquilo con baño neutral"}'
```

**Esperado:** `HTTP 200` con los **mismos criterios** y `"source": "fallback"`. La aplicación no se
cae. Restaura poniendo de vuelta `amazon.nova-micro-v1:0` con el mismo comando.

---

## Paso 7 · Experimentar (`sam sync --code`)

```bash
# edita functions/search/app.py — por ejemplo el SYSTEM_PROMPT
sam sync --code
```

Pedirá confirmar que es una stack de desarrollo: **responde `Y`**. Avisa porque `sync` provoca drift
respecto a CloudFormation; en producción no se hace. Tarda ~2 s por función.

**Ejercicio recomendado para las participantes:** añadir una señal en `AllowedSignals` de
`template.yaml` y hacer `sam deploy`. Los filtros y el formulario aparecen solos, porque la taxonomía
tiene una única fuente de verdad. Es el ejercicio que mejor demuestra la arquitectura.

---

## Paso 8 · Limpieza

```bash
./scripts/cleanup.sh
```

Pide escribir `borrar` para confirmar. Después, verifica que no queda nada:

```bash
aws cloudformation describe-stacks --stack-name safe-spot --region us-east-1     # debe fallar
aws s3 ls s3://safe-spot-web-<cuenta>                                            # debe fallar
aws dynamodb describe-table --table-name safe-spot-places --region us-east-1     # debe fallar
aws location list-keys --region us-east-1 --query 'Entries[].KeyName'            # sin safe-spot
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/safe-spot \
    --region us-east-1 --query 'logGroups[].logGroupName'                        # vacío
```

En el ensayo del 2026-08-18 los seis quedaron limpios. Los log groups solo desaparecen porque están
**declarados en `template.yaml`**; los que Lambda crea por su cuenta sobreviven a `sam delete`.

---

## Verificación en navegador

El sitio desplegado se condujo con Playwright sobre Chromium (1440×900 y 420×900). Resultado:

| Comprobación | Resultado |
| --- | --- |
| Mapa de Amazon Location, tema Dark | ✅ canvas renderizado |
| Pines del seed | ✅ 18 |
| Chips de filtro y categorías del formulario | ✅ 7 y 10, generados desde la stack |
| Búsqueda con IA | ✅ «café tranquilo … baño neutral» → 3 de 18, 15 pines atenuados, etiqueta `BEDROCK` |
| Alta válida | ✅ pin nuevo, diálogo cerrado, sin error |
| Alta inválida | ✅ muestra el mensaje del servidor y el diálogo sigue abierto |
| Popup con procedencia | ✅ |
| Responsive a 420 px | ✅ sin desbordamiento horizontal |
| Errores de consola | ✅ ninguno |

Dos bugs salieron de aquí y están corregidos: el panel de error tapaba el mapa (`display` de autor
anulando el atributo `hidden`), y `form.name` colisionaba con la propiedad del elemento `<form>`.
Ninguno de los dos era detectable sin abrir un navegador.

---

## Qué queda pendiente de verificar a mano

Estas son las cosas que el ensayo **no** pudo cubrir:

- [x] ~~**El ensayo dentro de AWS CloudShell.**~~ **Verificado el 2026-08-19** en `us-east-1`:
      clonado, `preflight.sh`, `sam build`, `sam deploy`, `publish-frontend.sh`, `seed.py` y
      `GET /places` funcionan sin instalar nada. **Gate A/C cerrado.**
      Nota: en CloudShell **no hace falta crear un entorno virtual** — `boto3` ya está. Esa
      instrucción del walkthrough aplica solo a la ruta local.
- [ ] **El ensayo desde una cuenta AWS recién creada.** La validación se hizo en una cuenta con
      historial.
- [ ] **Gate F del Notion:** dárselo a alguien que no conozca el repo y medir dónde se atasca.
- [ ] **Curaduría del seed.** Los 18 lugares tienen coordenadas reales de Amazon Location, pero las
      señales de los marcados `community_draft` son un punto de partida, no información verificada.

---

## Hallazgos del ensayo que cambiaron el diseño

Ver `notes/decisions.md` para el detalle. En resumen:

0. **La lista de lugares se cacheaba en el navegador.** `GET /places` no enviaba `Cache-Control`,
   así que el navegador aplicaba cacheo heurístico (RFC 9111 §4.2.2) y reutilizaba la respuesta
   vacía obtenida antes del seed: el mapa seguía sin pines hasta forzar el refresco. Afectaba a
   **todas** las participantes, porque el recorrido manda abrir el sitio vacío en el bloque del
   mapa y recargar en el de datos. Corregido con `Cache-Control: no-store`. Encontrado en el
   ensayo en vivo del 2026-08-19, no en las pruebas automatizadas.
1. **La API key de Amazon Location solo acepta comodines de servicio** (`geo-maps:*`, `geo-places:*`).
   Las acciones concretas fallan con un error engañoso. Este fue el único bloqueo real del ensayo.
2. **`CommaDelimitedList` rompe `sam build`** cuando se usa con `!Join` en Outputs.
3. **Los log groups hay que declararlos** o el cleanup deja basura.
4. **`sam sync --code` avisa de una capa inexistente** si no se pone `dependency_layer = false`.
