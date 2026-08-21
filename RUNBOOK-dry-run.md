# 🌈 Safe Space — runbook de facilitación

Este documento describe el ensayo del track SafeSpace Network desde la perspectiva de quien
facilita. La app es un **directorio de recursos inclusivos con mapa opcional**, no un mapa de lugares
de ocio ni una certificación de seguridad.

- Repo: `awspectrum-safe-space/`
- Región: `us-east-1`
- Stack: `safe-space`
- Cuenta de referencia del ensayo: la de organización (el ID no se publica aquí; sale de
  `aws sts get-caller-identity`)

## Objetivo pedagógico

La pregunta que debe volver en cada módulo es:

> ¿Cómo hacemos útil un recurso sin confundir una fuente con una garantía de seguridad y sin revelar
> una ubicación que debe permanecer privada?

El ciclo es **predecir → ejecutar → observar → explicar → modificar**.

## Tiempo de máquina esperado

| Acción | Tiempo esperado |
| --- | ---: |
| `preflight.sh` | ~10 s |
| `sam build` | ~3 s |
| `sam deploy` en frío | ~70 s |
| `publish-frontend.sh` | ~13 s |
| `seed.py` | ~2 s |
| `sam sync --code` | ~2 s |
| cleanup | ~40 s |

La máquina ocupa poco tiempo; el aprendizaje está en mirar evidencia y explicar decisiones.

> ⚠️ **Estos tiempos se midieron en AWS CloudShell.** El entorno oficial es ahora GitHub
> Codespaces y **están pendientes de remedir**. Falta además el dato que más importa el día
> del evento: cuánto tarda en construirse el Dev Container de un Codespace de 2 núcleos.

## Antes de empezar

El entorno del ensayo es **GitHub Codespaces**, igual que el de las participantes: fork del
repo → **Code ▸ Codespaces ▸ Create codespace on main** (2 núcleos). El código ya está dentro;
no hay `git clone`.

Autentícate y comprueba la identidad antes de nada:

```bash
aws login --remote --region us-east-1
aws sts get-caller-identity
```

Comprueba `us-east-1` y permisos para SAM, Bedrock, DynamoDB, S3, CloudWatch y Amazon
Location. No desactives Block Public Access de la cuenta desde el workshop; `preflight.sh`
solo informa si la configuración de la cuenta impediría el sitio de demostración.

**Plan B:** AWS CloudShell sigue funcionando y no necesita `aws login`; ahí sí hay que clonar
el repo. Conviene que quien facilita lo tenga ensayado, porque será el camino de quien se
quede sin cuota de Codespaces.

## Paso 1 · Preflight

```bash
./scripts/preflight.sh
```

**Checkpoint:** 0 bloqueos. Si Bedrock aparece como aviso, continúa: el fallback es parte del
producto y de la lección.

## Paso 2 · Deploy

```bash
sam build && sam deploy
```

Mientras espera, abrir CloudFormation → `safe-space` → **Resources**. Pedir a los equipos que
predigan qué aparecerá: tabla, dos Lambdas, HTTP API, bucket, logs y API key.

**Outputs esperados:** `ApiUrl`, `WebsiteUrl`, `WebsiteBucketName`, `PlacesTableName`,
`MapsApiKeyName`, `AllowedSignals`, `AllowedCategories`, `AllowedServices`.

## Paso 3 · Frontend

```bash
./scripts/publish-frontend.sh
```

**Checkpoint:** la URL abre el mapa de CDMX y el directorio aún no tiene datos. Explicar que
`config.js` se genera porque contiene la API key de Location y está en `.gitignore`.

## Paso 4 · Seed y modelo de datos

```bash
python3 scripts/seed.py
```

**Checkpoint:** 11 recursos aprobados cargados; aproximadamente 7 tienen coordenadas y 4 son
contact-only.

Abrir `data/seed.json` y DynamoDB. Pedir que encuentren:

- `services` frente a `signals`;
- `contact` y `serviceArea`;
- `provenance.sourceUrl` y `checkedAt`;
- `publicationStatus: approved`.

Comparar una ficha con pin y una derivación a refugio. La ausencia de coordenadas es intencional.

## Paso 5 · API

```bash
API=$(aws cloudformation describe-stacks --stack-name safe-space --region us-east-1 \
      --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

curl -s "$API/resources" | head -c 400
```

Propuesta válida:

```bash
curl -s -X POST "$API/resources" -H 'content-type: application/json' \
  -d '{"name":"Recurso de prueba","category":"support_service","services":["legal_support"],"contact":{"website":"https://example.org"},"sourceUrl":"https://example.org"}'
```

**Esperado:** `202`, `publicationStatus: pending`; después de `GET /resources`, no aparece.

Propuesta insegura:

```bash
curl -s -X POST "$API/resources" -H 'content-type: application/json' \
  -d '{"name":"Refugio de prueba","category":"shelter_referral","services":["shelter_support"],"latitude":19.42,"longitude":-99.15,"contact":{"phone":"5555555555"}}'
```

**Esperado:** `400`. La API defiende la privacidad incluso si el navegador se modifica o se evita.

## Paso 6 · Búsqueda e IA

```bash
curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"necesito apoyo psicológico para una persona trans y una línea de orientación"}'
```

**Checkpoint:** `criteria` contiene `category`, `services`, `signals` y `source`.

La conversación debe insistir en que Bedrock no ve DynamoDB, no inventa organizaciones y no decide
qué se muestra.

### Rescue path: fallback

Romper temporalmente `BEDROCK_MODEL_ID` en la Lambda `safe-space-search`, conservando las demás
variables, y repetir la búsqueda. Debe responder `HTTP 200` con `source: fallback`. Restaurar con:

```bash
sam deploy
```

No ocultar el fallback: es una decisión de continuidad del negocio.

## Paso 7 · Reto único

El equipo añade una ficha de contacto sin ubicación pública. Debe pasar por la fuente directa,
validación, seed y frontend. La evidencia de cierre es:

1. ficha visible en la lista;
2. cero pin nuevo;
3. fuente y canal visibles;
4. explicación de por qué no se guardaron coordenadas;
5. rama/PR solo si los permisos y repos por equipo ya están preparados.

## Paso 8 · Observabilidad

```text
/aws/lambda/safe-space-places
/aws/lambda/safe-space-search
```

Cada equipo debe encontrar una petición propia y relacionar `routeKey`, `source`, `criteria` y el
ID del recurso. No preguntar “¿todo bien?”: pedir una evidencia concreta.

## Paso 9 · Cierre y cleanup

```bash
./scripts/cleanup.sh
```

Antes de confirmar, leer qué se va a borrar. Después comprobar que la stack no existe. En una cuenta
compartida o en la demo de organizadores, detenerse y pedir autorización antes de ejecutar cleanup.

Cerrar después la sesión y el entorno:

```bash
aws logout
```

Recordar en voz alta que hay que **detener o eliminar el Codespace**: uno encendido sigue
consumiendo cuota de horas de quien lo creó.

## Estado de la demo desplegada

La stack de referencia puede contener el prototipo anterior. No mezclar sus 18 registros con el
contrato nuevo. Para una migración controlada:

1. exportar los registros actuales;
2. desplegar backend y frontend compatibles;
3. ejecutar `python3 scripts/seed.py --replace` solo con autorización explícita;
4. publicar el frontend;
5. probar `/resources`, una ficha contact-only y una propuesta `pending`.

## Gates que siguen abiertos

- ensayo desde una cuenta AWS recién creada;
- **remedir los tiempos de máquina en Codespaces**, incluido el arranque en frío del Dev
  Container en la máquina de 2 núcleos;
- **probar `aws login --remote` de punta a punta** con una cuenta real antes del evento;
- decidir qué se hace con quien llegue con **IAM Identity Center**: ahí el comando es
  `aws sso login`, no `aws login`;
- comprobar que las participantes tienen **cuota de Codespaces** disponible;
- acceso a AWS por equipo;
- revisión de la guía con una persona que no conozca el repo;
- validación periódica de fuentes y horarios del seed.
