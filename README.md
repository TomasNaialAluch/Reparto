# Mi Reparto - Sistema de Gestión de Repartos

## 🚀 **Aplicación en Producción**
**URL:** https://mireparto.web.app

## 📋 **Descripción**
Mi Reparto es una aplicación web desarrollada en React para la gestión eficiente de repartos diarios y seguimiento de saldos de clientes. Permite a los usuarios organizar sus entregas, calcular balances y generar reportes de manera sencilla.

## ✨ **Características Principales**

### 🛒 **Gestión de Repartos**
- **Crear repartos diarios** con múltiples clientes
- **Agregar clientes** con montos y direcciones
- **Editar montos** directamente en la tabla
- **Marcar pagos** (completo, parcial, pendiente)
- **Reordenar clientes** mediante drag & drop
- **Guardar repartos** para consulta posterior
- **Imprimir listas** de repartos optimizadas

### 💰 **Gestión de Saldos de Clientes**
- **Calcular saldos** detallados por cliente
- **Registrar boletas vendidas** con fechas
- **Registrar ventas** y plata a favor
- **Seguimiento de pagos** (efectivo, cheques, transferencias)
- **Cálculo automático** de saldos finales
- **Imprimir resúmenes** de cuentas

### 📊 **Reportes y Análisis**
- **Filtros por fecha** (hoy, semana, mes, año)
- **Visualización de deudores** pendientes
- **Totales automáticos** en tiempo real
- **Historial completo** de transacciones

### 🔐 **Autenticación**
- **Login con Google** para administradores
- **Acceso anónimo** para uso temporal
- **Gestión de sesiones** automática

## 🛠️ **Tecnologías Utilizadas**

- **Frontend:** React 18 + Vite
- **Backend:** Firebase (Firestore + Authentication)
- **UI:** Bootstrap 5 + React Bootstrap
- **Funcionalidades:** Drag & Drop (SortableJS)
- **Deploy:** Firebase Hosting

## 🚀 **Instalación y Uso Local**

### **Prerrequisitos**
- Node.js 16+ 
- npm o yarn
- Cuenta de Firebase

### **Instalación**
```bash
# Clonar repositorio
git clone https://github.com/TomasNaialAluch/Reparto.git
cd Reparto

# Instalar dependencias
npm install

# Configurar Firebase
# Editar src/firebase/config.js con tu configuración

# Ejecutar en desarrollo
npm run dev
```

### **Build para Producción**
```bash
npm run build
npm run preview
```

## 📱 **Funcionalidades por Sección**

### **🏠 Página Principal**
- Navegación entre secciones
- Estado de conexión con Firebase
- Información del usuario autenticado

### **📦 Mi Reparto**
- Formulario para agregar clientes
- Tabla interactiva de clientes del día
- Botones de acción (Guardar, Imprimir)
- Panel de repartos guardados
- Gráficos de reportes

### **💰 Saldo Clientes**
- Formulario completo para calcular saldos
- Secciones para boletas, ventas, pagos
- Cálculo automático de saldo final
- Historial de clientes guardados
- Filtros por fecha

## 🎨 **Interfaz de Usuario**

- **Diseño responsivo** para móviles y escritorio
- **Tema claro** con colores profesionales
- **Navegación intuitiva** con iconos descriptivos
- **Feedback visual** para acciones del usuario
- **Modales** para edición de datos

## 🔧 **Estructura del Proyecto**

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas principales
├── firebase/           # Configuración y hooks de Firebase
├── utils/              # Utilidades (formato de moneda, impresión)
├── contexts/           # Contextos de React
└── assets/             # Recursos estáticos
```

## 📈 **Estado del Proyecto**

- ✅ **Funcionalidades principales** implementadas
- ✅ **Autenticación** funcionando
- ✅ **CRUD completo** para repartos y clientes
- ✅ **Deploy en producción** exitoso
- ⚠️ **Sistema de impresión** requiere corrección (ver README-TODO.md)

## 🤝 **Contribución**

1. Fork del repositorio
2. Crear rama para nueva funcionalidad
3. Commit de cambios
4. Push a la rama
5. Crear Pull Request

## 📄 **Licencia**

Este proyecto es de uso personal y educativo.

## 👨‍💻 **Desarrollador**

**Tomas Naial Aluch**
- GitHub: [@TomasNaialAluch](https://github.com/TomasNaialAluch)

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024  
**Estado:** En desarrollo activo