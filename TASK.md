### 📋 Roadmap de Producción: 3F Mailer


####  UX y Frontend (Pulido Visual)

* [] **Corrección CSS (Checkboxes/Selects):** Solucionar el padding de los iconos en listas desplegables y checkboxes.
* [] **Refactor Visual Global:** Cambiar logo sin fondo, ajustar el `max-width` (ej: `max-w-6xl`) para mejor lectura en notebooks y refinar el CSS.
* [x] **Responsive Design:** Asegurar que las tablas y modales sean usables en resoluciones móviles/tablets.
* [x] **Actualización de Meta/Title:** Cambiar favicon de la página en `index.html`.

#### Maquetacion del mail

* [x] **Agregar adjunto opcional a la maquetacion del mail**: me dijeron las encargadas que a veces suelen enviar mails con adjuntos, entonces hay que ver si se puede agregar esa funcionalidad, la cual debe ser opcional. IMPORTANTE: es diferente al flyer que se muestra en pantalla. Este tiene que aparecer en el mail como adjunto, no como una imagen insertada en el mail.Estaria bueno que con un boton conmo el de Todos los rubros se active eso, sino moestaria mucho y se deberia hacer un SCROLL muy amplio apra abajo.

#### Validacion estrcita de CUIT

* [] **Validacion estrcita de CUIT**: el CUIT tiene que tener un formato estricto, que sea un numero de 11 digitos sin puntos ni guiones. Por lo que hay que agregar una validacion en la maquetacion del mail, para que no se pueda enviar un mail con un CUIT que no sea correcto. Solo la validacion matematica, niguna integracion con ARCA. TIene que ser claro el mensaje en Crear contacto para que si la persona pone un CUIT invalido se le diga claramente que esta mal y como debe ser.

#### Recuperar contraseña

* [] **Implementar sistema de recuperación de contraseña**: me di cuenta de que no hay forma de recuperar la contraseña, asi que hay que implementar un sistema de recuperacion de contraseña. Si el email es valido osea tiene cuenta en el sistema, se le envia un mail con un enlace de recuperacion de contraseña. Dicho enlace tiene que ser valido por un tiempo limitado (ej: 15 minutos).  

Conectar a mi github hice un en el repo https://github.com/DesApp-2026c2-Grupo-6/des-app-grupo6-casa-de-comidas en la rama dev como esta implementado. Podes tomar ese ejemplo. Validando que esa ruta solo sea alguien sin haber iniciado sesion, con un buen diseño de MAILS. Usar como banner el Banner que usamos en los Mails, que es el de Direccion de Produccion

#### Control de horario de envio SMTP

Una vista solo para encargadas / desarrollador, no invitado para que controle de que hora a que hora se envian los mails. Esto es lo que usará el worker para enviar

Elijan horas dias, y dis especificos que no quieran que envien (para feriados, dias no laborales)

#### Historial de Cambios

Historial que me diga todos los cambios que se hicieron en la app en desarrollador. Que X usuario modifica campaña, o contactos, o cuenta SMTP. Reportes no hace falta ya que en si es un Historial



#### DevOps y Despliegue (Go-Live)

* [x] **Testing:** Escribir y ejecutar pruebas para los flujos críticos (Login, Poblar Cola, Rotación SMTP).
* [x] **Optimización de Recursos:** Revisar el tamaño de la imagen Docker final y limpiar logs innecesarios.
* [] **Despliegue Final:** Subir al repositorio Git corporativo (con VPN) y levantar el `docker-compose.yml` en el servidor de producción. Ya tengo el dominio disponible, tengo que configurar todo eso.
* [] **Importar los contactos de la base de datos de Google Sheets:** al sistema
* [] **Migrar los datos de las campañas del antiguo sistema**: el sistema de n8n se hicieron dos campañas, migrar los datos para ya ver esas estadisticas en el nuevo sistema

