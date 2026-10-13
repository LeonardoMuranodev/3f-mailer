### 📋 Roadmap de Producción: 3F Mailer

#### UX y Frontend (Pulido Visual)

- [] **Corrección CSS (Checkboxes/Selects):** Solucionar el padding de los iconos en listas desplegables y checkboxes.
- [] ** Checkbox personalizados: que no tengan el diseño por defecto, agregarle uno personalizado
- [] **Refactor Visual Global:** Cambiar logo sin fondo, ajustar el `max-width` (ej: `max-w-6xl`) para mejor lectura en notebooks y refinar el CSS.

#### Version 2 - A futuro

- A las campañas donde se pone un LINK de Inscripcion, gestionar la lista de personas inscriptas.
    - Deberia hacer un clon de google forms o asi para crear formularios y gestionar las respuestas desde aca.
    - A quines se incriben mandarles un recordatorio que se pueda editar 1 dia 3 dias 1 semana antes (seleccionando varios o solo un recordatorio)
    - que el mensaje se pueda hacer (la encargada lo hace) para que luego se use ese COPY (con un copy por defecto como Gracias por Inscribirte a X evento)
    - Para mostrar quines se inscribieron y que cuenta se le envio, podemos reutilizar lo de la col de envios, con estadisticas basicas como enviado , no enviado error
    - Habria que, hacer un link publico para que quien entre lo complete. QUe no puedan entrar a editar el form desde ahi ni nada por el estilo. SI es posible generar desde otro dominio o subdominio, no hace flta estar logueado para completarlo.
    - Empezar con controles basicos. Ver ejemplo de backend inscripciones 

- [] Mas a futuro, me gustaria que se puedan crear mails con un editor visual, donde puedas arrastrar y soltar los elementos. habria que hacer elementos prediseñados

- [] Tambien varias plantillas, osea al entrar a Nueva Campaña, seleccionar plantilla, y la de este envio es una, pero podrian haber muchas mas, no solo para "rubros" o "inscripciones". Tambien que se puedan crear.

- [] Preguntar datos de Direccion y Puestos para hacer una APP de ENVIO de mails inter-direccion (que sea para diferentes departamentos y/o direcciones). Habria que ver el tema de RLS, y ampliar roles o buscar manera de que, segun el departamento o dirección del usuario, solo pueda ver sus respectivas paginas.
    - [] Adenmas, perfeccionar DevOps para que aguante mas usuarios en simultaneo

- [] Sistema de Logs (en mi otra app use Pino y stack PLG) el tema aca es el uso del servidor, esto es en caso de que el proyecto escale.

### Prueba y video

- [] Probar que todo funcione correctamente
- [X ] Mostrar todas las funcionalidades del sistema con videos 

#### DevOps y Despliegue (Go-Live)

- [] **Despliegue Final:** Subir al repositorio Git corporativo (con VPN) y levantar el `docker-compose.yml` en el servidor de producción. Ya tengo el dominio disponible, tengo que configurar todo eso.
- [] **Importar los contactos de la base de datos de Google Sheets:** al sistema
- [] **Migrar los datos de las campañas del antiguo sistema**: el sistema de n8n se hicieron dos campañas, migrar los datos para ya ver esas estadisticas en el nuevo sistema
- [] **Agregar MAIL de soporte**: Cuando los de sistema me den el mail, que ese mail envie avisos, recuperacion de contraseñas, notificaciones etc.


Hay que subir los cambios al servidor
Este tiene una version bastante anterior
Primero me gustaria hacer pruebas en modo TEST, luego pasar a PROD.
La BD es la misma, ya sea si estoy en mi PC o server
El tema nose como se vera ya que la de produccion se quedo con una version bastante atras
De la de produccion solo me interesa conservar los usuarios
Luego tenemos que pasardatos del sistema viejo al nuevo, la de PROD
Osea tenemos 3 BDS: sistema viejo que sighue funcionando (con 3 campañas, datos si bien similares bastantes distintos), TEST (la ams actualizada) y PROD (bastante atrasada, es la ultima la uqe hay que dejar con los usuarios que tiene actualmente e inyectar lo del sistema viejo, pero el tema es que nose si tiene algunas tablas nuevbas como la de los horarios)
Decime bien que hacer
COn el MCP de supabase que tenes, en mi cuenta tenes:
n8n-muni-mails-bd --> BD de sistema viejo
n8n-muni-mails-app-db --> BD de prod (nose pq le puse n8n si no tiene nada que ver)

La de TEST actual esta en otra cuenta, asi que el MCP no te dejaria acceder aunque lo podes hacer con las credenciales del .env

Osea para el final tenemos que en BD PROD:
limpiarla (salvo lo usuarios)
Ponerle los datos de la BD del sistema viejo
Poner todas la scuentas SMTP, en la app


- [x] **Limitar backups en Google Drive a 7:** Configurada la retención automática en `scripts/backup-db.sh` y `Dockerfile.backup` (con `jq`) para conservar los últimos 7 días y purgar los excedentes en Google Drive. Se ejecutó la purga inicial liberando 19 backups antiguos acumulados.
- [x] **Visualización legible de Rubros en Contactos:** Actualizado `listarContactos` con `LEFT JOIN rubros` para resolver `rubro_nombre` amigable, y actualizado `DirectorioContactos.tsx` para mostrar etiquetas formateadas (ej. "Metalúrgica", "Comercio") en la tabla, modal de edición y exportación CSV en vez de IDs/UUIDs ilegibles.

- [x] **Tarea de pasaje de datos (Campañas Históricas y Cola de Envíos):**
  - **Taller para Pymes:** Fecha límite actualizada a `2026-08-10` con su cola de envíos preservada (193 registros).
  - **Conectá con China – Parte II:** Metadatos actualizados (fecha límite `2026-09-28`, flyer, link de inscripción) y migrados sus 2.233 envíos.
  - **4 Campañas finalizadas adicionales:** Migradas exitosamente con fecha límite, flyers, links de inscripción, rubros y sus respectivas colas de envío:
    1. *Lanzamiento de las Rondas de Negocios RIGI (Parte 1)*: Límite `2026-10-03`, 868 envíos.
    2. *Lanzamiento de las Rondas de Negocios RIGI (Parte 2)*: Límite `2026-10-03`, 944 envíos.
    3. *Planos mecánicos con solidworks avanzado*: Límite `2026-10-09`, 866 envíos.
    4. *Primera Ronda de Negocios RIGI- Minería -Rosario*: Límite `2026-10-12`, 2.221 envíos.
  - *Métricas finales consolidadas en DB:* 7.325 envíos históricos totales (7.225 enviados, 100 fallidos). Omitidas todas las vistas previas rechazadas.

[] Problema con el CUIT:
Si un contaco esta sin CUIT, al querer actualizarlo esta la validacion del CUIT, lo cual no deja dejarle SIN CUIT.
Habria que buscar la manera de salterse eso si el usuario quiere, como o que si se deja vacio es sin cuit y que no te tome con CUIT NO VALIDO por la matematica,  o un btoon que diga DEJAR SIN CUIT O ALGO ASI

Boton de que cuando estoy en la cola de envios, al ser varias filas, para volver astra arriba de todo cuando baje y no se vean las estadisticas de la campaña