# Cambios

## 0.2.0: LiquidGlassTizen

Primera versión con el nuevo nombre, a partir de AeroTizen 0.1.0 (proyecto idea).

- **Nuevo nombre en todas partes:** comando `lgtizen` (y `lgtizen-inspect`), paquete de la tele `LqGlass001` y servicio en el puerto 47791. Así puede convivir con AeroTizen sin chocar.
- **Migración automática:** la primera vez que ejecutas `lgtizen` se copian tus certificados y tokens de `~/.config/aerotizen`.
- **Aviso al instalar:** `lgtizen install` te avisa si sigue instalado el lanzador de AeroTizen, para que no se peleen por el botón Home.
- **Seguridad reforzada:** servicio local que no expone tu lista de apps, `state` aleatorio al iniciar sesión en Samsung, certificado de la tele fijado en el mando, ids validados antes de mandarlos a la tele y ficheros secretos con permisos `0600`. Detalles en [SECURITY.md](SECURITY.md).
- **Más pruebas:** se pasa de 10 a 23 pruebas de Python, más una prueba del servicio de la tele en Node.
- **Documentación nueva en español.**

## 0.1.0: AeroTizen (proyecto idea)

Primera versión pública de AeroTizen, de Hamza El Alaoui: CLI con cliente sdb en Python puro, certificados, firma, instalación y limpieza de apps, y un lanzador con cuadrícula de apps, entradas, chimenea, 31 fondos y el tiempo.
