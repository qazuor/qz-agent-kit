# qz usage tray

`qz usage tray` es un cliente opcional para Ubuntu con KDE Plasma. Lee los
snapshots del dashboard local en `http://127.0.0.1:4319/api/snapshots` y no
consulta proveedores ni credenciales directamente.

La app ofrece:

- icono de bandeja compatible con `QSystemTrayIcon`/StatusNotifier;
- tooltip actualizado cada 15 segundos;
- color verde, amarillo, rojo o gris según el margen disponible o estado offline;
- click para abrir el dashboard;
- menú para actualizar o salir.

El componente está implementado en `scripts/subscription-tray.py` y se instala
como recurso administrado del kit. Requiere PySide6 en el entorno de Python
que lo ejecute; la dependencia es opcional y no se instala silenciosamente.

```bash
qz-kit subscriptions tray
```

Si PySide6 no está disponible, el comando termina sin tocar nada y explica la
dependencia faltante. La instalación futura debe usar un entorno virtual
propio del kit, no el Python global.
