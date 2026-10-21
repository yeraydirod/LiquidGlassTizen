# Cambios

## 0.3.1

- **Certificados en Mac:** las conexiones con Samsung se verifican ahora con los certificados de confianza del propio sistema (Llavero en Mac, almacén de Windows) mediante `truststore`. Así se evita el error `CERTIFICATE_VERIFY_FAILED` del Python de python.org en Mac. Si aun así falla, el programa explica qué hacer en lugar de mostrar un error técnico.

## 0.3.0: Liquid Glass

- **Nuevo aspecto Liquid Glass** inspirado en Apple TV: barra superior en dos cápsulas de cristal, iconos con esquinas redondeadas, borde de luz y brillo al enfocarlos, foco que eleva la app con una sombra profunda, entradas HDMI en tarjetas de cristal, ajustes en un gran panel esmerilado y opciones en píldoras.
- **Ajuste "Glass effects"** con cuatro modos: Automático, Completo, Ligero y Apagado. Automático usa Ligero si el navegador de la tele no puede desenfocar. Si puede, mide los fps una sola vez con el efecto completo y lo mantiene solo si va a 45 fps o más.
- **Fondo nuevo "Liquid"**, ahora el predeterminado.
- **Fuente Inter** incluida en la app, para que funcione sin Internet.
- **Modo Apagado idéntico al original:** las capturas salen iguales píxel a píxel a las de AeroTizen.

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
