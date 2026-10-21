# Limpieza desde el menú de la tele (sin ordenador)

Diez minutos con el mando y tu tele deja de enseñarte anuncios y de chivarse de lo que ves. 🕵️

Los menús están en inglés tal y como aparecen en un modelo de 2024 (UN65DU7200, Tizen 9.0, EE. UU.). Samsung los renombra cada año, y en los modelos de 2025 algunos se han movido a **Advanced Features**.

## 1. Arranca sin pasar por el escaparate

`Settings > All Settings > General & Privacy > Start Screen Option`

- **Start with Smart Hub Home:** Off. La tele se enciende en la última entrada que usaste.
- **Autorun Last App:** Off (o On, si quieres que vuelva a abrir YouTube o lo que estuvieras viendo).
- **Autorun Samsung TV Plus:** Off, si aparece.

## 2. Adiós a las "Top Picks" y a los anuncios personalizados

`Settings > All Settings > General & Privacy > Terms & Privacy > Privacy Choices`
(en modelos antiguos: `Settings > Support > Terms & Privacy`)

- **Viewing Information Services:** Off. Es el ACR, que reconoce lo que aparece en pantalla.
- **Interest-Based Advertisements:** Off.
- **Voice Recognition Services:** Off, salvo que uses la voz.
- Cualquier cosa llamada **Personalized Content**, **Customization Service** o **Recommendations:** Off.

## 3. Esconde Samsung TV Plus

En la pantalla de inicio, colócate sobre **Samsung TV Plus**, pulsa **abajo** (o mantén **OK**) y elige **Disable**. No se puede desinstalar, pero así desaparecen el icono y sus canales.

## 4. Quita las apps sugeridas del inicio

En la fila **For You** o de apps: ve hasta el final, **Edit List**, elige la app, pulsa **abajo** y luego **Remove**.

## 5. Borra las apps que no usas

`Home > Apps > Settings (rueda dentada, arriba a la derecha) > elige la app > Delete`

En Tizen 6 o superior es la única forma de quitar apps de la tienda o preinstaladas. Desde el ordenador (`sdb`) la tele responde `can not uninstall app`.

## 6. Bloquea los servidores de anuncios con DNS

`Settings > All Settings > Connection > Network > Network Status > IP Settings`

- **DNS Setting:** Enter manually
- **DNS Server:** `94.140.14.14` (AdGuard DNS, gratis y sin cuenta)

Comprobado: AdGuard DNS bloquea `samsungads.com` y `samsungacr.com`, mientras YouTube, Netflix y la tienda de Samsung (`lcprd1.samsungcloudsolution.net`) siguen funcionando. Si tienes Pi-hole, AdGuard Home o NextDNS, carga mejor [`../dns/samsung-ads.txt`](../dns/samsung-ads.txt).

> ⚠️ No uses `samsung-aggressive.txt` a la ligera: también bloquea las actualizaciones de firmware y la tele se queda sin parches de seguridad.

Para deshacerlo, vuelve a poner **DNS Setting** en **Obtain automatically**.
