# 🌈 Safe Spot — recorrido completo como estudiante

**Ponte en los zapatos de una participante y ejecuta el workshop entero, desde cero.**
Cada paso trae el comando, lo que debes ver, y qué mirar mientras tanto.

- Repo: https://github.com/itsebasvz/safe-spot-aws-spectrum
- Región: `us-east-1` · Stack: `safe-spot`
- Duración de **este ensayo en solitario**: 25–35 min (de los cuales ~4½ min son de máquina)

> ℹ️ **Esto no dura lo mismo que el workshop.** El evento son 180 min con ~30 personas; este
> recorrido es una persona sola, que ya sabe qué hace cada paso, con la cuenta AWS ya creada y
> sin preguntas de por medio. El desglose de los 180 min está abajo, en
> [«Cómo se relaciona con la agenda»](#cómo-se-relaciona-con-la-agenda-de-180-min).

---

## Paso 0 · Abre AWS CloudShell

Consola de AWS → esquina superior derecha, comprueba que dice **N. Virginia (us-east-1)** →
icono `>_` de CloudShell.

Es el entorno del workshop: trae AWS CLI, SAM CLI, `python3`, `boto3` y `git` ya instalados.
Nadie instala nada.

> **Si prefieres correrlo en tu máquina:** funciona igual, pero tu `python3` no tiene `boto3` y
> `scripts/seed.py` lo necesita. Antes del Paso 4:
> ```bash
> python3 -m venv .venv && source .venv/bin/activate && pip install boto3
> ```
> Todo lo demás es idéntico.

---

## Paso 1 · Clona el repo

```bash
git clone https://github.com/itsebasvz/safe-spot-aws-spectrum.git
cd safe-spot-aws-spectrum
```

**Mira esto antes de seguir:** `template.yaml`. Son ~200 líneas y describen la aplicación
completa. No hay nada más escondido; lo que no esté ahí, no existe en tu cuenta.

---

## Paso 2 · Preflight

```bash
./scripts/preflight.sh
```

**Esperado:** todo en verde y la última línea

```
✓ Todo listo. Continúa con: sam build && sam deploy
```

**Qué hace:** solo *lee*. Comprueba herramientas, credenciales, región, que Bedrock responda,
que Amazon Location sea accesible y que no exista ya una stack `safe-spot`. **No modifica nada
de tu cuenta** — ni siquiera cuando encuentra un problema; te dice cuál es y te deja decidir.

**Si Bedrock sale como aviso amarillo:** sigue adelante. La búsqueda tiene plan B y lo veremos
en el Paso 8.

---

## Paso 3 · Construye y despliega (~1 min 15 s)

```bash
sam build && sam deploy
```

**Esperado:** `Build Succeeded`, la tabla de cambios, y al final
`Successfully created/updated stack - safe-spot in us-east-1`.

**Mientras aprovisiona**, abre en otra pestaña
**CloudFormation → Stacks → safe-spot → Resources**. Ahí ves aparecer, uno a uno: la tabla de
DynamoDB, las dos Lambdas, el HTTP API, el bucket de S3 y la API key de Amazon Location.

Esa es la idea central del bloque: escribiste un archivo, y AWS construyó y conectó
9 recursos. Si borras la stack, desaparecen los 9. No queda basura suelta.

**Al final verás los Outputs:** `ApiUrl`, `WebsiteUrl`, `PlacesTableName`, `MapsApiKeyName`,
`AllowedSignals`, `AllowedCategories`.

---

## Paso 4 · Publica el frontend (~15 s)

```bash
./scripts/publish-frontend.sh
```

**Esperado:**

```
  ✓ Outputs leídos de la stack safe-spot
  ✓ API key de Amazon Location obtenida (safe-spot-maps-key)
  ✓ frontend/config.js generado
  ✓ Frontend sincronizado con s3://safe-spot-web-<tu-cuenta>

Abre tu Safe Spot:
  http://safe-spot-web-<tu-cuenta>.s3-website-us-east-1.amazonaws.com
```

**Abre esa URL.** Debes ver el mapa oscuro de CDMX, **sin pines todavía** — los datos van en el
paso siguiente. Que el mapa cargue ya demuestra que la API key funciona.

**Mira `frontend/config.js`:**

```bash
cat frontend/config.js
```

**Por qué existe este script:** CloudFormation crea la API key de Location pero **no devuelve su
valor** — solo el nombre y el ARN. Hay que pedírsela a la API con `aws location describe-key`.
Por eso `config.js` se genera y está en `.gitignore`: contiene una credencial y no va al repo.

---

## Paso 5 · Carga los datos (~2 s)

```bash
python3 scripts/seed.py
```

**Esperado:** los 18 nombres en pantalla y `✓ 18 lugares cargados`.

**Recarga el sitio:** ahora hay 18 pines.

> 🔄 **Si sigues viendo el mapa vacío, fuerza el refresco** (`Ctrl`+`Shift`+`R`, o `Cmd`+`Shift`+`R`
> en Mac). Abriste el sitio en el Paso 4 con la tabla vacía y el navegador pudo quedarse con esa
> respuesta. La API ya envía `Cache-Control: no-store` para evitarlo, pero una pestaña abierta
> desde antes del arreglo puede arrastrar la copia vieja.

**Mira un registro:**

```bash
python3 -c "import json;print(json.dumps(json.load(open('data/seed.json'))[0],indent=2,ensure_ascii=False))"
```

Fíjate en el bloque `provenance`: cada lugar declara de dónde salió el dato y cuándo se
verificó. En una app sobre seguridad de personas, un dato sin procedencia es un rumor con
coordenadas.

Compruébalo también en **DynamoDB → Tablas → safe-spot-places → Explorar elementos**.

---

## Paso 6 · Usa la aplicación

En el navegador, sin tocar la terminal:

1. **Filtra** por señales (los chips) y por categoría. Los resultados y los pines reaccionan.
2. **Busca en lenguaje natural:** escribe
   `busco un café tranquilo para una cita con mi novia, ojalá con baño neutral`
   Debe reducirse a ~3 resultados, atenuar el resto de pines, y mostrar la etiqueta **BEDROCK**.
3. **Haz clic en un pin** → popup con las señales y la procedencia.
4. **Añade un lugar** con el botón de recomendar. Haz clic en el mapa para rellenar las
   coordenadas. Al guardar, aparece el pin nuevo.

**El detalle que vale la pena entender:** la búsqueda con IA **no** decide qué lugares mostrar.
El modelo solo traduce tu frase a `{category, signals}` — exactamente lo mismo que produces
clicando los chips. El filtrado lo hace después código normal y determinista. La IA es la
entrada, no el juez.

---

## Paso 7 · Las tres rutas por `curl`

```bash
API=$(aws cloudformation describe-stacks --stack-name safe-spot --region us-east-1 \
      --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
echo "$API"
```

**Listar:**
```bash
curl -s "$API/places" | python3 -c "import json,sys; d=json.load(sys.stdin); print('count:', d['count']); print('primero:', d['places'][0]['name'])"
```
→ `count: 18` (o 19 si añadiste un lugar en el Paso 6)

La respuesta completa son ~10 KB, así que conviene resumirla. Si prefieres verla cruda,
`curl -s "$API/places" | head -c 300` te enseña el primer registro —pero **corta antes de
`count`**, que va al final del JSON; no te asustes si parece incompleta.

Fíjate en el primer lugar: `signals` son las etiquetas contra las que filtra la app,
`provenance.type` dice si el dato viene de una fuente oficial o es borrador de la comunidad, y
`geocodedWith` confirma que las coordenadas no están escritas a mano.

**Buscar:**
```bash
curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"un bar donde pueda ir con mi pareja sin que nos miren raro"}'
```
→ `{"criteria": {"category": "bar", "signals": [...]}, "source": "bedrock"}`

**Crear — válido y rechazado:**
```bash
# válido → 201
curl -s -X POST "$API/places" -H 'content-type: application/json' \
  -d '{"name":"Café de prueba","category":"cafe","latitude":19.4155,"longitude":-99.1605,"signals":["quiet"]}'

# inválido → 400 con la lista de errores
curl -s -X POST "$API/places" -H 'content-type: application/json' \
  -d '{"name":"","category":"nave_espacial","latitude":999,"longitude":"x","signals":["hackeame"]}'
```

El segundo devuelve **400** y **no escribe nada** en la tabla. La validación vive en el
servidor, no en el formulario: cualquiera puede llamar a tu API sin pasar por tu página.

---

## Paso 8 · Rompe la IA a propósito

El momento más útil del módulo. Apunta la Lambda a un modelo que no existe:

```bash
# Lee la configuración actual, cambia solo el modelo y devuélvela entera.
# (--environment reemplaza el mapa completo, así que hay que reenviar todas las variables.)
ENV=$(aws lambda get-function-configuration --function-name safe-spot-search \
        --region us-east-1 --query Environment.Variables --output json \
      | python3 -c "import json,sys; v=json.load(sys.stdin); v['BEDROCK_MODEL_ID']='amazon.no-existe-v1:0'; print(json.dumps({'Variables': v}))")

aws lambda update-function-configuration --function-name safe-spot-search \
  --region us-east-1 --environment "$ENV" >/dev/null
aws lambda wait function-updated-v2 --function-name safe-spot-search --region us-east-1

curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"café tranquilo con baño neutral"}'
```

**Esperado:** `HTTP 200`, los **mismos criterios**, y `"source": "fallback"`.

Bedrock está caído y la aplicación **no se cae**: degrada a extracción por palabras clave.
Recarga el sitio y busca — la etiqueta ahora dice `FALLBACK` en vez de `BEDROCK`.

Para restaurar, vuelve a desplegar la configuración declarada:

```bash
sam deploy
```

---

## Paso 9 · Experimenta

### 9a · Añade una señal nueva (el mejor ejercicio)

Edita `template.yaml`, parámetro `AllowedSignals`, y añade `sober_friendly` al final de la lista.
Luego:

```bash
sam deploy
./scripts/publish-frontend.sh
```

Recarga: **el chip de filtro nuevo y la casilla del formulario aparecen solos.** No tocaste el
HTML ni el JavaScript ni las Lambdas.

Es porque la taxonomía tiene **una única fuente de verdad**: vive en `template.yaml`, llega a
las Lambdas por variable de entorno y al frontend por un Output de la stack. Cambiar una lista
en dos sitios es cómo empiezan los bugs raros; aquí no hay dos sitios.

### 9b · Cambia el prompt (iteración rápida)

Edita el `SYSTEM_PROMPT` de `functions/search/app.py` y:

```bash
sam sync --code
```

Pedirá confirmar que es una stack de desarrollo → **responde `Y`**. Tarda ~2 s.

Avisa porque `sync` sube el código sin pasar por CloudFormation, así que la stack queda
*desincronizada* de su plantilla. Perfecto para experimentar, prohibido en producción.

---

## Paso 10 · Limpia

```bash
./scripts/cleanup.sh
```

Pide escribir `borrar` para confirmar. Tarda ~1 min.

Comprueba que no queda nada:

```bash
aws cloudformation describe-stacks --stack-name safe-spot --region us-east-1  # debe fallar
aws location list-keys --region us-east-1 --query 'Entries[].KeyName'          # sin safe-spot
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/safe-spot \
    --region us-east-1 --query 'logGroups[].logGroupName'                      # vacío
```

Los log groups solo desaparecen porque están **declarados en la plantilla**. Los que Lambda
crea por su cuenta sobreviven al borrado de la stack y se quedan cobrando almacenamiento en
silencio — es la fuga de recursos más común al empezar con serverless.

**Costo total del recorrido:** menos de USD $0.02.

---

## Checklist del recorrido

- [ ] Paso 2 · preflight en verde
- [ ] Paso 3 · stack creada, 9 recursos visibles en CloudFormation
- [ ] Paso 4 · mapa carga, sin pines
- [ ] Paso 5 · 18 pines
- [ ] Paso 6 · filtros, búsqueda IA, popup, alta de lugar
- [ ] Paso 7 · las 3 rutas; la inválida devuelve 400
- [ ] Paso 8 · `"source": "fallback"` con 200
- [ ] Paso 9a · señal nueva aparece sola en la interfaz
- [ ] Paso 9b · `sam sync --code` en ~2 s
- [ ] Paso 10 · cuenta limpia

**Si algo se rompe, anótalo con el paso y el mensaje exacto** — eso es justamente lo que este
ensayo busca encontrar antes de que lo encuentren 30 personas a la vez.

---

## Cómo se relaciona con la agenda de 180 min

Este recorrido cubre el **camino técnico**, que es la parte más corta del workshop. La agenda
del Notion reparte así los 180 minutos:

| Bloque de la agenda | Min | Pasos de este recorrido | Máquina |
| --- | ---: | --- | ---: |
| 🔐 Acceso a AWS + CloudShell | 30 | Paso 0 | 0 s |
| 🌈 Problema + demo + arquitectura | 15 | — (solo exposición) | 0 s |
| ☁️ SAM deploy | 15 | Pasos 1–3 | 73 s |
| 🗺️ Mapa | 20 | Paso 4 | 13 s |
| 🫶 Datos | 20 | Paso 5 | 2 s |
| ⚡ Backend serverless | 25 | Paso 7 | ~3 s |
| ✨ IA | 25 | Pasos 6 y 8 | ~40 s |
| 🌈 Integración | 20 | Paso 9 | ~70 s |
| 🧹 Cierre | 10 | Paso 10 | 70 s |
| **Total** | **180** | | **~4 min 30 s** |

**45 de los 180 minutos no llevan un solo comando** — son onboarding de cuentas y explicación
de la arquitectura. Los 135 restantes contienen cuatro minutos y medio de máquina.

La desproporción es deliberada. Lo que llena el bloque de 25 minutos de IA no es esperar a
Bedrock: es entender por qué el modelo solo traduce a `{category, signals}` y por qué el
filtrado lo hace después código determinista. Los comandos son la excusa para tener algo
concreto delante mientras se explica.

**Consecuencia para quien facilita:** el riesgo del workshop no es quedarse sin tiempo en la
parte técnica —ahí sobra margen de sobra—, sino el bloque de 30 minutos de acceso a AWS. Es el
único impredecible (verificación por SMS, tarjeta, MFA, cuentas recién creadas) y el único que
no se arregla escribiendo mejor código.
