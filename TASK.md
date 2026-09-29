### 📋 Roadmap de Producción: 3F Mailer

#### UX y Frontend (Pulido Visual)

- [] **Corrección CSS (Checkboxes/Selects):** Solucionar el padding de los iconos en listas desplegables y checkboxes.
- [] **Refactor Visual Global:** Cambiar logo sin fondo, ajustar el `max-width` (ej: `max-w-6xl`) para mejor lectura en notebooks y refinar el CSS.
- [] Y ademas, al agregar "Mi Actividad", siento que lo que dic Desarrollador en el nav, no me da la impresion de que es algo cliqueable. Habria que agregar ya sea o color o fondo o borde o lo que sea que se note que es un elemento cliqueable.
- [] Habria que revisar toda la pagina y ver la accesibilidad

#### Mejora de Crear Contacto

[x] Al poner la Empresa y Cuit, me gustara que reutilice el nombre si ya exite la empresa. Lo mismo con el CUIT, que no sean diferentes en la Base de datos. Para que al filtrar sean iguales. Ademas me gustariaque te vaya sugiriendo a medida que vpy completando, las empresas que matchean con esas letras puestas y que al seleccionar se autocomplete, asi es mas facil para el usuario y ademas hace que no se equicoquen y matcheen mejor los datos

#### A futuro

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
