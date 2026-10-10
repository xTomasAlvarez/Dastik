# 📊 Estado del Proyecto: ERP/POS Dastik & Hidden Sneakers

## 📌 Contexto Actual
El proyecto se encuentra en fase de andamiaje (Backend). Se han definido las directrices de arquitectura Cloud-Native (.NET 8 Web API, PostgreSQL, React + Vite), las reglas transaccionales del negocio, y la integración omnicanal con Tiendanube. 

## 🟢 Tarea Actual (En Progreso)
- [ ] Fase 1: Inicializar solución de .NET 8 con enfoque TDD (Web API + xUnit + FluentAssertions).

## 📝 Próximos Pasos (Backlog)
- [ ] Modelado de Dominio en C# (Fase 2: Code-First con Fluent API en EF Core).
- [ ] Desarrollo de Casos de Uso Core: Motor Financiero y Caja (Fase 3 y 4 con MediatR).
- [ ] Integración API Tiendanube y validación de Webhooks (Fase 5).
- [ ] Inicializar proyecto React + Vite (Arquitectura Feature-Driven / Screaming Architecture).
- [ ] Configurar UI (Tailwind CSS, tipografías Syne/Epilogue, escáner HID optimizado).

## ✅ Tareas Completadas
- [x] Consolidación del manual de requerimientos y reglas de negocio (`KNOWLEDGE_BASE.md`).
- [x] Ingeniería inversa del catálogo de Tiendanube (Variantes, Talles string, Códigos de barra auto-generados).
- [x] Generación y securización del Access Token de Tiendanube (archivo `.env` aislado en backend).
- [x] Definición de Infraestructura (Render para Backend/DB, Vercel para Frontend, Tiendanube CDN para imágenes).
- [x] Configuración del entorno local base (`.gitignore`).

## ⚠️ Notas Técnicas y Restricciones
- **Arquitectura Backend:** Modular Monolith (Vertical Slices) con CQRS (MediatR).
- **Metodología:** Desarrollo guiado por pruebas (TDD) obligatorio para cálculos financieros y comisiones.
- **Base de Datos:** PostgreSQL. Todo cálculo monetario exige tipo estricto `decimal(18,2)`.
- **Diseño UI:** Estilo Avant-Garde, navegación Keyboard-First/Barcode-First sin bloqueos de red.
- **Media:** Estrategia "Zero Media Storage" (solo se guardan strings con URLs de Tiendanube).