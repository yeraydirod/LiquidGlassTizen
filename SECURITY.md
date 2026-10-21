# Seguridad

Antes de arrancar LiquidGlassTizen se revisó línea a línea el código de AeroTizen 0.1.0. No había código malicioso, puertas traseras, publicidad ni telemetría. Sí había algunos descuidos, y estos son los que se han corregido.

## Lo que se ha reforzado

| Antes | Ahora | Prueba |
| --- | --- | --- |
| El servicio de la tele (puerto local 47790) devolvía su estado completo a cualquiera: qué apps tienes y cuáles están abiertas | Responde solo `{"ok":true}`, acepta únicamente ids de app con formato válido y solo peticiones GET | `tests/launcher/service.test.js` |
| El inicio de sesión de Samsung usaba siempre el mismo `state`, así que otra página del navegador podía colar su token | Cada inicio de sesión genera un `state` aleatorio y se compara en tiempo constante. Si Samsung lo rechazara algún día: `lgtizen certs --fixed-state` | `test_sign_in_*` |
| La conexión del mando (puerto 8002) aceptaba cualquier certificado y enviaba el token | Se recuerda la huella del certificado de la tele la primera vez y se comprueba **antes** de enviar el token. Si cambia, se corta y se explica qué hacer | `test_remote_pins_the_tv_and_refuses_an_impostor` |
| Los ids de app se pegaban sin validar en comandos que ejecuta la tele | Se validan antes de enviar nada (instalar, desinstalar, abrir, depurar) | `test_sdb_refuses_odd_ids_*`, `test_app_id_of_*` |
| Claves, contraseña de los certificados y token del mando se creaban con permisos por defecto | Se crean con permisos `0600` (solo tu usuario) | `test_private_files_are_owner_only` |
| `tools/fetch_logos.py` metía en la página lo que viniera del CDN | Solo acepta datos de trazado SVG | — |
| Las coordenadas del tiempo iban sin codificar en la URL | Se codifican con `encodeURIComponent` | — |

El aspecto y el comportamiento del lanzador son los mismos: las capturas de la pantalla de inicio, el foco y los ajustes salen idénticas píxel a píxel a las del original.

## Pendiente de probar en una tele real

- **Limitar `<access origin="*">` en `launcher/config.xml`** a `ipapi.co`, `api.open-meteo.com` y `127.0.0.1`. No se ha cambiado porque, si Tizen bloquease la conexión local, el botón Home dejaría de devolverte al lanzador sin avisar. Hay que probarlo en la tele antes.
- **Proteger `/leave` del servicio.** Otra app de la tele podría pedir al servicio que deje de vigilar el botón Home. Para impedirlo, lanzador y servicio necesitan compartir un secreto, y eso también requiere probarlo en la tele.

## Privacidad

- **El tiempo:** ipapi.co recibe la IP pública de tu tele (para saber tu ciudad) y Open-Meteo unas coordenadas aproximadas. Ninguno pide cuenta.
- **Los certificados:** tu token de Samsung, tu email y el identificador de la tele se envían solo a los servidores oficiales de Samsung, igual que hace Tizen Studio.
- **Nada más:** no hay analítica ni se envía nada a los autores.

## ¿Has encontrado algo?

Abre un issue en el repositorio. Si es grave, no publiques los detalles: pide en el issue una forma de contacto privada.
