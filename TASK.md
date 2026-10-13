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

Tarea de pasaje de datos


    Tenes que actualizar lo que seria el pasaje del viejo sistema sobre los datos. Primero no pusiste bien la fecha de finalizacion, ademas de que en la campaña Conecta con China no habias puestos la cola de ENVIOS

    Te voy a pasar el archvio completo googl sheets, el cual se fueron enviado otras campañas. La unica que no esta es la de Taller para Pymes, de esa solo tenes que agregarle esta fecha de limite --> 2026-08-10 ajustada a nuestro formato
ta
    A la de Conecta con China tenes que agregarle su fecha limite y la cola de envios que te falto

    Ademas de esa tenes 4 campañas mas que se enviaron que ya finalizaron es por eso que solo hay que migrar sus datos. Las que fueron rexhazadas ni las toques fueron vistas previas rechazadas

    En la primer hoja llamada eventos_config_prod tendrias lo que es la data del evento en si, y en la hoja cola de envios, los mail y envios por separado, unidos por el id de cada evento.

    Tu tarea es ir pasando una a una las 4 campañas que finalizaron con su cola de envio, ajustando a la informacion que tenemos en nuestra BD actual, ya que es diferente.

    1 er paso, agregar a Taller para pymes su fecha limite
    Corregir Conecta con China
    Agregar los otros 4 eventos finalizados correctamente

Problema con el CUIT:
Si un contaco esta sin CUIT, al querer actualizarlo esta la validacion del CUIT, lo cual no deja dejarle SIN CUIT.
Habria que buscar la manera de salterse eso si el usuario quiere, como o que si se deja vacio es sin cuit y que no te tome con CUIT NO VALIDO por la matematica,  o un btoon que diga DEJAR SIN CUIT O ALGO ASI