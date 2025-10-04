# MiReparto React App

Aplicación web para gestión de repartos y saldos de clientes, convertida de HTML a React con integración de Firebase.

## 🚀 Características

- **Mi Reparto**: Gestión de clientes del día con pagos y deudas
- **Saldo Clientes**: Cálculo detallado de saldos pendientes
- **Firebase Integration**: Base de datos en tiempo real
- **Responsive Design**: Funciona en móviles y desktop
- **Impresión Optimizada**: Listas optimizadas para imprimir

## 📱 Páginas Implementadas

### ✅ Completadas
- **Home**: Página principal con navegación
- **Mi Reparto**: Gestión de clientes con funcionalidades:
  - Agregar clientes con validación
  - Editar montos con modal elegante
  - Marcar pagos (completo/parcial)
  - Arrastrar y soltar para reordenar
  - Eliminar clientes sin confirmación
  - Ver deudores automáticamente
  - Imprimir lista optimizada

- **Saldo Clientes**: Cálculo de saldos con:
  - Formulario dinámico para boletas
  - Múltiples métodos de pago
  - Cálculo automático de saldo final
  - Impresión de resumen

### 🔄 En Desarrollo
- **DolarHoy**: Cotización del dólar
- **Transferencias**: Gestión de transferencias

## 🛠️ Tecnologías

- **React 18** con Vite
- **Bootstrap 5** para UI
- **React Bootstrap** para componentes
- **Firebase** para backend
- **SortableJS** para drag & drop
- **React Router** para navegación

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd mireparto-react

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🔥 Firebase Setup

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Firestore Database
3. Configurar reglas de seguridad:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Actualizar configuración en `src/firebase/config.js`

## 🎨 Diseño

- **Fondo pastel**: `#FAFBFF`
- **Colores principales**: `#A9D6E5` (azul claro)
- **Layout responsive**: Bootstrap grid system
- **Componentes modulares**: Reutilizables y mantenibles

## 📝 Funcionalidades Principales

### Mi Reparto
- ✅ Formulario de cliente con validación
- ✅ Modal para editar montos (clic + Enter)
- ✅ Sistema de pagos completo/parcial
- ✅ Drag & drop para reordenar
- ✅ Eliminación directa (sin confirmación)
- ✅ Cálculos en tiempo real
- ✅ Impresión optimizada

### Saldo Clientes
- ✅ Formularios dinámicos
- ✅ Checkboxes que auto-agregan filas
- ✅ Formateo automático de moneda
- ✅ Cálculo de saldo final
- ✅ Resumen imprimible

## 🚀 Deploy

Para hacer deploy en Vercel/Netlify:

```bash
# Build para producción
npm run build

# Los archivos estarán en /dist
```

## 📄 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Navbar.jsx
│   ├── Notification.jsx
│   ├── SortableTable.jsx
│   └── ...
├── pages/              # Páginas principales
│   ├── Home.jsx
│   ├── MiReparto.jsx
│   └── SaldoClientes.jsx
├── firebase/           # Configuración Firebase
│   ├── config.js
│   └── hooks.js
├── hooks/              # Custom hooks
│   └── useNotifications.js
└── App.jsx            # Componente principal
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter de código

## 📱 Responsive Design

- **Desktop**: Layout completo con sidebar derecho reservado
- **Tablet**: Layout adaptado
- **Mobile**: Stack vertical optimizado

## 🎯 Próximas Funcionalidades

- [ ] Integración completa con Firebase
- [ ] Autenticación de usuarios
- [ ] Historial de repartos
- [ ] Reportes y estadísticas
- [ ] Notificaciones push
- [ ] Modo offline

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en el repositorio.

---

**Desarrollado con ❤️ para gestión de repartos**