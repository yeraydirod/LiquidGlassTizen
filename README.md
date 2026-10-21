# LiquidGlassTizen

**Tu tele Samsung, sin anuncios y con la pantalla de inicio que se merece.**

![Pantalla de inicio de LiquidGlassTizen con efecto cristal](docs/screenshots/glass-home.png)

Enciendes la tele para ver una película y lo primero que te recibe es un escaparate: "Top Picks for You", Samsung TV Plus arrancando solo y una fila de apps que nunca pediste. Además, la tele va tomando nota de lo que ves.

LiquidGlassTizen lo arregla en dos partes:

- 🖥️ **Un lanzador para la tele** que sustituye la pantalla de inicio de Samsung. Se abre al encender y vuelve cuando pulsas Home.
- 💻 **Una herramienta para tu ordenador** (`lgtizen`) que prepara la tele, instala el lanzador y te enseña qué apps de fábrica sobran.

No necesitas Tizen Studio, ni root, ni pelearte con un SDK de varios gigas.

## Qué trae

**En la tele**

- 🫧 **Aspecto Liquid Glass**, al estilo de Apple TV: barras de cristal esmerilado flotando sobre el fondo, iconos con bordes redondeados y un brillo que los recorre, y el foco que *levanta* la app hacia ti en lugar de pintarle un borde. Tienes cuatro modos en Ajustes:
  - **Automático:** la tele lo decide sola la primera vez que arranca. Si va fluida, usa Completo.
  - **Completo:** desenfoque real del fondo detrás de cada panel.
  - **Ligero:** el mismo diseño con un tinte más denso, para teles antiguas o lentas.
  - **Apagado:** el aspecto plano original.
- 🧩 Tus apps en una cuadrícula de 3 columnas, con sus logos de verdad.
- 🔌 Las entradas HDMI debajo, con el nombre de lo que tienes enchufado. Puedes renombrarlas ("Xbox del salón", "La Play de Lucas").
- ✋ Mantén OK sobre una app para moverla a donde quieras.
- 🌌 31 fondos, 16 animados (aurora, lava, nieve, lluvia, olas...), con control de velocidad y vista previa.
- 🌤️ Hora, fecha, tiempo y tu ciudad arriba, en el formato que prefieras.
- 📶 Un icono que te dice si vas por cable o por Wi-Fi, y con cuánta señal.
- 🔥 Una chimenea para las noches de invierno (vídeo en YouTube, o una animada si no tienes YouTube).
- ⚙️ Ajustes para elegir qué apps se ven, abrir la tienda de Samsung o volver al inicio de Samsung si lo echas de menos.

**En tu ordenador**

- 🔎 Encuentra la tele en tu red.
- 🔐 Crea los certificados de Samsung para tu tele (inicias sesión una vez en tu cuenta Samsung).
- 📦 Firma e instala cualquier app `.wgt`, incluido el lanzador.
- 🧹 Lista las apps instaladas, marca las que sobran y las quita si tu firmware lo permite.

| Ajustes de cristal | Entradas HDMI |
|---|---|
| ![Ajustes](docs/screenshots/glass-settings.png) | ![Entradas HDMI con el foco](docs/screenshots/glass-inputs.png) |

Los nombres de dispositivos y el tiempo de las capturas son de ejemplo.

## Instalación en 4 pasos

Necesitas un ordenador en la misma red que la tele, con Python 3.10 o superior.

**1. Instala la herramienta y busca tu tele**

```bash
pip install git+https://github.com/yeraydirod/LiquidGlassTizen
lgtizen discover
```

**2. Activa el modo desarrollador en la tele**

Abre **Apps**, teclea `12345` con el mando, activa *Developer mode* y pon la IP de tu ordenador en *Host PC IP*. Después **desenchufa la tele un minuto** (apagarla con el mando no basta). Comprueba que ha funcionado:

```bash
lgtizen status   # debe decir developerMode=1
```

**3. Crea los certificados**

```bash
lgtizen certs
```

Se abre la página de inicio de sesión de Samsung en tu navegador. Cuando termines, los certificados quedan guardados en `~/.config/lgtizen`, solo legibles por tu usuario.

**4. Instala el lanzador**

```bash
git clone https://github.com/yeraydirod/LiquidGlassTizen && cd LiquidGlassTizen
lgtizen install launcher
```

Listo. Desde ahora la tele arranca en LiquidGlassTizen y la rueda dentada abre los ajustes. 🎉

Para ver o quitar apps: `lgtizen apps` y `lgtizen debloat`.

> **¿Vienes de AeroTizen?** La primera vez que ejecutes `lgtizen` se copian tus certificados de `~/.config/aerotizen`, así que no tienes que volver a iniciar sesión. Después desinstala el lanzador antiguo para que no se peleen por la pantalla: `lgtizen debloat --remove DclHome001`. Si se te olvida, `lgtizen install` te lo recuerda.

## Más limpieza, sin ordenador

- 📋 [Guía de ajustes de la tele](docs/settings.md): qué apagar para quitar anuncios, el rastreo de lo que ves (ACR) y el arranque automático de TV Plus.
- 🛡️ [Listas DNS](dns/) para Pi-hole, AdGuard Home o NextDNS. Usa `samsung-ads.txt`.

> ⚠️ **Ojo con `samsung-aggressive.txt`.** Bloquea también el servidor de actualizaciones de Samsung, así que **tu tele dejará de recibir parches de seguridad**. Úsala solo si sabes lo que haces.

## Lo que no puede hacer (todavía)

Samsung no permite nada de esto oficialmente, así que hay trucos con letra pequeña:

- Al pulsar Home, el lanzador vuelve en uno o dos segundos. Funciona desde el inicio de Samsung y dentro de Netflix, pero no dentro de YouTube, Prime Video, Stremio o Spotify, porque esas apps no dicen si están en pantalla. El botón Atrás funciona siempre.
- En Tizen 6 o superior, las apps de la tienda y las preinstaladas no se pueden quitar desde el ordenador. Bórralas en la tele desde Apps → Ajustes. Las de sistema (TV Plus, Gaming Hub) solo se pueden desactivar.
- Las apps de la tele se dibujan a 1920×1080 y se escalan, incluso en un panel 4K. Solo el vídeo va a 4K real.
- Los menús propios de Samsung no se pueden cambiar.

## Probado en

| Tele | Año | Firmware |
|---|---|---|
| Samsung 65" Crystal UHD DU7200 (UN65DU7200FXZA) | 2024 | Tizen 9.0 |

Debería funcionar en teles Samsung de 2020 en adelante. Si lo pruebas en la tuya, [cuéntanos cómo te fue](../../issues/new).

## Seguridad y privacidad

El código se ha auditado y no envía nada a sus autores. Las únicas conexiones a Internet son los servidores oficiales de certificados de Samsung (al crear los certificados) y el tiempo: [ipapi.co](https://ipapi.co) para saber tu ciudad a partir de tu IP y [Open-Meteo](https://open-meteo.com) para la previsión. En [SECURITY.md](SECURITY.md) está lo que se ha reforzado respecto al proyecto original y lo que queda pendiente.

## Proyecto idea

LiquidGlassTizen nace de **[AeroTizen](https://github.com/helalaou/AeroTizen)**, de Hamza El Alaoui, publicado con licencia MIT. Él resolvió lo difícil: hablar con la tele sin Tizen Studio, firmar las apps y conseguir que un lanzador se comporte como pantalla de inicio. Gracias. 🙌

AeroTizen a su vez se apoyó en:

- [LTvLauncher](https://github.com/leanbitlab-org/LtvLauncher), inspiración del diseño.
- [Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung) y [tizen-sdb](https://github.com/PatrickSt1991/tizen-sdb), para la conexión de desarrollador, los certificados y la firma.
- [samsung-tizen-tv-debloat](https://github.com/ardazeytin/samsung-tizen-tv-debloat), para saber qué paquetes se pueden quitar sin romper nada.
- Logos de [Simple Icons](https://simpleicons.org) (las marcas son de sus dueños).
- Fuente [Inter](https://rsms.me/inter/), con licencia SIL Open Font License (incluida en `launcher/fonts/`).

El aspecto está inspirado en el estilo de Apple TV, pero está hecho desde cero con CSS propio, sin fuentes, iconos ni código de Apple. Este proyecto no tiene relación con Samsung ni con Apple. Úsalo bajo tu responsabilidad.

## Licencia

[MIT](LICENSE). Se mantiene el aviso de copyright de AeroTizen junto al de LiquidGlassTizen.
