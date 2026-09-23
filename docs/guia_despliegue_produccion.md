# Guía de Despliegue en Producción (VPS)

Esta guía detalla el paso a paso para subir tu aplicación `3f-mailer` a un servidor de producción (VPS) desde cero, asumiendo que ya tienes acceso a una VPN (OpenVPN) que te permite ver el servidor.

---

## 1. Conexión al Servidor

Ya que tenés OpenVPN configurado y encendido, tu computadora ahora está en la misma "red virtual" que el servidor. 

Para entrar al servidor, necesitas usar el protocolo **SSH** desde tu terminal.

1. Abrí tu terminal (PowerShell o Git Bash).
2. Ejecutá el siguiente comando (reemplazá `usuario` por tu nombre de usuario en el servidor, y `10.x.x.x` por la IP privada de OpenVPN del servidor):
   ```bash
   ssh usuario@10.x.x.x
   ```
3. Te va a pedir la contraseña. Escribila (no se van a ver los caracteres mientras escribís por seguridad) y presioná Enter.
4. ¡Listo! Ya estás dentro de la consola del servidor. Todo lo que escribas a partir de ahora se ejecuta allá.

---

## 2. Instalar Docker y Git en el Servidor

Una vez dentro del servidor, asegurate de tener las herramientas necesarias instaladas. Si es un servidor Ubuntu/Debian, corré esto:

```bash
# Actualizar los repositorios del servidor
sudo apt update && sudo apt upgrade -y

# Instalar Git
sudo apt install git -y

# Instalar Docker y Docker Compose
sudo apt install docker.io docker-compose-v2 -y

# Habilitar Docker para que inicie automáticamente al reiniciar el servidor
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Subir el Código al Servidor

La forma más profesional y limpia de subir el código es clonándolo directamente desde tu repositorio de GitHub.

1. Posicionate en tu carpeta de usuario:
   ```bash
   cd ~
   ```
2. Cloná el repositorio:
   ```bash
   git clone https://github.com/LeonardoMuranodev/3f-mailer.git
   ```
3. Entrá a la carpeta del proyecto:
   ```bash
   cd 3f-mailer
   ```

> [!TIP]
> Cada vez que hagas un cambio en tu compu y lo subas a GitHub (`git push`), en el servidor solo tendrás que entrar a esta carpeta y ejecutar `git pull` para descargar la actualización.

---

## 4. Configurar las Variables de Entorno (.env)

El archivo `.env` tiene tus contraseñas y claves, por lo que **no se sube a GitHub**. Debés crearlo manualmente en el servidor.

1. Usá el editor de texto `nano` para crear el archivo:
   ```bash
   nano .env
   ```
2. Copiá todo el contenido de tu `.env` local y pegalo en la terminal del servidor (con click derecho o `Ctrl+Shift+V`).
3. **¡IMPORTANTE!** Cambiá estas dos variables clave para producción:
   ```env
   NODE_ENV=production
   PUBLIC_API_URL=https://tu-dominio.com.ar # (O el dominio que vayas a usar)
   ```
4. Guardá el archivo presionando `Ctrl + O`, luego `Enter`, y salí con `Ctrl + X`.

---

## 5. Preparar el Puerto de Docker

En tu archivo `docker-compose.prod.yml`, el Frontend expone el puerto `80`. Sin embargo, para poder usar **Certbot (HTTPS)** fácilmente, es mejor instalar un Nginx directamente en el servidor que funcione como intermediario y le pase el tráfico a Docker.

Modificá el `docker-compose.prod.yml` en el servidor:
```bash
nano docker-compose.prod.yml
```
Buscá la sección `frontend` y cambiá los puertos de `"80:80"` a `"3001:80"`:
```yaml
  frontend:
    # ...
    ports:
      - "3001:80" # <-- Modificar esto
```
Guardá y cerrá (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 6. Arrancar la Aplicación

Con todo configurado, levantá los contenedores usando el archivo de producción:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
```

Esto va a descargar, compilar y arrancar la base de datos, el backend y el frontend. Va a demorar unos minutos la primera vez. Una vez termine, la app estará corriendo en el puerto 3001 del servidor interno.

---

## 7. Configurar el Dominio y HTTPS (Candadito Verde)

Para que la aplicación sea accesible públicamente por tu dominio (ej. `app.tu-dominio.com.ar`) y de forma segura (HTTPS), configuraremos Nginx en el servidor real.

### Paso 7.1: Apuntar el Dominio
Entrá a tu proveedor de dominio (ej. NIC Argentina, Cloudflare, Namecheap) y creá un **Registro A** que apunte a la **IP Pública** de tu servidor VPS.

### Paso 7.2: Instalar Nginx y Certbot
Volvé a la consola del servidor y ejecutá:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Paso 7.3: Configurar Nginx
Creamos el archivo de configuración para tu dominio:
```bash
sudo nano /etc/nginx/sites-available/mailer
```
Pegá esto (cambiando `tu-dominio.com.ar` por tu dominio real):
```nginx
server {
    listen 80;
    server_name tu-dominio.com.ar;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Guardá y salí. Luego activá la configuración y reiniciá Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mailer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 7.4: Activar HTTPS con Certbot
Finalmente, pedile a Certbot que genere los certificados SSL e inyecte la seguridad automáticamente en Nginx:
```bash
sudo certbot --nginx -d tu-dominio.com.ar
```
Te va a pedir tu correo (para avisos de renovación) y que aceptes los términos. 

> [!TIP]
> Los certificados duran 90 días, pero Certbot configura automáticamente una tarea (`cron`) para renovarlos por sí solo.

---

### ¡Listo! 🚀
Ya podés entrar a `https://tu-dominio.com.ar` desde el navegador. La aplicación está en producción.
