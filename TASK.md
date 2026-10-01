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



#### DevOps y Despliegue (Go-Live)

- [] **Despliegue Final:** Subir al repositorio Git corporativo (con VPN) y levantar el `docker-compose.yml` en el servidor de producción. Ya tengo el dominio disponible, tengo que configurar todo eso.
- [] **Importar los contactos de la base de datos de Google Sheets:** al sistema
- [] **Migrar los datos de las campañas del antiguo sistema**: el sistema de n8n se hicieron dos campañas, migrar los datos para ya ver esas estadisticas en el nuevo sistema
- [] **Agregar MAIL de soporte**: Cuando los de sistema me den el mail, que ese mail envie avisos, recuperacion de contraseñas, notificaciones etc.
