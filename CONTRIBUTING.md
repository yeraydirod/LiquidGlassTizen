# Cómo colaborar

¡Gracias por pasarte! 🙌 Lo que más ayuda es probar LiquidGlassTizen en tu tele y contar en un issue qué modelo tienes, qué año y qué funcionó o qué no. Cada firmware de Samsung tiene sus manías y de momento solo se ha probado un modelo.

## Prepara tu entorno

```bash
git clone https://github.com/yeraydirod/LiquidGlassTizen
cd LiquidGlassTizen
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"     # el comando lgtizen + pytest + ruff
npm install                 # ESLint para el lanzador
```

Antes de abrir un PR, pasa lo mismo que se comprueba en cada cambio:

```bash
ruff check . && ruff format --check .
pytest
npm run lint && npm test
```

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/lgtizen/` | La herramienta para el ordenador: cliente sdb, certificados, firma de apps y limpieza |
| `launcher/` | La app de la tele (HTML, CSS y JS sin compilar) |
| `launcher/js/config.js` | Todas las constantes del lanzador en un solo sitio |
| `launcher/service/` | El servicio en segundo plano que recupera la pantalla cuando pulsas Home |
| `tests/` | Pruebas con pytest (una tele simulada habla el protocolo sdb) y del servicio con Node |
| `dns/`, `docs/` | Listas de bloqueo y la guía de ajustes |

## Trabajar en el lanzador

- **En el navegador:** `python3 -m http.server -d launcher` y abre http://localhost:8000 a 1920×1080. Lo que solo existe en la tele se sustituye por datos de ejemplo.
- **En la tele:** `lgtizen install launcher` y luego `lgtizen-inspect <ip-de-la-tele> LqGlass001.Home`. Tendrás las DevTools de Chrome en http://localhost:9222.
- **Compatibilidad:** escribe JavaScript ES5, porque las teles antiguas no entienden nada más moderno.
- **Animaciones:** anima solo con `transform` y `opacity`; las GPU de las teles no dan para más.

## Pull requests

- Un cambio por PR, contando qué probaste y en qué tele.
- Todo tiene que poder usarse solo con el mando (sin puntero).
- No subas certificados, paquetes `.wgt` ni nada de `~/.config/lgtizen`.
