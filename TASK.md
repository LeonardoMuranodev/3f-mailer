### 📋 Roadmap de Producción: 3F Mailer


####  UX y Frontend (Pulido Visual)

* [] **Corrección CSS (Checkboxes/Selects):** Solucionar el padding de los iconos en listas desplegables y checkboxes.
* [] **Refactor Visual Global:** Cambiar logo sin fondo, ajustar el `max-width` (ej: `max-w-6xl`) para mejor lectura en notebooks y refinar el CSS.
* [x] **Responsive Design:** Asegurar que las tablas y modales sean usables en resoluciones móviles/tablets.
* [x] **Actualización de Meta/Title:** Cambiar favicon de la página en `index.html`.

#### DevOps y Despliegue (Go-Live)

* [x] **Testing:** Escribir y ejecutar pruebas para los flujos críticos (Login, Poblar Cola, Rotación SMTP).
* [x] **Optimización de Recursos:** Revisar el tamaño de la imagen Docker final y limpiar logs innecesarios.
* [] **Despliegue Final:** Subir al repositorio Git corporativo (con VPN) y levantar el `docker-compose.yml` en el servidor de producción. Ya tengo el dominio disponible, tengo que configurar todo eso.
* [] **Importar los contactos de la base de datos de Google Sheets:** al sistema
* [] **Migrar los datos de las campañas del antiguo sistema**: el sistema de n8n se hicieron dos campañas, migrar los datos para ya ver esas estadisticas en el nuevo sistema

