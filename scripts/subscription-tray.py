#!/usr/bin/env python3
"""Optional KDE/Qt tray client for the local qz subscription dashboard."""
import json
import os
import sys
import urllib.request
import webbrowser

try:
    from PySide6.QtCore import QObject, QTimer, Qt
    from PySide6.QtGui import QAction, QColor, QIcon, QPainter, QPixmap
    from PySide6.QtWidgets import QApplication, QMenu, QSystemTrayIcon
except ImportError:
    print('qz usage tray requiere PySide6. Instalarlo en un entorno aislado y volver a ejecutar.', file=sys.stderr)
    sys.exit(2)

API = os.environ.get('QZ_SUBSCRIPTIONS_URL', 'http://127.0.0.1:4319')
POLL_MS = int(os.environ.get('QZ_TRAY_POLL_MS', '15000'))


def fetch():
    try:
        with urllib.request.urlopen(f'{API}/api/snapshots', timeout=3) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception:
        return None


def remaining(snapshot):
    values = [v for k, v in (snapshot.get('remaining') or {}).items() if k.endswith('RemainingPercent') and isinstance(v, (int, float))]
    if values:
        return min(values)
    values = []
    for model, value in (snapshot.get('remaining') or {}).items():
        limit = (snapshot.get('limits') or {}).get(model)
        if isinstance(value, (int, float)) and isinstance(limit, (int, float)) and limit > 0:
            values.append(value * 100 / limit)
    return min(values) if values else None


def color_for(document):
    values = [remaining(item) for item in document.get('snapshots', []) if remaining(item) is not None]
    if not values:
        return '#8d9bad'
    minimum = min(values)
    return '#55d6b4' if minimum >= 40 else '#f6b65f' if minimum >= 15 else '#ff7d77'


def make_icon(color):
    pixmap = QPixmap(32, 32)
    pixmap.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    painter.setBrush(QColor(color))
    painter.setPen(Qt.PenStyle.NoPen)
    painter.drawEllipse(3, 3, 26, 26)
    painter.setPen(QColor('#08131b'))
    painter.drawText(pixmap.rect(), Qt.AlignmentFlag.AlignCenter, 'QZ')
    painter.end()
    return QIcon(pixmap)


def tooltip(document):
    if not document:
        return 'QZ Usage Console\nDashboard no disponible'
    lines = ['QZ Usage Console · LIVE']
    for snapshot in document.get('snapshots', []):
        lines.append('')
        lines.append(snapshot.get('provider', 'unknown').upper())
        for key, value in (snapshot.get('remaining') or {}).items():
            if key.endswith('RemainingPercent'):
                lines.append(f'  {key.removesuffix("RemainingPercent")}: {value:g}% restante')
        for model, value in (snapshot.get('remaining') or {}).items():
            limit = (snapshot.get('limits') or {}).get(model)
            if isinstance(value, (int, float)) and isinstance(limit, (int, float)):
                lines.append(f'  {model}: {value * 100 / limit:.2f}% restante')
    lines.append('')
    lines.append('Click para abrir el dashboard')
    return '\n'.join(lines)


class Tray(QObject):
    def __init__(self):
        super().__init__()
        self.tray = QSystemTrayIcon(make_icon('#8d9bad'))
        self.tray.setToolTip('QZ Usage Console')
        menu = QMenu()
        open_action = QAction('Abrir dashboard', self)
        open_action.triggered.connect(lambda: webbrowser.open(API))
        refresh_action = QAction('Actualizar ahora', self)
        refresh_action.triggered.connect(self.refresh)
        quit_action = QAction('Salir', self)
        quit_action.triggered.connect(QApplication.quit)
        menu.addAction(open_action)
        menu.addAction(refresh_action)
        menu.addSeparator()
        menu.addAction(quit_action)
        self.tray.setContextMenu(menu)
        self.tray.activated.connect(lambda reason: webbrowser.open(API) if reason == QSystemTrayIcon.ActivationReason.Trigger else None)
        self.tray.show()
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(POLL_MS)
        self.refresh()

    def refresh(self):
        document = fetch()
        self.tray.setIcon(make_icon(color_for(document or {})))
        self.tray.setToolTip(tooltip(document))


app = QApplication(sys.argv)
app.setQuitOnLastWindowClosed(False)
if not QSystemTrayIcon.isSystemTrayAvailable():
    print('No hay un StatusNotifier/System Tray disponible en esta sesión KDE.', file=sys.stderr)
    sys.exit(3)
tray = Tray()
sys.exit(app.exec())
