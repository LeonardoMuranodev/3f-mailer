### 📋 Roadmap de Producción: 3F Mailer

#### UX y Frontend (Pulido Visual)

- [] **Corrección CSS (Checkboxes/Selects):** Solucionar el padding de los iconos en listas desplegables y checkboxes.
- [] **Refactor Visual Global:** Cambiar logo sin fondo, ajustar el `max-width` (ej: `max-w-6xl`) para mejor lectura en notebooks y refinar el CSS.
- [x] **Responsive Design:** Asegurar que las tablas y modales sean usables en resoluciones móviles/tablets.
- [x] **Actualización de Meta/Title:** Cambiar favicon de la página en `index.html`.

#### Maquetacion del mail

- [x] **Agregar adjunto opcional a la maquetacion del mail**: me dijeron las encargadas que a veces suelen enviar mails con adjuntos, entonces hay que ver si se puede agregar esa funcionalidad, la cual debe ser opcional. IMPORTANTE: es diferente al flyer que se muestra en pantalla. Este tiene que aparecer en el mail como adjunto, no como una imagen insertada en el mail.Estaria bueno que con un boton conmo el de Todos los rubros se active eso, sino moestaria mucho y se deberia hacer un SCROLL muy amplio apra abajo.

- [x] No se guarda en localstorage si eleji un archivo y el archivo si todavia no envie nada. Entre cargue todo, sali de /nueva volvi a entrar y aparece desactivado, cuando habia agregado un archivo

- [] Posibilidad de poder tener dos links de inscripcion, ya que sule haber Inscripcion de provincia y de Nacion. EN ese caso, diferenciar con Nacion con colores Celeste y Blanco, y Provincia con colores Verde,Blanco

- [] Mas a futuro, me gustaria que se puedan crear mails con un editor visual, donde puedas arrastrar y soltar los elementos. habria que hacer elementos prediseñados

- [] Tambien varias plantillas, osea al entrar a Nueva Campaña, seleccionar plantilla, y la de este envio es una, pero podrian haber muchas mas, no solo para "rubros" o "inscripciones". Tambien que se puedan crear.

#### Validacion estricta de CUIT

- [x] **Validacion estrcita de CUIT**: el CUIT tiene que tener un formato estricto, que sea un numero de 11 digitos sin puntos ni guiones. Por lo que hay que agregar una validacion en la maquetacion del mail, para que no se pueda enviar un mail con un CUIT que no sea correcto. Solo la validacion matematica, niguna integracion con ARCA. TIene que ser claro el mensaje en Crear contacto para que si la persona pone un CUIT invalido se le diga claramente que esta mal y como debe ser.

#### Validacion estricta de fecha en campaña

- [x] **Validacion estricta de fecha en campaña**: que no se pueda poner un dia igual o anterior a hoy en la fecha de finalizacion.

#### Recuperar contraseña

- [x] **Implementar sistema de recuperación de contraseña**: me di cuenta de que no hay forma de recuperar la contraseña, asi que hay que implementar un sistema de recuperacion de contraseña. Si el email es valido osea tiene cuenta en el sistema, se le envia un mail con un enlace de recuperacion de contraseña. Dicho enlace tiene que ser valido por un tiempo limitado (ej: 15 minutos).

Conectar a mi github hice un en el repo https://github.com/DesApp-2026c2-Grupo-6/des-app-grupo6-casa-de-comidas en la rama dev como esta implementado. Podes tomar ese ejemplo. Validando que esa ruta solo sea alguien sin haber iniciado sesion, con un buen diseño de MAILS. Usar como banner el Banner que usamos en los Mails, que es el de Direccion de Produccion

#### Control de horario de envio SMTP

- [X] Una vista solo para encargadas / desarrollador, no invitado para que controle de que hora a que hora se envian los mails. Esto es lo que usará el worker para enviar

- [X] Elijan horas dias, y dis especificos que no quieran que envien (para feriados, dias no laborales)

#### Historial de Cambios

Historial que me diga todos los cambios que se hicieron en la app en desarrollador. Que X usuario modifica campaña, o contactos, o cuenta SMTP. Reportes no hace falta ya que en si es un Historial

- [X] ue haya una vista de perfil/mis datos donde me diga con que email esta logueado. Y que haya un Historial ahi de los cambios que solo hizo esa persona "Mis Cambios". No puede ver cambios de otros usuarios, sino de si mismo. En esa vista tambien podra cambiar la contraseña. Y a repo https://github.com/DesApp-2026c2-Grupo-6/des-app-grupo6-casa-de-comidas en la rama dev buscar en pages perfil/ para tomar de ejemplo.

#### Errores

- [x] Me dio este error al aquerer actualizar un contacto: [DB Error] column "actualizado_en" of relation "contactos" does not exist 42703
- [x] Las estadisticas al exportar se muestra el ID, no esta bueno que eso se vea

- [x] Las estadisticas al exportar y no haber estadisticas, hay un ALERT feo HTML, ESTA PROHIBIDIMO ESO. Poner un modal que valla en linea con el estilo de la app.
- [x] Que en Metricas y Rendimiento haya un incono de ayuda, igual al que hay en campañas que te explique los controles de las metricas y que ademas te explique que el exportar es segun las fechas que se tomaron del INPUT
- [x] Los contactos al exportar no aparece el TIPO
- [x] Los contactos al exportar: solo aparecen los filtrados, nose si es lo adecuado, o que directamente se exporten todos

#### DevOps y Despliegue (Go-Live)

- [x] **Testing:** Escribir y ejecutar pruebas para los flujos críticos (Login, Poblar Cola, Rotación SMTP).
- [x] **Optimización de Recursos:** Revisar el tamaño de la imagen Docker final y limpiar logs innecesarios.
- [] **Despliegue Final:** Subir al repositorio Git corporativo (con VPN) y levantar el `docker-compose.yml` en el servidor de producción. Ya tengo el dominio disponible, tengo que configurar todo eso.
- [] **Importar los contactos de la base de datos de Google Sheets:** al sistema
- [] **Migrar los datos de las campañas del antiguo sistema**: el sistema de n8n se hicieron dos campañas, migrar los datos para ya ver esas estadisticas en el nuevo sistema
