#!/usr/bin/env python3
"""Optional KDE/Qt tray client for the local qz subscription dashboard."""
import json
import os
import sys
import urllib.request
import webbrowser

try:
    from PySide6.QtCore import QObject, QTimer, Qt
    from PySide6.QtGui import QAction, QColor, QCursor, QIcon, QPainter, QPixmap
    from PySide6.QtWidgets import (
        QApplication,
        QFrame,
        QHBoxLayout,
        QLabel,
        QMenu,
        QProgressBar,
        QSystemTrayIcon,
        QVBoxLayout,
        QWidget,
    )
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


def percent_for(snapshot, key, value):
    if key.endswith('RemainingPercent') and isinstance(value, (int, float)):
        return max(0, min(100, float(value)))
    limit = (snapshot.get('limits') or {}).get(key)
    if isinstance(value, (int, float)) and isinstance(limit, (int, float)) and limit > 0:
        return max(0, min(100, float(value) * 100 / limit))
    return None


class UsagePopup(QWidget):
    def __init__(self):
        super().__init__(None, Qt.WindowType.ToolTip | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setStyleSheet('''
            QWidget#card { background: #101820; border: 1px solid #304150; border-radius: 14px; }
            QLabel { color: #d9e3ec; }
            QLabel#title { color: #f4f7fa; font-size: 15px; font-weight: 700; }
            QLabel#muted { color: #8fa2b3; font-size: 11px; }
            QLabel#provider { color: #f4f7fa; font-size: 12px; font-weight: 700; }
            QLabel#model { color: #aebdca; font-size: 11px; }
            QProgressBar { min-height: 8px; max-height: 8px; border: 0; border-radius: 4px; background: #263542; }
            QProgressBar::chunk { border-radius: 4px; background: #55d6b4; }
        ''')
        self.card = QFrame(self)
        self.card.setObjectName('card')
        self.layout = QVBoxLayout(self.card)
        self.layout.setContentsMargins(16, 14, 16, 14)
        self.layout.setSpacing(8)
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.addWidget(self.card)
        self.setFixedWidth(330)

    def render(self, document):
        while self.layout.count():
            item = self.layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        title = QLabel('QZ Usage Console')
        title.setObjectName('title')
        self.layout.addWidget(title)
        live = QLabel('LIVE · actualización automática cada 15 s')
        live.setObjectName('muted')
        self.layout.addWidget(live)
        if not document:
            unavailable = QLabel('Dashboard no disponible')
            unavailable.setObjectName('muted')
            self.layout.addWidget(unavailable)
            return
        for snapshot in document.get('snapshots', []):
            provider = QLabel(str(snapshot.get('provider', 'unknown')).upper())
            provider.setObjectName('provider')
            self.layout.addWidget(provider)
            remaining = snapshot.get('remaining') or {}
            limits = snapshot.get('limits') or {}
            rows = []
            for key, value in remaining.items():
                percent = percent_for(snapshot, key, value)
                if percent is not None:
                    label = key.removesuffix('RemainingPercent') if key.endswith('RemainingPercent') else key
                    rows.append((label, percent))
            for model, limit in limits.items():
                if model not in remaining and isinstance(limit, (int, float)):
                    rows.append((model, None))
            for label, percent in rows:
                row = QVBoxLayout()
                row.setSpacing(3)
                heading = QHBoxLayout()
                model = QLabel(str(label))
                model.setObjectName('model')
                heading.addWidget(model)
                heading.addStretch()
                value = QLabel(f'{percent:.0f}% restante' if percent is not None else 'sin dato')
                value.setObjectName('muted')
                heading.addWidget(value)
                row.addLayout(heading)
                bar = QProgressBar()
                bar.setRange(0, 100)
                bar.setValue(int(percent or 0))
                row.addWidget(bar)
                self.layout.addLayout(row)
            if not rows:
                empty = QLabel('Sin límites publicados')
                empty.setObjectName('muted')
                self.layout.addWidget(empty)

    def place_near(self, rect):
        if not rect.isValid():
            return
        point = rect.center()
        x = point.x() - self.width() // 2
        y = rect.top() - self.height() - 10
        self.move(max(8, x), max(8, y))


class Tray(QObject):
    def __init__(self):
        super().__init__()
        self.tray = QSystemTrayIcon(make_icon('#8d9bad'))
        self.document = None
        self.popup = UsagePopup()
        # Disable the native Qt tooltip: KDE renders it as an unstyled text
        # bubble. The tray uses the custom popup below instead.
        self.tray.setToolTip('')
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
        self.tray.activated.connect(self.on_activated)
        self.tray.show()
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(POLL_MS)
        self.hover_timer = QTimer(self)
        self.hover_timer.timeout.connect(self.update_hover_popup)
        self.hover_timer.start(120)
        self.refresh()

    def refresh(self):
        document = fetch()
        self.document = document
        self.tray.setIcon(make_icon(color_for(document or {})))
        self.tray.setToolTip('')
        self.popup.render(document)

    def on_activated(self, reason):
        if reason != QSystemTrayIcon.ActivationReason.Trigger:
            return
        if self.popup.isVisible():
            self.popup.hide()
            return
        self.popup.render(self.document)
        self.popup.adjustSize()
        self.popup.move(QCursor.pos().x() - self.popup.width() // 2, QCursor.pos().y() - self.popup.height() - 12)
        self.popup.show()
        self.popup.raise_()

    def update_hover_popup(self):
        tray_rect = self.tray.geometry()
        cursor = QCursor.pos()
        over_tray = tray_rect.isValid() and tray_rect.adjusted(-5, -5, 5, 5).contains(cursor)
        over_popup = self.popup.isVisible() and self.popup.geometry().adjusted(8, 8, -8, -8).contains(cursor)
        if over_tray:
            self.popup.render(self.document)
            self.popup.adjustSize()
            self.popup.place_near(tray_rect)
            self.popup.show()
            self.popup.raise_()
        elif not over_popup:
            self.popup.hide()


app = QApplication(sys.argv)
app.setQuitOnLastWindowClosed(False)
if not QSystemTrayIcon.isSystemTrayAvailable():
    print('No hay un StatusNotifier/System Tray disponible en esta sesión KDE.', file=sys.stderr)
    sys.exit(3)
tray = Tray()
sys.exit(app.exec())
