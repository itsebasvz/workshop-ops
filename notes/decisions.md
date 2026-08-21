# Decisiones del prototipo — deltas respecto al Notion

Cada punto lleva la evidencia o la documentación que lo respalda. Fecha: **2026-08-18**.

## 11. SafeSpace pasa de mapa de lugares a directorio de recursos

La promesa pública del track habla de organizaciones, apoyo psicológico y legal, refugios y centros
comunitarios. El seed anterior tenía 18 lugares, pero 13 eran `community_draft` y todos los registros
exigían coordenadas. Eso no podía representar líneas de atención, canalizaciones o refugios protegidos.

Decisión implementada:

- `resource` es la entidad principal; `latitude` y `longitude` son opcionales.
- `/resources` es la ruta canónica. El alias `/places` existió unas horas y se retiró: el único
  cliente vive en este repo y ya estaba migrado, así que solo servía para duplicar la respuesta.
- Los recursos aprobados requieren `provenance.type = direct_source`, `sourceUrl` y `checkedAt`.
- El formulario guarda propuestas como `publicationStatus = pending`; `GET` solo devuelve `approved`.
- Un `shelter_referral` no puede guardar dirección ni coordenadas.
- La semilla reemplaza el catálogo de ocio por recursos con fuentes directas de instituciones y
  organizaciones. Las dos Clínicas Especializadas Condesa sobreviven como recursos verificables;
  los demás lugares anteriores salen del núcleo.

La decisión conserva S3, API Gateway, Lambda, DynamoDB, Bedrock y Amazon Location para no convertir
el cambio de producto en una arquitectura nueva. El mapa queda como vista parcial del directorio:
solo dibuja recursos cuya ubicación pública es apropiada.

### 11.1 Una fuente que no se puede abrir no es una fuente

Centro Cultural Border entró en la primera versión de la semilla como el único `community_center`.
Su `sourceUrl` daba `curl: (60) certificate has expired`: el certificado de `border.com.mx` caducó
el 20 de octubre de 2023, así que ningún navegador actual abre la página sin un aviso de sitio no
seguro. La ficha declaraba `checkedAt: 2026-08-19`, una fecha que nadie pudo haber comprobado.

Lo sustituye el **Centro Cultural de la Diversidad** (Colima 261, Roma Norte), tomado de su ficha en
el Sistema de Información Cultural de la Secretaría de Cultura. La coordenada sale de la propia
ficha, no de un geocodificador: en un directorio con procedencia visible, la ubicación debe venir de
la misma fuente que el resto del registro.

**Comprobar que la fuente responde es parte de revisarla.** Las diez URLs del seed devuelven 200.

---

## 1. La API key de Amazon Location solo acepta comodines de servicio

**Bloqueo real del ensayo.** El template original restringía la key a acciones concretas
(`geo-maps:GetTile`, `geo-places:Autocomplete`, …), que es lo que uno esperaría de una política de
mínimo privilegio. Amazon Location las rechaza.

El síntoma es engañoso — parece un problema de permisos del principal, con el nombre de la acción
vacío:

```
AccessDeniedException: User: arn:aws:iam::…:root is not authorized to perform:
  because no resource-based policy allows the  action
```

Matriz de pruebas:

| Restricción | root | usuario IAM con AdministratorAccess |
| --- | --- | --- |
| Acciones concretas (`geo-maps:GetTile`, …) | ❌ AccessDenied | ❌ AccessDenied |
| Comodines parciales (`geo-maps:Get*`, `geo-places:Search*`) | — | ❌ AccessDenied |
| Comodines de servicio (`geo-maps:*`, `geo-places:*`) | ✅ | ✅ |

**No es una restricción del usuario root.** Falla igual con un usuario IAM administrador, y funciona
para ambos con el comodín. Esto importa para el workshop: una participante en una cuenta nueva
—donde solo existe root— **sí puede** crear la key.

La restricción efectiva sigue siendo `AllowResources`: la key solo alcanza
`arn:aws:geo-maps:us-east-1::provider/default` y su equivalente de places.

Documentación: el ejemplo de CLI en
[Use API keys to authenticate](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html)
usa `"AllowActions":["geo-maps:*"]`. Ningún ejemplo oficial usa acciones concretas.

Verificado end-to-end con la key desplegada: style descriptor **HTTP 200** (160 capas, tema Dark),
tile raster **HTTP 200**, autocomplete de Places **HTTP 200**.

---

## 2. `CommaDelimitedList` rompe `sam build`

Con `AllowedSignals` como `CommaDelimitedList` y `!Join [",", !Ref AllowedSignals]` en Outputs,
`sam build` aborta:

```
Error: unhashable type: 'list'
  samcli/lib/intrinsic_resolver/intrinsic_property_resolver.py, line 277, in resolve_attribute
```

Es un fallo del resolvedor local de SAM CLI (1.165.0), no de CloudFormation. Se evita usando
parámetros `String` con los valores separados por comas — que además es más simple, porque las
Lambdas ya hacen `split(",")` y desaparece el `!Join`.

---

## 3. Cero dependencias en las Lambdas

**Motivo:** CloudShell no garantiza la versión de Python, y `sam build` con un intérprete distinto al
runtime produce `MisMatchRuntimeError`. CloudShell tampoco es un sitio cómodo para
`sam build --use-container`.

Al no haber `requirements.txt`, el builder de SAM se limita a copiar el código: `sam build` en **3 s**
y sin ninguna advertencia de versión. `boto3` y `botocore` los aporta el runtime gestionado
`python3.13`.

Documentación: [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
— los runtimes de Python incluyen una versión del SDK.

---

## 4. Log groups declarados en la plantilla

Los log groups que Lambda crea automáticamente **sobreviven a `sam delete`**. Declarándolos como
`AWS::Logs::LogGroup` con `RetentionInDays: 7` conseguimos dos cosas: retención acotada (sin esto los
logs se guardan indefinidamente) y un cleanup que de verdad deja la cuenta limpia.

Verificado: tras `cleanup.sh`, `logs describe-log-groups --log-group-name-prefix /aws/lambda/safe-space`
devuelve vacío.

---

## 5. CORS restringido al origen exacto, no a `*`

El nombre del bucket es determinista (`${AWS::StackName}-web-${AWS::AccountId}`), así que
`!GetAtt WebsiteBucket.WebsiteURL` da el origen exacto **antes** del deploy. No hay problema del
huevo y la gallina y no hace falta abrir CORS a `*`.

Verificado: preflight desde el origen del sitio devuelve `access-control-allow-origin` con la URL
exacta; desde `https://sitio-malicioso.example` devuelve 204 **sin** cabeceras CORS, que es lo que
hace que el navegador bloquee la petición.

---

## 6. El plan B de la IA vive dentro del código, no en un fixture

El Notion proponía un fixture externo de intención para cuando Bedrock no estuviera disponible. En su
lugar, `SearchFunction` captura `ClientError`/`BotoCoreError` y degrada a extracción por palabras
clave, devolviendo `"source": "fallback"`. Nunca responde 500.

Ventajas: no hay dos caminos de código que mantener, el frontend puede mostrar honestamente qué se
usó, y el propio fallback es material didáctico —enseña qué aporta realmente el modelo frente a una
tabla de palabras clave.

Verificado apuntando la Lambda a un modelo inexistente: **HTTP 200**, mismos criterios,
`"source": "fallback"`.

---

## 7. La taxonomía tiene una única fuente de verdad

En el Notion la lista de señales aparecía duplicada en el código de cada Lambda. Aquí vive en el
parámetro `AllowedSignals` de `template.yaml` y llega:

- a las dos Lambdas por variable de entorno (`Globals.Function.Environment`);
- al frontend vía Output de la stack, que `publish-frontend.sh` escribe en `config.js`.

Efecto secundario feliz: **añadir una señal es cambiar una línea y redesplegar**, y los filtros y el
formulario aparecen solos. Es el mejor ejercicio de experimentación del workshop y sale gratis del
diseño.

---

## 8. Hosting: S3 static website, sin CloudFront

Decisión del equipo: lo más rápido y estable. `sam deploy` completo en **70 s**. Una distribución de
CloudFront añade entre 5 y 15 minutos de propagación dentro de un bloque de 15 minutos, lo cual es
un riesgo desproporcionado para el workshop.

El atajo está documentado en la tabla *workshop vs. producción* del README y comentado en el propio
`template.yaml`. El bucket desactiva `BlockPublicPolicy` y `RestrictPublicBuckets` **solo en ese
bucket**; la plantilla nunca toca la configuración de la cuenta, y `preflight.sh` detecta e informa si
la cuenta tiene Block Public Access activo sin desactivarlo.

---

## 9. `sam sync --code` necesita `dependency_layer = false`

Sin esa opción en `samconfig.toml`, `sam sync --code` termina con:

```
Cannot find any versions for layer safe-space…-SearchFunction…-DepLayer.
Try sam sync without --code or sam deploy.
```

Intenta sincronizar una capa de dependencias que nunca existió, porque no hay dependencias. Es solo
ruido, pero es exactamente el tipo de mensaje que hace que alguien principiante crea que rompió algo.

---

## 10. El emparejamiento ordena por coincidencias en vez de exigirlas todas

Si la búsqueda exigiera **todos** los criterios detectados, la consulta estrella del workshop
(«necesito apoyo psicológico trans y gratuito») podría devolver lista vacía según cómo quede el
seed — el peor resultado posible en una demo, y peor todavía en un directorio de apoyo real.

`applyFilters()` filtra por categoría, exige al menos un servicio o señal coincidente y **ordena por
cuántos cumple**, mostrando «coincide en N de M». Nunca hay lista vacía por pedir un filtro de más,
y la lógica sigue siendo trivial de explicar.

> Redactado con la taxonomía de ocio original; el ejemplo se actualizó al pasar a recursos (§11).
> El razonamiento no cambió.

---

## Cosas que el Notion daba por dudosas y resultaron no serlo

- **Bedrock Nova Micro en `us-east-1`:** funciona ON_DEMAND con el id directo `amazon.nova-micro-v1:0`,
  sin inference profile. Latencia 400–700 ms. Permiso IAM sobre **un solo ARN**.
- **Calidad del modelo para esta tarea:** en 7 consultas de prueba devolvió JSON válido siempre, no
  inventó lugares y no se desvió con un intento de prompt injection.
- **Tiempo de despliegue:** el Gate C pedía caber en 15 minutos. El camino completo de cero a app
  funcionando son **97 segundos**.
