# Reglas del Proyecto Dastik (Workspace Rules)

> [!IMPORTANT]
> **PREVALENCIA ABSOLUTA:** Estas directrices del proyecto Dastik tienen prioridad absoluta sobre cualquier sugerencia, patrón genérico o paquete de skills externo (incluyendo `superpowers`). Ninguna skill externa puede sobreescribir las reglas aquí establecidas.

---

## 1. Ciclo de Orquestación y Seguimiento (`seguimiento.md`)
- **Pre-Ejecución:** Antes de codificar o modificar arquitectura, consultar el archivo `seguimiento.md` en la raíz del proyecto para alinear el contexto con el roadmap activo.
- **Post-Ejecución:** Al concluir las tareas y verificar los tests (`npm run build` y `dotnet test`), actualizar `seguimiento.md` documentando los logros, decisiones técnicas clave y el próximo paso lógico.

---

## 2. Arquitectura de Backend (.NET 8)
- **Modular Monolith & CQRS con MediatR:** Separación estricta entre Queries (lectura) y Commands (escritura).
- **APIs Anémicas:** Las Minimal APIs o Controllers únicamente despachan Commands/Queries vía MediatR y devuelven `IResult` / `IActionResult`. Prohibida la lógica de negocio en endpoints.
- **Validaciones en Pipeline:** Utilizar `FluentValidation` como `IPipelineBehavior` para rechazar requests inválidos antes de que alcancen el Handler.
- **Result Pattern:** Prohibido usar `throw new Exception()` para control de flujo lógico (ej. stock insuficiente, caja cerrada). Retornar siempre `Result<T>`.
- **Global Exception Handling:** RFC 7807 (`ProblemDetails`) para excepciones no controladas. Prohibido exponer stack traces al cliente.
- **Estándares C#:** Asincronismo puro (`async/await` con sufijo `Async`, prohibido `.Result` o `.Wait()`). DTOs y Requests como `record` inmutables.
- **Seguridad:** JWT con políticas explícitas (`[Authorize(Policy = "RequireAdmin")]` o roles). CORS restringido a los orígenes del frontend. Hacia Tiendanube en Producción solo peticiones `GET` salvo autorización explícita.

---

## 3. Integridad de Datos y Persistencia (EF Core)
- **Bloques Transaccionales ACID:** Cualquier operación que altere múltiples entidades (ej. `OrdenVenta` + `Stock` + `MovimientoCaja`) DEBE ejecutarse dentro de un bloque `IDbContextTransaction` (`BeginTransactionAsync`, `CommitAsync`, `RollbackAsync`).
- **Concurrencia Optimista:** Tokens de concurrencia en `Variante` para evitar venta doble de stock.
- **Modelado:** Configuración exclusiva mediante `IEntityTypeConfiguration<T>` con Fluent API. Separación de inventario: el stock y código de barras viven en `Variante`, nunca en `Producto`.
- **Soft Deletes:** Borrado lógico mediante `Activo` / `EsHidden` con Global Query Filters en `DbContext`. Prohibido el `DELETE` físico de productos o recibos históricos.
- **Rendimiento:** `.AsNoTracking()` obligatorio en todas las lecturas. Prevención de N+1 con `.Include()` o proyecciones `.Select()`.
- **Finanzas:** Todo importe monetario (precios, costos, totales, arqueos) se almacena y procesa con tipo exacto `decimal` (`DECIMAL(18,2)`), jamás `float` o `double`.

---

## 4. Frontend y Sistema de Diseño (React + Vite + Tailwind CSS)
- **Identidad High-Craft:** Diseño arquitectónico, sobrio y de alto contraste (Carbon Slate en Dark Mode, Alabaster en Light Mode).
- **Iconografía:** Exclusivamente **Phosphor Icons** (`@phosphor-icons/react`). Prohibido instalar Heroicons, FontAwesome u otras librerías.
- **Micro-interacciones (`motion/react`):** Transiciones reactivas, táctiles (`active:scale-[0.98]`) y ágiles con curvas `spring` amortiguadas. Sin bloqueos en `AnimatePresence`.
- **Tipografía y Legibilidad:** `font-mono tabular-nums` para tickets, dinero, códigos EAN-13 y cantidades de inventario.
