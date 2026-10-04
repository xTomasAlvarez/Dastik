# 📊 Estado del Proyecto: Sistema POS & Inventario Streetwear

## 📌 Contexto Actual
El proyecto se encuentra en fase de inicialización. Se han definido las directrices de arquitectura (.NET 8, SQL Server), reglas transaccionales y la guía de diseño UI estricta (Estilo Avant-Garde/Lujo Urbano, Syne/Epilogue, Phosphor Icons). 

## 🟢 Tarea Actual (En Progreso)
- [ ] Definir el esquema de dominio inicial y las reglas lógicas del negocio (Inventario y Caja).

## 📝 Próximos Pasos (Backlog)
- [ ] Inicializar solución de .NET 8 (Web API).
- [ ] Configurar DbContext de EF Core.
- [ ] Inicializar proyecto React + Vite.
- [ ] Configurar Tailwind CSS y tipografías.

## ✅ Tareas Completadas
- [x] Definición del Stack Tecnológico.
- [x] Redacción de skill de diseño Frontend (`skill_guia_diseno_ui.md`).
- [x] Redacción de skill de arquitectura Backend (`skill_dotnet_arquitectura.md`).
- [x] Redacción de skill de base de datos (`skill_efcore_transacciones.md`).
- [x] Redacción de orquestador maestro (`skill_orquestador.md`).

## ⚠️ Notas Técnicas y Bloqueos
- **Arquitectura:** Modular Monolith con CQRS (MediatR).
- **Diseño:** Cero sombras, bordes rectos (1px), alta densidad.
- **Finanzas:** Todo cálculo monetario va en `decimal(18,2)`.