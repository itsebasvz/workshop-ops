# 🌈 Safe Space — recorrido completo como estudiante

**Ponte en los zapatos de una participante y ejecuta el workshop entero, desde cero.**

- Repo: https://github.com/itsebasvz/awspectrum-safe-space
- Región: `us-east-1` · Stack: `safe-space`
- Objetivo: desplegar un directorio de recursos inclusivos con mapa opcional.

> La aplicación no certifica seguridad. Un recurso aprobado tiene una fuente directa y una fecha de
> revisión; una propuesta comunitaria queda pendiente. Los refugios se representan por contacto y
> canalización, nunca por su dirección protegida.

## Paso 0 · Haz fork y crea tu Codespace

Entra al repo, pulsa **Fork** y ve a **tu** copia. Ahí:

**Code ▸ Codespaces ▸ Create codespace on main**, máquina de **2 núcleos**.

GitHub construye el entorno del taller y abre VS Code en el navegador. Cuando termine ya
tienes AWS CLI, SAM CLI, `python3`, `boto3`, `git`, `gh` y `node` instalados. No hay nada que
instalar en tu portátil.

No hace falta clonar nada: el Codespace ya contiene el código de tu fork.

> 🛟 **Si no puedes crear el Codespace** —sin cuota, GitHub caído, el entorno falla— pasa al
> plan B: AWS CloudShell en `us-east-1`, `git clone` del repo, y sigue desde el Paso 2. Las
> credenciales allí son automáticas, así que te saltas el Paso 1.

## Paso 1 · Autentícate en AWS

El Codespace tiene la AWS CLI, pero AWS todavía no sabe quién eres.

```bash
aws login --remote --region us-east-1
```

Se abre una URL; la abres en tu navegador, inicias sesión y pegas el código en la terminal.

**Debes ver** tu identidad al comprobarla:

```bash
aws sts get-caller-identity
```

**Predice:** la sesión es temporal y dura 12 horas. En ningún momento copias una access key.

> Si tu cuenta usa **IAM Identity Center**, el comando es `aws sso login` (previa
> `aws configure sso`). Si eres un **usuario IAM** y te da error de permisos, necesitas la
> policy `SignInLocalDevelopmentAccess`. Como **root** no necesitas nada más.

Todavía no existe una stack ni una tabla. Todo lo que AWS creará está declarado en
`template.yaml`.

## Paso 2 · Preflight

```bash
./scripts/preflight.sh
```

**Debes ver:** herramientas, cuenta, región y servicios comprobados, seguido de:

```text
✓ Todo listo. Continúa con: sam build && sam deploy
```

El script solo lee. Si Bedrock aparece como aviso, continúa: la búsqueda tiene un plan B.

## Paso 3 · Construye y despliega

```bash
sam build && sam deploy
```

**Observa:** CloudFormation crea la tabla, dos Lambdas, HTTP API, bucket, logs y API key de
Amazon Location. Al terminar deben existir los Outputs `ApiUrl`, `WebsiteUrl`, `PlacesTableName`,
`MapsApiKeyName`, `AllowedSignals`, `AllowedCategories` y `AllowedServices`.

## Paso 4 · Publica el frontend

```bash
./scripts/publish-frontend.sh
```

Abre la URL que imprime. Debes ver el mapa de CDMX y el directorio vacío o sin recursos todavía.
`config.js` se genera localmente porque contiene la API key de Amazon Location; nunca se commitea.

## Paso 5 · Carga recursos aprobados

```bash
python3 scripts/seed.py
```

**Esperado:** 11 recursos cargados y una mezcla visible de fichas con ubicación pública y fichas
de contacto/derivación.

Recarga el sitio. Debes ver aproximadamente **7 pines**; los recursos `contact_only` aparecen en la
lista, pero no en el mapa.

Abre `data/seed.json` y encuentra en un registro:

- `category` y `services`;
- `contact`;
- `provenance.sourceUrl` y `provenance.checkedAt`;
- `publicationStatus: "approved"`.

## Paso 6 · Usa la aplicación

1. Filtra por **Apoyo psicológico**, **Apoyo legal** o **Contacto / derivación**.
2. Busca:

   ```text
   necesito apoyo psicológico para una persona trans y quiero saber a dónde llamar
   ```

   Debe mostrar criterios de tipo, servicio y señal, con etiqueta **BEDROCK** o **Plan B**.
3. Abre un recurso con pin: observa su ficha, contacto y fuente directa.
4. Abre una ficha sin pin: observa que sigue siendo útil aunque no tenga coordenadas.
5. Comprueba que una derivación a refugio no expone la dirección del refugio.

**La idea central:** Bedrock interpreta una necesidad; no elige organizaciones ni consulta la tabla.
El frontend aplica criterios sobre recursos aprobados.

## Paso 7 · Las rutas por `curl`

```bash
API=$(aws cloudformation describe-stacks --stack-name safe-space --region us-east-1 \
      --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
```

### `GET /resources`

```bash
curl -s "$API/resources" | python3 -c "import json,sys; d=json.load(sys.stdin); print('count:', d['count']); print('primero:', d['resources'][0]['name'])"
```

→ `count: 11`

### `POST /search`

```bash
curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"necesito asesoría legal por discriminación y una línea de orientación"}'
```

La respuesta debe tener `criteria.category`, `criteria.services`, `criteria.signals` y `source`.

### `POST /resources` válido

```bash
curl -s -X POST "$API/resources" -H 'content-type: application/json' \
  -d '{"name":"Recurso de prueba","category":"support_service","services":["legal_support"],"signals":["lgbtq_affirming"],"contact":{"website":"https://example.org"},"sourceUrl":"https://example.org"}'
```

**Esperado:** `HTTP 202`, `publicationStatus: "pending"` y un mensaje de revisión. Vuelve a hacer
`GET /resources`: la propuesta no aparece.

### `shelter_referral` inseguro

```bash
curl -s -X POST "$API/resources" -H 'content-type: application/json' \
  -d '{"name":"Refugio de prueba","category":"shelter_referral","services":["shelter_support"],"latitude":19.42,"longitude":-99.15,"contact":{"phone":"5555555555"}}'
```

**Esperado:** `HTTP 400`. La API rechaza dirección y coordenadas para proteger la ubicación.

## Paso 8 · Rompe Bedrock a propósito

Apunta temporalmente la Lambda a un modelo inexistente, conservando todas las variables de entorno:

```bash
ENV=$(aws lambda get-function-configuration --function-name safe-space-search \
        --region us-east-1 --query Environment.Variables --output json \
      | python3 -c "import json,sys; v=json.load(sys.stdin); v['BEDROCK_MODEL_ID']='amazon.no-existe-v1:0'; print(json.dumps({'Variables': v}))")

aws lambda update-function-configuration --function-name safe-space-search \
  --region us-east-1 --environment "$ENV" >/dev/null
aws lambda wait function-updated-v2 --function-name safe-space-search --region us-east-1

curl -s -X POST "$API/search" -H 'content-type: application/json' \
  -d '{"query":"apoyo psicológico para una persona trans"}'
```

**Esperado:** `HTTP 200` y `"source":"fallback"`. La aplicación continúa sin esconder el hecho
de que la IA no respondió. Para restaurar la configuración declarada, ejecuta `sam deploy`.

## Paso 9 · Reto único de equipo

Añade o corrige una ficha de contacto sin ubicación pública.

El cambio debe:

1. usar una fuente directa;
2. incluir al menos un canal de contacto;
3. dejar `latitude` y `longitude` fuera;
4. pasar la validación del seed;
5. aparecer en el directorio, pero no como pin;
6. quedar explicado en el README y el pitch.

Edita desde VS Code, en el mismo Codespace: explorador de archivos, búsqueda en todo el repo,
*Source Control* y terminal integrada. Trabajas sobre **tu fork**, así que puedes subir el
cambio sin pedirle permiso a nadie:

```bash
git switch -c mi-rama
git add . && git commit -m "describe tu cambio"
git push -u origin mi-rama
```

`origin` es tu fork; `upstream` es el repo del taller. El pull request es opcional: lo que
cuenta es que el equipo revise el cambio y sepas explicarlo.

## Paso 10 · Observa y limpia

Busca la petición en:

```text
/aws/lambda/safe-space-places
/aws/lambda/safe-space-search
```

Relaciona `routeKey`, `source`, `criteria` y el identificador del recurso con lo que viste en el
navegador.

Después:

```bash
./scripts/cleanup.sh
```

Comprueba en CloudFormation que `safe-space` ya no existe. Antes de ejecutar cleanup en una cuenta
compartida, confirma que la stack no está siendo utilizada.

Cierra después la sesión de AWS y el entorno:

```bash
aws logout
```

Y en [github.com/codespaces](https://github.com/codespaces), **detén o elimina tu Codespace**.
Uno encendido sigue consumiendo tu cuota de horas aunque no lo uses.

## Checklist

- [ ] Preflight en verde.
- [ ] Stack creada y Outputs visibles.
- [ ] Mapa cargado.
- [ ] 11 recursos aprobados en la tabla.
- [ ] Fichas con y sin pin visibles.
- [ ] Búsqueda devuelve categoría, servicios, señales y fuente.
- [ ] Propuesta válida devuelve 202 y queda pendiente.
- [ ] Refugio con coordenadas devuelve 400.
- [ ] Fallback devuelve 200.
- [ ] Reto documentado y revisado.
- [ ] Stack limpia al final.
