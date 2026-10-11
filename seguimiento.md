Actúa como un Tech Lead y Senior Backend Engineer experto en .NET 8, PostgreSQL y Arquitectura de Software Cloud-Native. 

Estamos construyendo el backend de un sistema ERP/POS para el negocio de indumentaria "Dastik" y "Hidden Sneakers". 

**Contexto Actual de Carpetas y Avance:**
- La raíz del proyecto está en: `C:\Users\tomas\OneDrive\Escritorio\PROGRAMACION\Laburo\Dastik`
- El scaffolding base **ya fue realizado** (Paso 1 completado). Ya existen la solución `DastikERP.sln`, los proyectos `Dastik.Api` (webapi) y `Dastik.Tests` (xunit), las referencias entre ellos y el repositorio Git inicializado.
- En la raíz del backend existe un archivo `.env` con las credenciales de Tiendanube.
- A la misma altura del código, existe una carpeta de directrices maestras en la ruta: `C:\Users\tomas\OneDrive\Escritorio\PROGRAMACION\Laburo\Dastik\skill`.
- Las skills están divididas en tres subcarpetas: `general`, `front` y `back`.

**Reglas Arquitectónicas Inquebrantables:**
1. **USO OBLIGATORIO DE SKILLS (Ruta Absoluta):** Debes leer, tener en cuenta y aplicar estrictamente las directrices (.md) ubicadas en `C:\Users\tomas\OneDrive\Escritorio\PROGRAMACION\Laburo\Dastik\skill` (revisando las subcarpetas `general` y `back` para esta etapa). Son la ley suprema de este proyecto y rigen sobre cualquier estándar genérico.
2. **Vertical Slice Architecture:** Cero arquitectura en capas tradicional. Agruparemos por caso de uso (Features/Modules) usando `MediatR`.
3. **Tipos Estrictos:** Todo cálculo monetario usa `decimal(18,2)`. No se usarán IDs auto-generados para el campo `Talle`, será de tipo `string` puro.
4. **Persistencia:** Entity Framework Core con Npgsql (PostgreSQL). Mapeo estricto con Fluent API (`IEntityTypeConfiguration`). Cero decoradores (Data Annotations) en las entidades.
5. **Seguridad:** Uso de `DotNetEnv` para leer secretos del archivo `.env`.

**Reglas de Flujo de Trabajo (Git Flow y Commits Granulares):**
Quiero que trabajemos de forma extremadamente granular. Vas a guiarme para implementar el código paso a paso usando la estrategia Git Flow (`main` -> `develop` -> `feature/x`). 
No me des todo el código de golpe. Te voy a pedir que me des las instrucciones y el código para **UN SOLO PASO** a la vez. Cuando yo te confirme que lo integré y que hice el commit, pasamos al siguiente. Usa Convención de Commits (`feat:`, `test:`, `chore:`, `fix:`).

---

### Plan de Ejecución (Fase 1 y TDD Inicial)

Vamos a ejecutar las siguientes tareas estrictamente en este orden. **El Paso 1 ya está completado. Inicia únicamente con el Paso 2 y detente a esperar mi confirmación.**

**Paso 1: Scaffolding de la Solución, Proyectos y Git (✅ COMPLETADO)**
- Solución y proyectos base ya creados y linkeados.

**Paso 2: Setup de Variables de Entorno (✅ COMPLETADO)**
- DotNetEnv configurado en Program.cs para inyectar secretos desde .env.
- Comandos para instalar `DotNetEnv` en la API.
- Código para configurar `Program.cs` de modo que cargue el `.env` existente.
- Mensaje de commit sugerido.

**Paso 3: TDD - Regla de Comisión (✅ COMPLETADO - RED)**
- Rama `feature/tdd-comisiones` activa.
- Suite de pruebas xUnit + FluentAssertions escrita en `ComisionesTests.cs` (5 casos de negocio).
- Fase RED verificada y commiteada con `test: agregar prueba fallida para calculo de comisiones en sabados (RED)`.

**Paso 4: TDD - Regla de Comisión (✅ COMPLETADO - GREEN)**
- Lógica de dominio implementada en `CalculadoraComisiones.cs` con tipos estrictos (`decimal(18,2)`).
- 5/5 pruebas unitarias pasando en verde (Green).
- Rama `feature/tdd-comisiones` integrada en `develop`.

**Paso 5: Entidades de Dominio (✅ COMPLETADO)**
- Entidades POCOs puras creadas en `Domain/Entities`: `UnidadNegocio`, `Marca`, `Categoria`, `Proveedor`, `Producto`, `Variante`.
- Cero Data Annotations, `decimal` para dinero, `string` para `Talle`, y propiedades de navegación bidireccionales.
- Rama `feature/domain-entities` integrada en `develop`.

**Paso 6: EF Core y Fluent API (✅ COMPLETADO)**
- Paquetes `Npgsql.EntityFrameworkCore.PostgreSQL` y `Microsoft.EntityFrameworkCore.Design` (8.0.11) instalados.
- `AppDbContext` configurado con registro dinámico de mapeos (`ApplyConfigurationsFromAssembly`).
- Mapeos Fluent API implementados para todas las entidades en `Infrastructure/Persistence/Configurations/`.
- Tipos de datos monetarios mapeados estrictamente a `decimal(18,2)`.
- Migración inicial `InitialCatalog` generada exitosamente.
- Rama `feature/efcore-setup` integrada a `develop`.

---

### Plan de Ejecución (Fase 2: Inventario y EAN-13)

**Paso 1: Setup CQRS y Validaciones (✅ COMPLETADO)**
- `MediatR` y `FluentValidation.DependencyInjectionExtensions` instalados.
- Registrados en `Program.cs` escaneando el assembly actual.
- Rama `feature/mediatr-setup` integrada a `develop`.

**Paso 2: TDD - Generador EAN-13 (✅ COMPLETADO - RED)**
- Rama `feature/ean13-generator` activa.
- Pruebas escritas en `GeneradorEan13Tests.cs` (longitud 13, caracteres numéricos y algoritmo módulo 10).
- Fase RED verificada (4 pruebas fallando sobre el stub `GeneradorEan13.cs`).
- Commit: `test: agregar pruebas unitarias para generacion y validacion de EAN-13 (RED)`.

**Paso 3: TDD - Generador EAN-13 (✅ COMPLETADO - GREEN)**
- Servicio `GeneradorEan13` implementado con prefijo in-store (`20...`) y algoritmo GS1 Módulo 10.
- 10/10 pruebas unitarias superadas en verde.
- Rama `feature/ean13-generator` integrada a `develop`.

**Paso 4: Vertical Slice - Crear Producto (✅ COMPLETADO)**
- Vertical Slice implementado en `Features/Inventario/CrearProducto/`: `CrearProductoCommand`, `CrearProductoCommandValidator`, `CrearProductoCommandHandler`.
- Inyección de `GeneradorEan13` para generación automática de códigos de barra faltantes.
- Rama `feature/slice-crear-producto` integrada a `develop`.

**Paso 5: Endpoint Crear Producto (✅ COMPLETADO)**
- Endpoint Minimal API expuesto en `POST /api/productos` vía `CrearProductoEndpoint.cs`.
- Validación preventiva con FluentValidation (retorno RFC 7807 `ValidationProblem`) y dispatch desacoplado con `ISender`.
- Rama `feature/endpoint-crear-producto` integrada a `develop`.

---

### Plan de Ejecución (Fase 3: Motor Financiero y Punto de Venta)

**Paso 1: Entidades de Dominio de Caja (✅ COMPLETADO)**
- Enums de dominio creados en `Domain/Entities`: `EstadoTurno`, `EstadoOrden`, `MetodoPago`.
- Entidades POCOs puras creadas en `Domain/Entities`: `Turno`, `Orden`, `DetalleOrden`, `Pago`.
- Cero Data Annotations, montos estrictos con `decimal` y propiedades de navegación relacionales.
- Rama `feature/domain-caja` integrada a `develop`.

**Paso 2: EF Core y Fluent API para Caja (✅ COMPLETADO)**
- Registro de `DbSet` correspondientes en `AppDbContext`.
- Configuraciones Fluent API con `IEntityTypeConfiguration<T>` en `Infrastructure/Persistence/Configurations/` forzando tipos monetarios a `decimal(18,2)` y relaciones referenciales.
- Generación de migración `AddCajaYOrdenes` y esquema listo para PostgreSQL.
- Rama `feature/efcore-caja` integrada a `develop`.

**Paso 3 y 4: Inyección de Dependencias para Comisiones (✅ COMPLETADO)**
- Lógica de dominio y suite de pruebas unitarias xUnit confirmadas desde Fase 1.
- Extracción de contrato `ICalculadoraComisiones` en `Domain/Services/`.
- `CalculadoraComisiones` implementa `ICalculadoraComisiones`.
- Registro de dependencia desacoplada en `Program.cs` (`AddTransient<ICalculadoraComisiones, CalculadoraComisiones>()`).
- Rama `refactor/comisiones-di` integrada a `develop`.

**Paso 6: Vertical Slice - Abrir Turno (✅ COMPLETADO)**
- Implementación de Vertical Slice en `Features/Caja/AbrirTurno/`: `AbrirTurnoCommand`, `AbrirTurnoCommandValidator`, `AbrirTurnoCommandHandler`.
- Regla de negocio: Validación de turno único abierto por empleado mediante `AnyAsync`.
- Persistencia de entidad `Turno` en PostgreSQL con `FechaApertura` UTC y estado `Abierto`.
- Adopción de Result Pattern (`Result<AbrirTurnoResult>`).
- Rama `feature/slice-abrir-turno` integrada a `develop`.

**Paso 7: Vertical Slice - Cobrar Orden (✅ COMPLETADO)**
- Implementación de Vertical Slice en `Features/Caja/CobrarOrden/`: `CobrarOrdenCommand`, `CobrarOrdenCommandValidator`, `CobrarOrdenCommandHandler` y `CobrarOrdenEndpoint`.
- Regla de validación preventiva: Suma de métodos de pago igual al total de subtotales de los ítems.
- Transacción ACID atómica con `BeginTransactionAsync`, `CommitAsync`, `RollbackAsync` en EF Core.
- Descuento de stock en `Variantes`, persistencia de orden/detalles/pagos, y cálculo de comisiones inyectado.
- Adopción de Result Pattern (`Result<CobrarOrdenResult>`) sin excepciones para control de flujo lógico.
- Rama `feature/slice-cobrar-orden` integrada a `develop`.

**Paso 8: Vertical Slice - Cerrar Turno / Arqueo de Caja (✅ COMPLETADO)**
- Implementación de Vertical Slice en `Features/Caja/CerrarTurno/`: `CerrarTurnoCommand`, `CerrarTurnoCommandValidator`, `CerrarTurnoCommandHandler`.
- Regla de negocio: Validación de turno existente y en estado `Abierto`.
- Cálculo de arqueo: Total en efectivo acumulado (`SaldoInicial` + pagos en efectivo de órdenes pagadas), balance esperado y cálculo de diferencia (faltante o sobrante).
- Cierre formal del turno con `FechaCierre` UTC, `SaldoFinal`, y estado `Cerrado`.
- Adopción de Result Pattern (`Result<CerrarTurnoResult>`).
- Rama `feature/slice-cerrar-turno` integrada a `develop`.






