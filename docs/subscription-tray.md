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
como recurso administrado del kit. En la primera ejecución de `qz-kit
subscriptions tray`, el kit crea automáticamente
`~/.local/share/qz-agent-kit/tray-venv` e instala allí PySide6. Las ejecuciones
siguientes reutilizan ese entorno; el Python global no se modifica.

```bash
qz-kit subscriptions tray
```

Para diagnosticar sin instalar dependencias: `qz-kit subscriptions tray
--no-install`. Si falta `python3-venv`, el comando lo informa y termina sin
modificar el sistema operativo; la instalación del paquete OS queda a cargo del
usuario.
