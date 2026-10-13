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

**Paso 9: Endpoints Minimal API para Caja Completa (✅ COMPLETADO)**

- Implementación de `CajaEndpoints.cs` agrupado bajo `/api/caja` con `MapGroup`.
- Mapeo de `POST /api/caja/turnos/abrir` (`AbrirTurnoCommand`).
- Mapeo de `POST /api/caja/ordenes/cobrar` (`CobrarOrdenCommand`).
- Mapeo de `POST /api/caja/turnos/cerrar` (`CerrarTurnoCommand`).
- Despacho desacoplado con `ISender` de MediatR y validación preventiva RFC 7807 (`ValidationProblem`).
- Cobertura integral de pruebas unitarias con SQLite en memoria (31/31 tests pasando en verde):
  - `GeneradorEan13Tests`: 7 tests de algoritmo EAN-13 y validación de dígitos.
  - `CalculadoraComisionesTests`: 3 tests de comisiones por canal y vendedor.
  - `CrearProductoHandlerTests`: 3 tests de persistencia, generación in-store de EAN-13 y preservación de códigos de fábrica.
  - `CommandValidatorsTests`: 10 tests validando reglas de FluentValidation para Fase 2 y Fase 3.
  - `CajaHandlersTests`: 8 tests cubriendo apertura única de turno, cobro atómico ACID con descuento de stock y arqueo de caja con faltante/sobrante.
- Rama `feature/endpoints-caja` integrada a `develop`.

---

### Plan de Ejecución (Fase 4: Autenticación, Roles y Modo Sandbox)

**Paso 1: Entidades de Seguridad y Configuración JWT (✅ COMPLETADO)**

- Rama `feature/auth-sandbox` creada desde `develop`.
- Instalación de `Microsoft.AspNetCore.Authentication.JwtBearer` (8.0.11).
- Entidades de Dominio creadas en `Domain/Entities/`:
  - `RolUsuario`: Enum (`Admin`, `Empleado`).
  - `Usuario`: `Id`, `Nombre`, `Email`, `PasswordHash`, `Rol`, `Activo`, `FechaCreacion`.
- Configuración Fluent API en `UsuarioConfiguration.cs` y registro `DbSet<Usuario> Usuarios` en `AppDbContext.cs`.
- Servicio `JwtProvider` (`IJwtProvider`) implementado con `JsonWebTokenHandler` de .NET 8:
  - Generación de token JWT firmado con HMAC-SHA256 (`SymmetricSecurityKey`).
  - Claims incluidos: `sub` (Id), `NameIdentifier`, `Name`, `email`, `role` (`RolUsuario`), y claim multi-tenant `IsSandboxMode` ("true"/"false").
- Configuración de Autenticación y Autorización en `Program.cs` (`AddAuthentication`, `AddJwtBearer`, `AddAuthorization`, middleware `UseAuthentication`/`UseAuthorization`).
- Soporte para Bearer Token en Swagger/OpenAPI.
- Protección de endpoints de caja: `CajaEndpoints.cs` asegurado con `.RequireAuthorization()`.
- Variables de entorno en `Back/.env` y plantilla creada en `Back/.env.example`.
- Suite de pruebas unitarias ampliada: 34 tests en verde (3 nuevos tests en `JwtProviderTests.cs` validando generación, claims de rol y sandbox, y fallo por firma inválida).

**Paso 1.1: Refactor de Reglas de Seguridad (✅ COMPLETADO)**

- Regla A (Jerarquía de Roles): Política de autorización `OperadorCaja` configurada en `Program.cs` (`policy.RequireRole("Admin", "Empleado")`) y aplicada a los endpoints de caja (`CajaEndpoints.cs`), garantizando que el Dueño/Admin pueda operar la caja heredando permisos.
- Regla B (Reseteo Obligatorio): Propiedad `DebeCambiarPassword` (bool, default `true`) agregada a `Usuario` y mapeada en `UsuarioConfiguration.cs`.
- Claim `DebeCambiarPassword` incorporado en el payload del JWT mediante `JwtProvider`.
- Pruebas unitarias actualizadas y 34/34 tests superados al 100%.

**Paso 2: Migración, Seeder inicial y Endpoint de Login (✅ COMPLETADO)**

- Migración EF Core: `20261011152403_AddUsuarios.cs` generada con tabla `Usuarios`, índice único en `Email`, y tipos estrictos.
- Hashing de contraseñas: Servicio `IPasswordHasher` / `PasswordHasher` con BCrypt (`BCrypt.Net-Next`).
- Data Seeder: `DataSeeder.cs` sembrando automáticamente `admin@dastik.com` (`Rol.Admin`, contraseña default `Dastik2026!`, `DebeCambiarPassword = true`) al inicializar la app.
- Vertical Slice Login: Implementado en `Features/Auth/Login/`: `LoginCommand`, `LoginCommandValidator`, `LoginCommandHandler` con Result Pattern y mitigación de enumeración de usuarios.
- Minimal API: `AuthEndpoints.cs` mapeando `POST /api/auth/login` con acceso anónimo (`AllowAnonymous`).
- Suite de pruebas unitarias ampliada: 43 tests en verde (5 nuevos tests en `LoginCommandHandlerTests` y 4 nuevos tests en `CommandValidatorsTests`).

**Paso 3: Vertical Slice - Cambio de Contraseña (✅ COMPLETADO)**

- Rama `feature/auth-cambiar-password` creada desde `develop`.
- Implementación de Vertical Slice en `Features/Auth/CambiarPassword/`:
  - `CambiarPasswordRequest` (payload del cliente seguro sin ID) y `CambiarPasswordCommand` (enrutado con ID autenticado del token).
  - `CambiarPasswordCommandValidator` validando mínimo 8 caracteres, al menos una mayúscula, al menos un número y regla de disimilitud con la clave anterior.
  - `CambiarPasswordCommandHandler` verificando contraseña actual, generando nuevo hash con BCrypt y seteando críticamente `DebeCambiarPassword = false`.
- Endpoint protegido en `AuthEndpoints.cs`: `POST /api/auth/cambiar-password` con `.RequireAuthorization()`.
- Suite de pruebas unitarias ampliada: 53 tests en verde (3 nuevos tests en `CambiarPasswordCommandHandlerTests` y 7 nuevos tests en `CommandValidatorsTests`).
- Rama `feature/auth-cambiar-password` integrada a `develop`.

**Paso 4: Infraestructura Multi-Tenant para Sandbox (✅ COMPLETADO)**

- Rama `feature/sandbox-tenant` creada desde `develop`.
- Abstracción de Tenancy: `ITenantService` en `Domain/Services/` e implementación `TenantService` en `Infrastructure/Tenancy/`.
- Detección reactiva del claim `IsSandboxMode` a través de `IHttpContextAccessor`.
- Registro dinámico en `Program.cs`: `AddDbContext<AppDbContext>` resuelve dinámicamente la conexión por request (`SandboxConnection` vs `DefaultConnection`).
- Cadenas configuradas en `appsettings.json`, `Back/.env.example` y `Back/.env`.
- Suite de pruebas unitarias ampliada: 56 tests en verde (3 nuevos tests en `TenantServiceTests.cs`).
- Rama `feature/sandbox-tenant` integrada exitosamente a `develop`.

**Paso 5: Seeder del Modo Sandbox (✅ COMPLETADO)**

- Rama `feature/sandbox-seeder` creada desde `develop`.
- Implementación de `SandboxDataSeeder.cs` en `Infrastructure/Persistence/`:
  - Guardia estricta de seguridad: Valida `EsBaseDeDatosSandbox` inspeccionando la cadena de conexión para impedir categóricamente la inyección de datos ficticios en la base de datos de producción (`dastik_erp`).
  - Sembrado de entidades padre requeridas si no existen (`UnidadNegocio`, `Marca`, `Categoria`, `Proveedor`).
  - Sembrado de 2 productos de la unidad "Dastik" ("Remera Oversize Básica" y "Pantalón Cargo") con variantes XS a XL, códigos EAN-13 válidos y stock físico simulado.
  - Sembrado de 2 productos de la unidad "Hidden Sneakers" ("Nike Dunk Low Panda" y "Adidas Yeezy Slide") con variantes de calzado US 8 a US 11, códigos EAN-13 y stock físico simulado.
  - Sembrado de usuario de prueba para cajeros (`cajero.sandbox@dastik.com` / `Dastik2026!`, `DebeCambiarPassword = false`) para entrenamiento inmediato.
- Registro en `Program.cs`: Ejecución protegida en entorno de desarrollo (`app.Environment.IsDevelopment()`).
- Suite de pruebas unitarias ampliada: 59 tests en verde (3 nuevos tests en `SandboxDataSeederTests.cs` cubriendo creación de catálogo simulado, guardia de seguridad contra producción y prevención de duplicados).
- Rama `feature/sandbox-seeder` integrada exitosamente a `develop`.

---

### Plan de Ejecución (Fase 5: Integración Omnicanal con Tiendanube y Outbox Pattern - ✅ COMPLETADA)

**Paso 1: Entidad de Persistencia Outbox (✅ COMPLETADO)**

- Rama `feature/outbox-pattern` creada desde `develop`.
- Entidad POCO creada en `Domain/Entities/OutboxMessage.cs`: `Id` (Guid), `TipoEvento` (string), `ContenidoJson` (string), `FechaOcurrenciaUtc` (DateTime), `FechaProcesadoUtc` (DateTime?), `Error` (string?), `Intentos` (int, default 0).
- Configuración Fluent API en `Infrastructure/Persistence/Configurations/OutboxMessageConfiguration.cs`:
  - `ToTable("OutboxMessages")`, tipos estrictos (`text` para el payload JSON, `maxLength(200)` para TipoEvento, `maxLength(2000)` para Error).
  - Índice optimizado sobre `FechaProcesadoUtc` para consultas de alta velocidad del worker de procesamiento.
- `DbSet<OutboxMessage> OutboxMessages` registrado en `AppDbContext.cs`.
- Migración EF Core generada: `20261011161004_AddOutboxMessages.cs` con snapshot actualizado.
- Suite de pruebas unitarias ampliada: 61 tests en verde (2 nuevos tests en `OutboxMessagePersistenceTests.cs` validando persistencia con defaults y filtrado indexado de pendientes).

**Paso 2: Integración del Outbox en CobrarOrdenCommandHandler (✅ COMPLETADO)**

- Lógica de intercepción de omnicanalidad agregada en `CobrarOrdenCommandHandler.cs`:
  - Eager loading de `Producto` y `UnidadNegocio` en la consulta de variantes vendidas.
  - Creación condicional de `OutboxMessage` si el producto pertenece a "Hidden Sneakers" (`UnidadNegocio.HiddenSneakers` o `TieneTiendaNube == true`).
  - Evento `StockReducidoEnPOS` con payload serializado `{ VarianteId, CantidadDescontada }`.
  - Persistencia dentro de la misma transacción ACID atómica de EF Core (`BeginTransactionAsync` / `SaveChangesAsync` / `CommitAsync`), garantizando latencia cero en mostrador (<10ms).
- Constantes de dominio `UnidadNegocio.Dastik` y `UnidadNegocio.HiddenSneakers` añadidas a `UnidadNegocio.cs`.
- Suite de pruebas unitarias ampliada: 63 tests en verde (2 nuevos tests en `CajaHandlersTests.cs` verificando generación de OutboxMessage para ventas de Hidden Sneakers y cero registros para ventas de Dastik).

**Paso 3: Background Worker para Procesar Outbox Messages (✅ COMPLETADO)**

- Implementación de `OutboxMessageProcessor` en `Infrastructure/BackgroundServices/`:
  - Servicio alojado que hereda de `BackgroundService` en .NET 8.
  - Creación periódica de `IServiceScope` para resolver `AppDbContext` de manera segura (desacoplado del ciclo de vida Singleton).
  - Consulta y despacho en lotes (`Take(20)`) de mensajes donde `FechaProcesadoUtc == null` ordenados por `FechaOcurrenciaUtc`.
  - Deserialización segura del payload JSON y simulación de sincronización con Tiendanube vía `ILogger.LogInformation`.
  - Actualización atómica de `FechaProcesadoUtc = DateTime.UtcNow`.
  - Manejo resiliente de excepciones: Incremento de `Intentos` y captura de `Error` individualmente por mensaje sin interrumpir el ciclo del worker.
- Registro en `Program.cs`: `builder.Services.AddHostedService<OutboxMessageProcessor>();`.
- Suite de pruebas unitarias ampliada: 66 tests en verde (3 nuevos tests en `OutboxMessageProcessorTests.cs` evaluando procesamiento exitoso, captura de errores de formato y ejecución con bandeja vacía).
- Rama `feature/outbox-pattern` integrada exitosamente a `develop`.

---

### Plan de Ejecución (Frontend: PWA POS React + Vite)

**Paso 1: Scaffolding y Arquitectura Base PWA (✅ COMPLETADO)**

- Rama `feature/frontend-scaffolding` creada desde `develop`.
- Scaffolding de aplicación React + Vite + TypeScript en `Front/`.
- Instalación de dependencias de producción: `axios`, `@tanstack/react-query`, `zustand`, `react-router-dom`, `@phosphor-icons/react`.
- Configuración de Tailwind CSS v4 con `@tailwindcss/vite` y directivas en `src/index.css`.
- Directrices de diseño Avant-Garde / High-End Streetwear (`Design_Base.md`):
  - 100% Flat Design, sin sombras difuminadas, bordes rectos (`rounded-none`).
  - Tipografías Google Fonts: `Syne` (Headings) y `Space Grotesk` (Data / UI).
  - Iconos finos con `Phosphor Icons` (`weight="light"`).
- Screaming Architecture estructurada en `src/features/` (`auth`, `pos`, `caja`, `inventario`).
- Interceptor de Axios (`src/lib/axios/apiClient.ts`):
  - Inyección de cabecera `Authorization: Bearer <token>`.
  - Inyección de cabecera `X-Sandbox-Mode` para multi-tenant dinámico.
  - Captura y manejo global de 401 Unauthorized con logout y redirección.
- Stores globales en Zustand: `useAuthStore.ts` (con persistencia y flag `debeCambiarPassword`) y `useTenantStore.ts` (toggle reactivo de Sandbox).
- Build verificado: `tsc -b && vite build` completado exitosamente en 902ms.
- Rama `feature/frontend-scaffolding` integrada exitosamente a `develop`.

**Paso 2: Pantalla de Login y Flujo de Reseteo Obligatorio (UI/UX) (✅ COMPLETADO)**

- Rama `feature/frontend-login` creada y desarrollada.
- Estilo estricto _Avant-Garde / High-End Streetwear_ (`Design_Base.md`):
  - 100% Flat Design, bordes 1px (`#333333`), fondos oscuros `#000000`/`#090909`/`#111111`, cero sombras difuminadas.
  - Tipografías Google Fonts `Syne` (Headings) y `Space Grotesk` (Data/UI).
  - Iconografía `@phosphor-icons/react` (`weight="light"`).
- Componentes implementados en `src/features/auth/components/`:
  - `LoginForm.tsx`: Manejo de credenciales, feedback de errores dismissible con botón `X`, selector de modo Sandbox reactivo.
  - `CambiarPasswordModal.tsx`: Modal bloqueante para primer inicio (`debeCambiarPassword === true`), validación en tiempo real de reglas de complejidad (8 chars, mayúscula, número, match) y botón de salida/cancelar con `logout()`.
- Componente `Input.tsx`: Soporte nativo de alternancia de contraseña (ojito con `Eye` y `EyeSlash`).
- Página `LoginPage.tsx` y terminal autenticada `DashboardPos.tsx`.
- Enrutamiento con `react-router-dom` y guarda `RutaProtegida` en `App.tsx`.
- Soporte dual para base de datos local (SQLite para desarrollo ágil / PostgreSQL para producción) en backend `Dastik.Api`.
- Rama `feature/frontend-login` integrada exitosamente a `develop`.

---

### Fase 1 Frontend - Próximos Pasos

**Paso 3: Dashboard POS - Terminal de Ventas y Grilla de Productos (UI/UX) (Completado)**

- Rama `feature/frontend-pos-dashboard` integrada exitosamente a `develop`.
- Header Arquitectónico POS (`PosHeader.tsx`):
  - Estado de turno de caja (Abierto/Cerrado con badge reactivo y número de turno).
  - Selector dinámico de Tenant (`PRODUCCIÓN` vs `SANDBOX`).
  - Perfil del operador logueado y botón de cierre de sesión.
- Lector de Código de Barras y Búsqueda (`PosBarcodeScanner.tsx`):
  - Input con auto-focus continuo permanente para pistola láser EAN-13 con re-enfoque inteligente ante clics externos.
  - Detección inmediata de prendas y feedback visual con vibración sutil (`shake`) en caso de código inválido o sin stock.
- Grilla de Catálogo Retail (`CatalogoGrid.tsx` y `ProductCard.tsx`):
  - Conexión con TanStack Query (`useQuery`) consumiendo `inventarioApi.obtenerProductos` (`GET /api/productos`).
  - Cards planas 1px de alto impacto visual con diseño Avant-Garde (`Design_Base.md`).
  - Selector interactivo de variantes (Talles `XS-XL` / `US 8-11` y Colores) con badge de stock físico en vivo y tachado de agotados.
  - Formato monetario estricto `$ XX.XXX,00`.
- Carrito de Cobro POS en split-screen 70/30 (`useCartStore.ts` con Zustand):
  - Ticket en vivo con agregado atómico, incremento/decremento de unidades limitado por stock físico y cálculo de totales.

**Paso 4: Flujo de Caja y Modal de Cobro (Completado)**

- Rama `feature/frontend-caja-cobro` integrada exitosamente a `develop`.
- Conexión Backend & Endpoints:
  - `GET /api/caja/turno-activo`: consulta reactiva de turno abierto del operador.
  - `POST /api/caja/abrir-turno`: apertura de turno con asignación de saldo inicial en caja física.
  - `POST /api/caja/cobrar`: liquidación de órdenes con desglose de ítems, métodos de pago y descuento atómico de stock.
- Modal de Apertura de Turno (`ModalAbrirTurno.tsx`):
  - Modal bloqueante flat que intercepta el POS si la terminal no tiene turno abierto.
  - Solicitud de Fondo de Caja Inicial en ARS con accesos rápidos ($0, $10.000, $20.000, $50.000) y confirmación reactiva.
- Modal de Cobro en Mostrador (`ModalPago.tsx`):
  - Disparado desde el botón "COBRAR ORDEN" del ticket.
  - Display gigante del total a liquidar.
  - Selector de método de pago (Efectivo y Tarjeta).
  - Cálculo instantáneo de vuelto en vivo para pagos en efectivo con accesos rápidos para billetes.
  - Validación de dinero insuficiente.
  - Venta atómica con reseteo de ticket en Zustand e invalidación de caché en catálogo.

**Paso 5: Arqueo y Cierre de Turno (Completado)**

- Rama `feature/frontend-cierre-caja` integrada exitosamente a `develop`.
- Endpoint de Resumen en Vivo (`GET /api/caja/turnos/{turnoId}/resumen`):
  - Cálculo instantáneo de ventas discriminadas por método de pago (Efectivo, Tarjeta, Transferencia) y efectivo esperado en caja física (`SaldoInicial + TotalVentasEfectivo`).
- Endpoint de Cierre de Turno (`POST /api/caja/turnos/cerrar` y alias `/api/caja/cerrar-turno`):
  - Cierre formal del turno con asentamiento de `SaldoFinal` y registro de `Diferencia` de balance.
- Modal de Cierre y Arqueo de Caja (`ModalCerrarTurno.tsx`):
  - Métricas en vivo del turno con diseño Avant-Garde flat 1px.
  - Input numérico de "Efectivo Real Contado en Caja Física" con botón de asistencia rápida "Copiar Esperado".
  - Indicador dinámico en tiempo real del estado de arqueo:
    - `CUADRE PERFECTO` ($0,00 - esmeralda)
    - `SOBRANTE EN CAJA` (+ $XX - verde)
    - `FALTANTE EN CAJA` (- $XX - rojo)
  - Al confirmar con éxito, visualiza el comprobante de arqueo y ejecuta `logout()` automático para proteger la terminal y devolverla a la pantalla de login.
- Botón de Cierre de Turno en Header (`PosHeader.tsx`):
  - Acceso directo visible únicamente cuando existe un turno activo.

> **ESTADO DE FASE 1 FRONTEND (POS TERMINAL MVP): 100% COMPLETADA**  
> El ciclo de mostrador opera de punta a punta: Login -> Apertura de Caja -> Escaneo/Catálogo -> Venta Atómica con Vuelto -> Arqueo y Cierre -> Logout.

---

### Fase 6: Integración Real con Tiendanube (Backend) - COMPLETADA

**Objetivo:** Conectar el `OutboxMessageProcessor` en segundo plano con la API REST real de Tiendanube v1 para sincronización de stock y órdenes, empleando arquitectura resiliente en .NET 8 con TDD estricto.

**Paso 1: Cliente HTTP Resiliente para Tiendanube (`ITiendanubeApiClient`) (Completado)**

- Rama `feature/backend-tiendanube-client` desde `develop`.
- Contrato de dominio e integración: `ITiendanubeApiClient` con DTOs de respuesta y modelo `Result<T>`.
- Cliente HTTP tipado: `TiendanubeApiClient` consumiendo endpoint PUT `{storeId}/products/{productId}/variants/{variantId}` con header `Authentication: bearer {token}`.
- Guardia de seguridad Sandbox/Mock: protege los inventarios de producción verificando tiendas de prueba/mock para evitar cualquier invocación externa durante tests o desarrollo local.
- Resiliencia estándar con **Polly** (`Microsoft.Extensions.Http.Resilience`): configuración de `AddStandardResilienceHandler()` sobre `AddHttpClient<ITiendanubeApiClient, TiendanubeApiClient>()` con User-Agent personalizado.
- `OutboxMessageProcessor`:
  - Deserialización de eventos de decremento de stock en el POS (`StockReducidoEnPOS`).
  - Navegación y verificación de la `UnidadNegocio` (`TieneTiendaNube == true`).
  - Resolución dinámica de credenciales por tenant/unidad (`TiendanubeStoreId`, `TiendanubeAccessToken`).
  - Manejo de fallos con incremento de `Intentos`, registro de error y persistencia en base de datos para reintento automático.
  - Omitido seguro para unidades sin tienda en la nube (marcado automático como procesado).
- **Tenant Guard & Aislamiento Multi-Tienda (Regla de Negocio Crítica):**
  - **Dastik:** Unidad con ecommerce activo en Tiendanube (`TieneTiendaNube == true`, store ID y token). Al registrarse una venta en POS, se emite el evento en Outbox (`StockReducidoEnPOS`) y el procesador ejecuta la actualización HTTP real contra la nube.
  - **Hidden Sneakers:** Unidad que opera de manera exclusivamente física en el local (`TieneTiendaNube == false`). Al registrarse una venta en POS, descuenta stock físico local atómicamente en PostgreSQL/SQLite, pero el Tenant Guard suprime la emisión de mensajes de Outbox para Tiendanube.
  - **Defensa en Profundidad en OutboxProcessor:** Si por cualquier eventualidad un mensaje llegara para una variante física, `OutboxMessageProcessor` verifica `TieneTiendaNube`, omite la llamada externa, registra un log informativo y marca el mensaje como procesado.
- **Cobertura TDD Estricta (73 pruebas superadas, 0 fallos):**
  - Pruebas unitarias de `TiendanubeApiClientTests` (código 200 con headers correctos, 404 manejado como Failure, modo mock seguro).
  - Pruebas de integración de `OutboxMessageProcessorTests` (flujo exitoso para Dastik con Tiendanube, reintentos/errores ante fallo de API externa, bypass para Hidden Sneakers físico).
  - Pruebas de cobranza con Tenant Guard en `CajaHandlersTests` (`CobrarOrden_CuandoArticuloEsDeDastikConTiendanube_DeberiaGenerarOutboxMessage`, `CobrarOrden_CuandoArticuloEsDeHiddenSneakersFisico_NoDebeGenerarOutboxMessage`, `CobrarOrden_VentaMixtaDastikYHiddenSneakers_DebeGenerarOutboxSoloParaArticuloDeDastik`).

---

### Fase 2: Panel de Administración Back-Office (Frontend) - EN CURSO

**Paso 1: Layout de Admin y Tabla de Inventario (Completado)**

- Rama `feature/frontend-admin-layout` creada desde `develop`.
- **`AdminLayout.tsx`:**
  - Sidebar fija izquierda (`w-64`, border-r `#333333`, fondos `#090909`).
  - Branding Avant-Garde Dastik // Admin.
  - Acceso directo al "Terminal POS" (`/` o `/pos`).
  - Navegación react-router-dom activa: "Inventario" (`/admin/inventario`), "Arqueos", "Métricas".
  - Controles de operador, estado de base (Sandbox vs Prod) y logout.
- **`InventarioPage.tsx`:**
  - Data Grid flat Avant-Garde consumiendo `inventarioApi.obtenerProductos()` con TanStack Query.
  - Columnas: Marca (con badge de unidad), Producto (nombre, descripción, categoría), Precio (formato ARS), Variantes (conteo y badges de talles/stock individual), Stock Total (con estados de stock bajo/agotado).
  - Tarjetas de resumen métrico: Productos Registrados, SKUs Totales, Stock Físico Global.
  - Buscador reactivo por texto y filtros por Unidad de Negocio (Todas, Dastik, Hidden Sneakers).
  - Botón principal de acción superior: `NUEVO PRODUCTO`.
- **Rutas configuradas en `App.tsx`:**
  - `/admin` redirige a `/admin/inventario`.
  - Rutas anidadas protegidas para el Back-Office.
  - Acceso directo bidireccional desde `PosHeader.tsx` ("ADMIN").

**Paso 2: Modal de Alta de Nuevo Producto y Variantes (CRUD) (Completado)**

- Rama `feature/frontend-admin-crud-producto` creada desde `develop`.
- **`inventarioApi.ts`:**
  - Interfaces tipadas: `CrearVarianteItemRequest`, `CrearProductoRequest`, `CrearProductoResponse`.
  - Método `crearProducto(data)` consumiendo `POST /api/inventario` (con alias activo en backend `/api/productos`).
- **`ModalCrearProducto.tsx`:**
  - Modal amplio con scroll interno estilizado en estética Avant-Garde Dark brutalista (`#090909`, bordes `#333333`, fondos `#111111`).
  - **Selector de Unidad de Negocio:** Selector interactivo multi-tenant Dastik (Tiendanube + POS) vs Hidden Sneakers (Físico Exclusivo) con asignación automática de proveedor y marca sugerida.
  - **Formulario Base:** Nombre, Marca (Dastik, Nike, Adidas), Categoría (Indumentaria, Calzado), Proveedor, Descripción y URL de imagen opcional.
  - **Estructura Financiera:** Precio de costo, precio de venta, cálculo reactivo en tiempo real de porcentaje de margen y markup multiplicador, y botones de markup rápido (+50%, +60%, +100%).
  - **Constructor Dinámico de Variantes ($N$ variantes):**
    - Mini-formulario para agregar variantes temporales: Talle, Color, Stock físico y Código de barras.
    - Presets rápidos de talles por categoría (XS - XXL para Indumentaria / US 8 - US 11 para Calzado).
    - Algoritmo de autogeneración GS1 EAN-13 estándar (Módulo 10 con prefijo `20` de retail) en TypeScript si el usuario deja el campo vacío o hace clic en el botón de autogenerar.
    - Tabla interactiva de variantes agregadas con visualización de talles, colores, stock total acumulado y botón de eliminación por fila.
- **Integración con `InventarioPage.tsx`:**
  - Conectado directamente al botón superior "NUEVO PRODUCTO".
  - Invalida las queries de TanStack Query (`productos-inventario` y `productos`) al guardar para refrescar automáticamente la tabla sin recargar la página.

**Paso 3: Botón de Sincronización de Catálogo en el Frontend (Completado)**

- Rama `feature/frontend-admin-sincronizar-tiendanube` creada desde `develop`.
- **`inventarioApi.ts`:**
  - Definición de interfaz `SincronizarCatalogoResponse` (`totalProductosImportados`, `totalVariantesImportadas`, `productosNuevos`, `productosActualizados`, `mensaje`).
  - Método `sincronizarTiendanube()` apuntando a `POST /api/inventario/sincronizar-tiendanube`.
- **`InventarioPage.tsx`:**
  - Botón secundario "SINCRONIZAR NUBE" ubicado al lado de "NUEVO PRODUCTO", con ícono Phosphor `CloudArrowDown` (estilo acento ámbar).
  - Manejo de estado de carga con micro-animación `animate-bounce` y desactivación de doble clic (`disabled={isSyncing}`).
  - Banner Avant-Garde dismissible de feedback con resumen detallado (`productosNuevos`, `productosActualizados` o error).
  - Invalidación automática de caché de TanStack Query (`productos-inventario` y `productos`) para actualizar la tabla en vivo.

---

### Configuración de Credenciales de Testing y Usuario Admin (`tomiDev`)

- **Usuario Administrador de Desarrollo (`tomiDev`):**
  - **Email:** `tomidev@dastik.com` (formato con `@` compatible con HTML5 e input `type="email"`, y validación `LoginCommandValidator`).
  - **Contraseña:** `Dastik2026!`
  - **Rol:** `Admin` (con acceso directo tanto al Back-Office `/admin` como al Terminal POS).
  - **DebeCambiarPassword:** `false` (no requiere reseteo forzoso de clave).
- **Sembrado Dual (Producción/Dev y Sandbox):**
  - Sincronizado en `DataSeeder.cs` y `SandboxDataSeeder.cs`.
  - Corregido el orden de ejecución en `SandboxDataSeeder.cs` para garantizar que los usuarios del sistema se siembren siempre, incluso cuando ya existían productos previamente.
  - Ambas bases SQLite locales (`dastik_dev.db` y `dastik_sandbox_dev.db`) actualizadas con el usuario `tomidev@dastik.com`.
- **Experiencia de Usuario en Frontend (`LoginPage.tsx` y `LoginForm.tsx`):**
  - Botones de autollenado de un clic para acceso inmediato en `LoginPage.tsx`:
    - Admin `tomidev@dastik.com` (`Dastik2026!`).
    - Admin Fundador `admin@dastik.com` (`Dastik2026!`).
    - Cajero `cajero.sandbox@dastik.com` (`Dastik2026!`).
  - Placeholder del formulario actualizado a `tomidev@dastik.com`.

---

### Refactor de Lenguaje de Dominio y UI del Local Físico - COMPLETADO

> **ESTADO:** Merge realizado exitosamente hacia `develop` con `--no-ff`.

**Objetivo:** Alinear pantallas de Caja (POS) y Administración con el vocabulario, dinámicas y reglas exactas del Documento de Requisitos de Negocio Original.

- **Rama:** `refactor/domain-language` (mergeada hacia `develop`).
- **1. Roles y Autenticación:**
  - Terminología genérica (Admin/Operador/Cajero) sustituida por **"Dueño"** y **"Empleado"** en toda la interfaz (`PosHeader.tsx`, `ModalAbrirTurno.tsx`, `ModalCerrarTurno.tsx`, `AdminLayout.tsx`, `LoginPage.tsx`).
  - Nomenclatura oficial de turnos: **"Turno Mañana"** (< 14:00 hs) y **"Turno Tarde"** (>= 14:00 hs), visible en badges de cabecera, apertura y arqueo.
- **2. Modal de Pago Realista (`ModalPago.tsx`):**
  - Métodos exactos de pago del local:
    - `Efectivo`: Mantiene conteo en vivo de vuelto, atajos de billetes (+1000, +2000, +5000, +10000, +20000) y botón "EXACTO".
    - `Transferencia`: Texto de ayuda con alias oficial del negocio `(Alias: el de Ale / el del Gordo)`.
    - `Débito`: Switch opcional de "Descuento por Débito" (configurable 5%, 10%, 15%) con recálculo en vivo del total y desglose de ahorro.
    - `Crédito`: Switch de recargo financiero del 25% con recálculo en vivo del total.
  - Consistencia transaccional ACID: Escalado proporcional de precios unitarios de cada ítem antes del envío a la API para satisfacer la restricción backend `sum(items) == sum(pagos)`.
  - Alerta de Comisión de Sábado: Si es sábado y el total supera los $120.000, muestra el badge destacado `🔥 VENTA CALIFICADA: 5% COMISIÓN PARA EMPLEADO` con cálculo de la comisión ganada. Incluye switch de prueba para simular sábado en cualquier momento.
- **3. Arqueo y Cierre de Turno (`ModalCerrarTurno.tsx`):**
  - Sección previa a efectivo real: **"Salidas / Gastos del Turno"** para asentar retiros de gaveta (Desayuno, Uber, Almuerzo) con monto y motivo.
  - Fórmula oficial del negocio: `Efectivo Esperado en Gaveta = (Saldo Inicial + Ventas Efectivo) - Gastos`.
  - Backend actualizado en `CerrarTurnoCommand` y `CerrarTurnoCommandHandler` deduciendo `GastosTurno` del saldo esperado.
- **4. Curvas de Talles del Local en Creación de Productos (`ModalCrearProducto.tsx`):**
  - Curvas de talles preconfiguradas:
    - _Partes de arriba (Remeras, Buzos, Camperas):_ `XS-XL` (`XS`, `S`, `M`, `L`, `XL`).
    - _Partes de abajo (Pantalones, Bermudas):_ `36-50` (`36`, `38`, `40`, `42`, `44`, `46`, `48`, `50`).
    - _Zapatillas Brasil:_ Bajos `35-39` (`35`, `36`, `37`, `38`, `39`) y Altos `39-43` (`39`, `40`, `41`, `42`, `43`).
    - _Accesorios (Gorras, Medias, Cintos):_ `TU` (Talle Único).
  - Botón de carga por lote: "+ AGREGAR CURVA COMPLETA" que genera automáticamente todas las variantes con sus respectivos códigos de barras GS1 EAN-13.

---

### Roadmap Oficial para Métricas del Back-Office (Requisitos de Negocio)

Toma de nota formal de las especificaciones de negocio para las próximas fases de reportería y métricas del panel de administración:

1. **Cálculo de Margen Neto Real:**
   - Deducir costos variables del canal online:
     - Gasto en Publicidad (Meta Ads / Google Ads asignado).
     - Comisiones y costos de plataforma de **Tiendanube** (comisión por transacción + pasarela de pago).
   - Margen Neto = `Ingresos - (Costo de Mercadería Vendida + Publicidad + Costo Tiendanube + Comisiones de Cobro)`.
2. **Alertas de Stock Crítico:**
   - Umbral mínimo fijado en **3 unidades** por variante/SKU.
   - Indicador visual inmediato en Data Grid y reporte de reposición rápida cuando `stockFisico <= 3`.
3. **Métricas de Velocidad de Venta (Sell-Through & Rotación):**
   - Días promedio de permanencia en inventario por SKU y por categoría.
   - Identificación de "Fast Movers" (alta rotación) vs "Huesos" (mercadería estancada) para planificar promociones o liquidaciones.
4. **Gestión de Cambios y Devoluciones:**
   - Módulo específico para cambios de talle/producto en mostrador físico manteniendo integridad del stock (entrada del ítem devuelto y salida del nuevo ítem con posible ajuste de saldo o nota de crédito).

---

### Fase 7: Importación de Catálogo desde Tiendanube (Backend) - COMPLETADA

**Objetivo:** Desarrollar la infraestructura de integración HTTP y orquestación de dominio para importar el catálogo de Tiendanube al inventario local con lógica de Upsert y aislamiento de Tenant bajo metodología TDD.

- **Rama:** `feature/backend-tiendanube-sync` (creada a partir de `develop`).
- **1. Ampliación de `ITiendanubeApiClient`:**
  - Definición de DTOs de dominio: `TiendanubeProductResponse`, `TiendanubeProductVariantResponse`.
  - Método `ObtenerProductosAsync(storeId, accessToken, ct)`:
    - Soporte nativo para modo Mock/Sandbox: genera catálogo representativo de indumentaria Dastik sin invocar la red.
    - Soporte para API REST real Tiendanube v1: endpoint `GET {storeId}/products?per_page=200` con header `Authentication: bearer {token}` y deserialización JSON resiliente de nombres localizados, imágenes y atributos de variantes.
- **2. Servicio de Aplicación `TiendanubeSyncService`:**
  - Implementa `ITiendanubeSyncService` y se integra con MediatR mediante `SincronizarCatalogoCommand` / `SincronizarCatalogoCommandHandler`.
  - **Regla de Negocio Crítica (Tenant Guard):** Todo producto y variante importado se asigna de manera forzosa a la Unidad de Negocio **"Dastik"** (`TieneTiendaNube == true`), garantizando que "Hidden Sneakers" conserve su aislamiento de inventario exclusivamente físico.
  - **Lógica de Upsert Atómico:**
    - Productos existentes (por `TiendanubeProductId`): actualiza nombre, descripción, precio de venta, costo, markup y actualiza/agrega variantes correspondientes (por `TiendanubeVariantId` o `CodigoBarras`).
    - Productos nuevos: crea la entidad `Producto` con sus respectivas `Variante`s, asignando categorías y marcas predeterminadas, autogenerando códigos GS1 EAN-13 si la nube no provee código de barras.
- **3. Endpoint de Sincronización Manual:**
  - `POST /api/inventario/sincronizar-tiendanube` mapeado en `CrearProductoEndpoint.cs` (con alias disponible), retornando `SincronizarCatalogoResult` con conteos detallados de productos nuevos, actualizados y variantes totales.
- **4. Cobertura TDD Estricta (82 pruebas superadas, 0 fallos):**
  - `TiendanubeApiClientTests`: respuesta 200 con headers correctos, 401/404 manejados como `Failure`, y modo mock seguro.
  - `TiendanubeSyncServiceTests`: creación de nuevos productos, actualización idempotente de productos existentes, verificación estricta de asignación a Dastik (nunca a Hidden Sneakers), y manejo de fallos de red.

---

### Configuración de Credenciales Reales de Tiendanube en Desarrollo - COMPLETADA

**Objetivo:** Permitir que la Unidad de Negocio "Dastik" utilice las credenciales reales de Tiendanube (`TIENDANUBE_STORE_ID` y `TIENDANUBE_ACCESS_TOKEN`) configuradas en `.env`, manteniendo el aislamiento multi-tenant y la resiliencia en desarrollo.

- **Rama:** `feature/backend-tiendanube-credentials` (creada a partir de `develop`).
- **1. Normalizador de Tokens (`TiendanubeTokenHelper.cs`):**
  - Soporte para enlaces de clave compartida (`https://shared.tiendanube.com/share/api-key/...`), resolviendo automáticamente el token hexadecimal subyacente.
  - Limpieza de comillas y espacios en blanco accidentales.
- **2. Seeder de Inicialización (`DataSeeder.cs`):**
  - Lee variables de entorno `TIENDANUBE_STORE_ID` y `TIENDANUBE_ACCESS_TOKEN` a través de `IConfiguration` y `Environment.GetEnvironmentVariable`.
  - Actualiza de forma idempotente la `UnidadNegocio` "Dastik" en la base SQLite de desarrollo (`dastik_dev.db`) con el Store ID real (`5686318`) y el access token limpio.
  - Mantiene a "Hidden Sneakers" con `TieneTiendaNube = false` y sin credenciales asignadas.
- **3. Resolución Dinámica en Servicios (`TiendanubeSyncService.cs` y `TiendanubeApiClient.cs`):**
  - `TiendanubeSyncService`: lee prioritariamente de `UnidadNegocio` en base de datos con fallback automático a variables de entorno antes del modo mock.
  - `TiendanubeApiClient`: normaliza automáticamente los tokens antes de inyectar el header `Authentication: bearer {token}`.
- **4. Cobertura TDD (88 pruebas superadas, 0 fallos):**
  - Pruebas unitarias de normalización con `TiendanubeTokenHelper`.
  - Pruebas de integración comprobando que `TiendanubeSyncService` lee y suministra las credenciales de la entidad `UnidadNegocio` de Dastik.

---

### Paginación en Backend y Miniaturas en Frontend - COMPLETADA

**Objetivo:** Permitir la descarga exhaustiva de catálogos grandes de Tiendanube mediante paginación acumulativa e incorporar renderizado de miniaturas visuales de productos en la tabla central de inventario.

- **Rama:** `feature/tiendanube-pagination-and-thumbnails` (creada a partir de `develop`).
- **1. Paginación en Backend (`TiendanubeApiClient.cs`):**
  - Bucle de paginación con `page = 1` y endpoint `GET {storeId}/products?per_page=200&page={page}`.
  - Acumula los resultados en una lista global hasta agotar las páginas (`Count == 0` o `Count < 200`).
  - Mantiene el bypass seguro de modo Mock para pruebas y entornos sandbox.
- **2. Miniaturas Avant-Garde en Frontend (`InventarioPage.tsx`):**
  - Contenedor de imagen cuadrado `w-12 h-12` con bordes rectos y marco `border border-[#333333]`.
  - Carga diferida (`loading="lazy"`) y ajuste de aspecto `object-cover`.
  - Fallback elegante si no tiene imagen o si falla la carga: contenedor con fondo `#111111` e ícono Phosphor `Image` (`#71717A`).
- **3. Verificación y Cobertura (89 pruebas superadas, 0 fallos):**
  - Pruebas unitarias para paginación de página 1 y acumulación multi-página en `TiendanubeApiClientTests.cs`.
  - Compilación de frontend sin errores de TypeScript (`npm run build`).

---

### Prevención de Rate Limit, Sanitización HTML y Drawer de Detalle de Producto - COMPLETADA

**Objetivo:** Proteger las llamadas de sincronización contra bloqueos 429 de Tiendanube con pausas de 500ms, sanitizar etiquetas HTML en descripciones para texto plano legible, y brindar una experiencia inmersiva de inspección de prendas mediante un Slide-Over Drawer Avant-Garde.

- **Rama:** `fix/tiendanube-sync-and-details` (creada a partir de `develop`).
- **1. Prevención de Rate Limit (`TiendanubeApiClient.cs`):**
  - Se introdujo `await Task.Delay(500, ct);` al avanzar de página en el bucle de paginación de `ObtenerProductosAsync`, evitando que Tiendanube corte la conexión por exceso de solicitudes concurrentes.
- **2. Sanitización de HTML (`TiendanubeSyncService.cs`):**
  - Implementación del método `LimpiarHtml(string? html)`: elimina tags HTML (`<.*?>`), traduce saltos de línea y bloques, decodifica entidades web (`&nbsp;`, `&aacute;`, etc.) y normaliza espacios en blanco.
  - Aplicado tanto en inserción de nuevos productos como en actualización idempotente de productos existentes.
  - Saneamiento retroactivo ejecutado sobre la base local `dastik_dev.db`.
- **3. Slide-Over Drawer de Detalle de Producto (`ModalDetalleProducto.tsx`):**
  - Panel lateral derecho animado con backdrop blur oscuro y bordes brutalistas (`#333333`, `#090909`).
  - Muestra la foto del artículo en tamaño ampliado destacado con manejo de fallback.
  - Detalla Marca, Nombre, Categoría, Unidad de Negocio, Precio de Venta en ARS y la Descripción sanitizada.
  - Desglose exhaustivo de variantes con Talle, Color, EAN-13, Stock físico y estados visuales (Disponible, Crítico <= 3, Agotado).
- **4. Integración en `InventarioPage.tsx`:**
  - Filas de la tabla convertidas en elementos interactivos con `cursor-pointer`, hover sutil `#151515`.
  - Apertura inmediata del Drawer al hacer clic en cualquier fila para inspección sin recargar ni alterar la vista.
- **5. Cobertura y Verificación (94 pruebas superadas, 0 fallos):**
  - Pruebas unitarias en `TiendanubeSyncServiceTests.cs` validando la sanitización de HTML y decodificación de entidades.
  - Verificación de compilación sin errores tanto en backend (.NET 8) como en frontend (React + TypeScript).

---

### Bucle de Paginación Seguro, Sanitización HTML y Paginación en Frontend - COMPLETADA

**Objetivo:** Garantizar la sincronización robusta sin errores de Rate Limit (429) o loops indebidos en catálogos extensos de Tiendanube (200+ productos), sanitizar descripciones a texto plano, e implementar paginación client-side fluida en el Data Grid de inventario con miniaturas uniformes e inspección interactiva.

- **Rama:** `fix/tiendanube-sync-and-pagination`.
- **1. Backend - Bucle de Paginación Seguro (`TiendanubeApiClient.cs`):**
  - Estructurado mediante un bucle `do-while` controlado con `page = 1`.
  - Petición parametrizada: `{storeId}/products?per_page=200&page={page}`.
  - Pausa obligatoria `await Task.Delay(500, ct);` al procesar cada página para prevenir bloqueos por Rate Limit de Tiendanube.
  - Condición de corte estricta: `if (productos.Count < 200) break;` y control por cancelación.
- **2. Backend - Limpieza de HTML (`TiendanubeSyncService.cs`):**
  - Método `LimpiarHtml` utilizando expresiones regulares (`Regex.Replace(pDto.Descripcion, @"<.*?>", string.Empty)`) para despojar tags crudos, decodificar entidades HTML y normalizar el texto plano de la descripción.
  - Mapeo consistente tanto en inserción de nuevos productos como en actualización de registros existentes.
  - Exposición de `CostoBase` y `MarkupAplicado` en `ProductoCatalogoDto` (`ListarProductosQuery.cs`) para el consumo de administración.
- **3. Frontend - Componente de Detalle (`ModalDetalleProducto.tsx`):**
  - Slide-Over Drawer brutalista con fondo `#090909`, borde lateral `#333333` y soporte para tecla `Escape` o backdrop blur.
  - Renderiza imagen en gran formato (`imagenUrl`) con fallback de contenedor `#111111` e ícono.
  - Muestra tarjetas métricas con Precio de Venta, Costo Base y Markup/Margen aplicado.
  - Renderiza la descripción saneada en texto plano y la curva completa de variantes (talles, colores, EAN-13 y stock físico con estados reactivos).
- **4. Frontend - Paginación Local y Miniaturas (`InventarioPage.tsx`):**
  - Paginación client-side con `PAGE_SIZE = 15` sobre el conjunto de productos filtrados.
  - Controles de navegación "ANT" y "SIG" con indicador "PÁGINA X DE Y" y reseteo reactivo de página en cambios de filtros o búsqueda.
  - Miniatura cuadrada uniforme de `w-10 h-10 border border-[#333333]` en la columna de Producto.
  - Filas interactivas (`cursor-pointer`) que abren el `ModalDetalleProducto` al seleccionarlas.
- **5. Cobertura y Verificación:**
  - Backend: 94 pruebas unitarias ejecutadas y superadas con 0 fallos (`dotnet test`).
  - Frontend: Compilación limpia sin errores de tipos (`npm run build` en 1.48s).

---

### Extensión de Timeout en Frontend y Optimización de Upsert por Lotes - COMPLETADA

**Objetivo:** Eliminar el error "TIMEOUT OF 10000MS EXCEEDED" en el frontend al procesar catálogos reales de más de 200 productos con pausas de rate limiting, y optimizar el proceso de persistencia en backend mediante acumulación y guardado por lotes atómico único.

- **Rama:** `fix/tiendanube-sync-timeout-and-auth`.
- **1. Frontend - Extensión de Timeout (`apiClient.ts` y `inventarioApi.ts`):**
  - Timeout global de Axios elevado de 10.000 ms a 120.000 ms (2 minutos) en `apiClient.ts`.
  - Configuración explícita de `timeout: 120000` en la petición `sincronizarTiendanube` en `inventarioApi.ts`.
  - Botón "SINCRONIZAR NUBE" en `InventarioPage.tsx` actualizado para reflejar el estado claro "SINCRONIZANDO CATÁLOGO COMPLETO..." con spinner activo y prevención de re-envíos concurrentes.
- **2. Backend - Optimización de Upsert (`TiendanubeSyncService.cs`):**
  - Los productos nuevos se acumulan en memoria en una lista (`nuevosProductos`) durante la iteración del catálogo.
  - Al finalizar el bucle, se ejecuta `_context.Productos.AddRange(nuevosProductos)` y una única llamada atómica `await _context.SaveChangesAsync(ct);`.
  - Esto minimiza la sobrecarga del `ChangeTracker` de Entity Framework Core y reduce drásticamente los tiempos de transacción en disco.
- **3. Frontend - Confirmación de Modal de Detalle (`ModalDetalleProducto.tsx`):**
  - Slide-Over Drawer brutalista 100% verificado y conectado al evento `onClick` de las filas del Data Grid con `cursor-pointer`.
  - Muestra imagen con fallback, descripción limpia, tarjetas métricas (Precio, Costo, Markup/Margen) y desglose de variantes con stock.
- **4. Cobertura y Verificación:**
  - Backend: 94 pruebas unitarias superadas con 0 fallos (`dotnet test`).
  - Frontend: Compilación limpia con 0 errores TypeScript (`npm run build`).

---

### Fase 3: Panel de Métricas y Dashboard del Dueño (MVP) - COMPLETADA

**Objetivo:** Proveer al dueño del local una visión ejecutiva en tiempo real sobre la salud comercial y financiera del negocio (Ingresos, Ganancia Neta basada en costos, Cantidad de Ventas y volumen de los últimos 7 días) junto a un monitor estricto de reposición de stock crítico (unidades ≤ 3).

- **Rama:** `feature/admin-dashboard-mvp` (creada a partir de `develop`).
- **1. Backend - Endpoints y Lógica de Métricas (`MetricasEndpoints.cs`, `MetricasDtos.cs`):**
  - `GET /api/metricas/dashboard`:
    - `IngresosHoy`: sumatoria de ventas brutas cobradas durante la jornada local (UTC-3).
    - `GananciaNetaHoy`: ingresos brutos menos el costo base de reposición de las unidades vendidas (`Ingresos - CostoBase`).
    - `CantidadVentasHoy`: conteo de órdenes pagadas hoy.
    - `MargenPorcentajeHoy`: porcentaje de rentabilidad sobre venta.
    - `VentasUltimos7Dias`: histórico diario de los últimos 7 días discriminado por día de la semana y monto facturado para alimentar la gráfica.
  - `GET /api/metricas/alertas-stock`:
    - Consulta de variantes con `StockFisico <= 3` (regla de negocio del documento de requerimientos).
    - Incluye nombre del producto, marca, talle, color, código de barras EAN-13, miniatura y stock físico.
- **2. Backend - Pruebas Unitarias (`MetricasTests.cs`):**
  - Test validando el cálculo exacto de Ingresos, CostoBase y Ganancia Neta con órdenes y detalles reales en SQLite en memoria.
  - Test validando el filtrado estricto de variantes con stock ≤ 3 unidades y exclusión de variantes con stock saludable.
  - Suite de backend ampliada a 96 pruebas en verde sin fallos (`dotnet test`).
- **3. Frontend - Cliente de Métricas (`metricasApi.ts`):**
  - Métodos tipados `obtenerDashboard()` y `obtenerAlertasStock()`.
- **4. Frontend - Dashboard Principal (`DashboardPage.tsx`):**
  - Página principal del Back-Office renderizada en la ruta `/admin` por defecto.
  - **Fila 1 (Tarjetas Financieras):**
    - Ingresos Hoy: tipografía gigante con ticket promedio.
    - Ganancia Neta Hoy: cifra destacada en acento ámbar con badge de margen porcentual.
    - Ventas Realizadas: conteo de órdenes cobradas en el mostrador.
  - **Fila 2 (Panel Dividido):**
    - *Columna Izquierda (70%):* Gráfico de barras interactivo de "Volumen de Ventas (Últimos 7 días)" con barras estilizadas, tooltip de montos y distinción dorada para la jornada actual.
    - *Columna Derecha (30%):* Panel de **"🔥 ALERTAS DE STOCK"** con scroll vertical, miniaturas cuadradas, talles destacados y badges de stock crítico (rojo para quiebre total / ámbar para crítico).
- **5. Frontend - Navegación y Rutas (`App.tsx`, `AdminLayout.tsx`):**
  - `/admin` renderiza directamente `DashboardPage`.
  - Sidebar actualizada con acceso directo a "Dashboard" y a "Inventario".
- **6. Frontend - Scrollbar Global Avant-Garde (`index.css`):**
  - Personalización integral de barras de desplazamiento (`::-webkit-scrollbar` y `scrollbar-width` / `scrollbar-color`).
  - Dark Mode (por defecto): Track `#090909`, Thumb `#333333` (hover `#555555`), sin bordes redondeados (`border-radius: 0px`).
  - Preparado para futuro Light Mode mediante variables CSS y clase `.light` / `[data-theme="light"]` (Track `#F4F4F5`, Thumb `#D4D4D8`).
  - Heredado automáticamente en toda la app: ventanas, modales, drawers, Data Grids y lista de alertas de stock.
- **7. Cobertura y Verificación:**
  - Backend: 96 pruebas superadas (0 fallos).
  - Frontend: Compilación limpia con 0 errores TypeScript (`npm run build`).

---

### [feature/admin-arqueos] Módulo de Control de Arqueos y Gastos en el Panel de Administración
- **1. Backend - Entidad y Persistencia (`Turno.cs`, `TurnoConfiguration.cs`, `CerrarTurnoCommandHandler.cs`):**
  - Incorporación del campo `GastosTurno` (`decimal(18,2)`) en la entidad `Turno` para registrar y asentar salidas y retiros en efectivo de la gaveta (Uber, almuerzos, insumos).
  - Migración tolerante en desarrollo (`Program.cs`) con fallback SQLite para agregar la columna en bases existentes sin resetear datos.
  - Actualización del handler de cierre de turno para persistir y auditar los gastos del turno.
- **2. Backend - Endpoint de Historial de Arqueos (`CajaEndpoints.cs`):**
  - `GET /api/caja/arqueos`:
    - Consulta optimizada de turnos cerrados ordenados descendentemente por fecha de cierre (`FechaCierre ?? FechaApertura`).
    - DTO de respuesta `ArqueoResumenResponse`:
      - Identificadores y operador: `TurnoId`, `EmpleadoId`, `Operador`, `Turno` (determinado como "Turno Mañana" o "Turno Tarde" según el huso local).
      - Ingresos desglosados por método: `TotalEfectivo`, `TotalTransferencia` (Alias), `TotalDebito`, `TotalCredito` (incluye Posnet) y `TotalVentas`.
      - Retiros y gastos del turno: `GastosTurno`.
      - Métricas de balance y conciliación: `SaldoInicial`, `EfectivoEsperado` (`SaldoInicial + TotalEfectivo - GastosTurno`), `EfectivoRealDeclarado` (`SaldoFinal`), `Diferencia` (`EfectivoRealDeclarado - EfectivoEsperado`), `CantidadOrdenes` y `EstadoDiferencia` (`CUADRADA`, `FALTANTE`, `SOBRANTE`).
- **3. Backend - Seeding y Datos de Prueba (`DataSeeder.cs`, `CajaHandlersTests.cs`):**
  - Generación de turnos históricos cerrados de demostración con diferentes operadores, horarios, métodos de pago, gastos y balances (cuadrada, faltante y sobrante).
  - Pruebas unitarias ampliadas en `CajaHandlersTests.cs` para validar la persistencia de gastos y el balance de arqueo exacto. Suite ampliada a 97 pruebas en verde.
- **4. Frontend - Servicio API (`arqueosApi.ts`):**
  - Cliente Axios tipado `arqueosApi.obtenerArqueos()` consumiendo `GET /api/caja/arqueos`.
- **5. Frontend - Vista de Auditoría y Arqueos (`ArqueosPage.tsx`):**
  - **Diseño Avant-Garde Master-Detail / Accordion:**
    - Fila resumida con identificador de estado, fecha/hora, horario de turno, operador, volumen de ventas, efectivo declarado y badge resumido.
    - Desglose financiero expandible en 3 columnas estilizadas:
      - **Columna Verde (INGRESOS):** Separación visual de cobros en Efectivo en Mostrador, Transferencias / Alias bancarios, Tarjetas de Débito y Crédito / Posnet, con total facturado.
      - **Columna Roja/Naranja (SALIDAS):** Detalle de retiros autorizados y gastos operativos de caja (Uber, almuerzos, insumos).
      - **Recuadro Destacado (CONCILIACIÓN & DIFERENCIA):** Fórmula matemática paso a paso (`Saldo Inicial + Ventas Efectivo - Gastos = Efectivo Esperado` vs `Efectivo Declarado`).
      - **Badge Principal de Auditoría:** Verde si `$0.00` (Caja Cuadrada), Rojo si `< $0` (Faltante), Amarillo si `> $0` (Sobrante).
    - Métricas KPI superiores: Turnos Auditados, Cajas Cuadradas (% de efectividad), Desvíos / Faltantes acumulados y Total Gastos de Caja.
    - Filtros instantáneos por estado (`TODOS`, `CUADRADA`, `FALTANTE`, `SOBRANTE`), horario (`MAÑANA`, `TARDE`) y buscador por operador o ID.
- **6. Frontend - Integración y Rutas (`App.tsx`, `AdminLayout.tsx`):**
  - Enlazado de la ruta `/admin/arqueos` montando `ArqueosPage`.
  - Icono `Receipt` activo en la barra lateral del Back-Office.
- **7. Verificación de Calidad:**
  - Backend: 97/97 tests completados con éxito (`dotnet test`).
  - Frontend: 0 errores TypeScript y bundle de producción generado con éxito (`npm run build`).

---

### [feature/admin-empleados-sueldos] Gestión de Empleados y Sueldos en el Panel de Administración
- **1. Backend - Modelo de Datos (`Usuario.cs`, `UsuarioConfiguration.cs`):**
  - Ampliación de la entidad `Usuario` con las propiedades `TurnoAsignado` (`string`: "Mañana", "Tarde", "Completo") y `TarifaPorHora` (`decimal`: valor monetario personalizado por hora).
  - Configuración fluida en Entity Framework Core con valores por defecto tolerantes.
  - Migración tolerante en desarrollo (`Program.cs`) en SQLite para agregar las columnas `TurnoAsignado` y `TarifaPorHora` a la tabla `Usuarios` sin destruir datos existentes.
- **2. Backend - Endpoints de Gestión y Liquidación (`UsuariosEndpoints.cs`):**
  - `GET /api/usuarios/empleados`: Lista a todos los usuarios con rol `Empleado` ordenados por nombre, devolviendo sus turnos asignados y tarifas por hora.
  - `POST /api/usuarios/empleados`: Permite al Admin dar de alta una nueva cuenta de empleado con validaciones (email único, contraseña temporal ≥ 6 caracteres, flag `DebeCambiarPassword = true` para forzar cambio en su primer inicio de sesión).
  - `POST /api/usuarios/empleados/{id}/calcular-pago`: Endpoint de cálculo y liquidación de jornada que recibe `HorasTrabajadas` (decimal) y calcula en el backend `TotalAPagar = Math.Round(HorasTrabajadas * TarifaPorHora, 2)`.
- **3. Backend - Seeding y Suite de Pruebas (`DataSeeder.cs`, `UsuariosEndpointsTests.cs`):**
  - Seeding de empleados de prueba con turnos asignados ("Mañana", "Tarde") y tarifas horarias realistas ($3.500 y $3.800).
  - Pruebas unitarias completas en `UsuariosEndpointsTests.cs` para filtrado por rol, alta con hashing de clave y cálculo matemático exacto de liquidación diaria para jornadas parciales (8.5h) y completas (12h).
  - Suite de backend ampliada a **100 pruebas en verde sin fallos** (`dotnet test`).
- **4. Frontend - Servicio API (`empleadosApi.ts`):**
  - Cliente Axios tipado con métodos `obtenerEmpleados()`, `crearEmpleado()` y `calcularPago()`.
- **5. Frontend - Vista de Gestión de Empleados (`EmpleadosPage.tsx`):**
  - **Diseño Avant-Garde Minimalista:**
    - Tarjetas KPI: Personal total activo, distribución por turno (Mañana / Tarde) y tarifa promedio por hora.
    - Buscador en vivo por nombre/email y filtros por turno asignado.
    - Data Grid minimalista con nombre, email, badge de turno (Mañana, Tarde, Completo), tarifa por hora, proyección automática a jornada completa (12h) y estado activo.
    - **Modal "NUEVO EMPLEADO":** Formulario de alta con nombre, email, contraseña temporal, selector de turno y tarifa horaria.
    - **Acción Rápida "LIQUIDAR JORNADA":** Modal interactivo por empleado que pregunta *"¿Cuántas horas trabajó hoy?"*, incluye botones de acceso rápido para presets de turno (6h medio turno, 8h estándar, 12h jornada Dastik) o entrada personalizada, mostrando instantáneamente en tipografía gigante el **Total a Pagar** calculado sobre su tarifa única.
- **6. Frontend - Navegación y Rutas (`App.tsx`, `AdminLayout.tsx`):**
  - Ruta `/admin/empleados` montando `EmpleadosPage`.
  - Icono `Users` en el menú lateral con enlace a "Empleados (Sueldos & Staff)".
- **7. Verificación de Calidad:**
  - Backend: 100/100 tests completados con éxito (`dotnet test`).
  - Frontend: 0 errores TypeScript y bundle de producción generado con éxito (`npm run build`).

---

### Refactor de Diseño y Ergonomía Frontend (Design_Base.md) - PASO 1 COMPLETADO

**Objetivo:** Purgar cualquier residuo de diseño no plano (sombras difuminadas, gradientes y redondeos suaves) y elevar los tamaños tipográficos mínimos a $\ge 10\text{px}-11\text{px}$ para garantizar legibilidad en terminales táctiles y monitores de mostrador, en estricto cumplimiento con `Design_Base.md` (100% Flat Design, bordes rectos `#333333`, paleta brutalista de alto contraste).

- **Rama:** `refactor/front-design-system` (creada desde `develop`).
- **1. Purgado de Sombras Difuminadas (`shadow-*`):**
  - Eliminadas todas las clases de sombras difuminadas (`shadow-2xl`, `shadow-lg`, etc.) en modales y contenedores:
    - `ModalPago.tsx`: eliminado `shadow-2xl` del diálogo principal y `shadow-lg` de la alerta de sábado.
    - `ModalCerrarTurno.tsx`, `ModalCrearProducto.tsx`, `ModalDetalleProducto.tsx`: eliminados `shadow-2xl`.
    - `DashboardPage.tsx`: eliminadas sombras `shadow-lg` en tarjetas métricas y paneles.
    - `EmpleadosPage.tsx`: eliminadas `shadow-2xl` en ambos modales (Nuevo Empleado y Liquidar Jornada).
- **2. Eliminación de Gradientes y Reemplazo por Fondos Planos Sólidos:**
  - `ModalPago.tsx`: la alerta de sábado pasó de un gradiente difuso a un bloque plano brutalista con fondo sólido `#0A1A0F` y borde nítido `border border-emerald-500/80`.
  - `EmpleadosPage.tsx`: el banner de desglose de liquidación pasó de `bg-gradient-to-r` a fondo sólido `#0A1A0F` con borde `border border-emerald-500/80`.
- **3. Eliminación de Bordes Redondeados Suaves (`rounded-full`, etc.):**
  - `PosBarcodeScanner.tsx`: el pill de estado pasó de `rounded-full` a `rounded-none`.
  - Eliminadas transiciones lentas innecesarias (`duration-300`, `duration-500` pasadas a `duration-150`) y efectos de escala táctil (`active:scale-95`).
- **4. Ajuste Ergonómico de Tipografía Mínima ($\ge 10\text{px}$):**
  - Subidas todas las fuentes ilegibles de 8px, 9px y 9.5px a `10px` / `11px` en 15 componentes del sistema:
    - `PosBarcodeScanner.tsx`, `ModalPago.tsx`, `ModalCerrarTurno.tsx`, `ModalAbrirTurno.tsx`, `PosHeader.tsx`, `ProductCard.tsx`, `DashboardPos.tsx`.
    - `ModalCrearProducto.tsx`, `ModalDetalleProducto.tsx`, `InventarioPage.tsx`, `DashboardPage.tsx`, `ArqueosPage.tsx`, `EmpleadosPage.tsx`, `AdminLayout.tsx`.
    - `LoginPage.tsx`: botones de credenciales rápidas subidos a `10px`.
- **5. Verificación de Compilación:**
  - `npm run build` ejecutado con éxito (0 errores TypeScript en `tsc -b` y bundle de Vite generado limpiamente).
  - Commit realizado: `605acde style(design): purgar sombras, gradientes, bordes redondeados y elevar tipografia minima a 10px segun Design_Base`.

---

### Atajos de Teclado y Ergonomía de Mostrador - PASO 2 COMPLETADO

**Objetivo:** Agilizar la velocidad de cobro y operación de mostrador mediante atajos de teclado estandarizados (`Escape` para cerrar diálogos, `F2`/`F4` para cobrar orden), bloquear el robo de foco del escáner láser de código de barras cuando hay modales abiertos, y evitar la pérdida accidental de tickets mediante confirmación en dos pasos para la acción "VACIAR".

- **Rama:** `refactor/front-keyboard-ergonomics` (creada desde `develop`).
- **1. Manejo Universal de Tecla `Escape` y Bloqueo de Scroll (`document.body.style.overflow = 'hidden'`):**
  - `ModalPago.tsx`: escucha `Escape` para cerrar el modal de cobro y retornar inmediatamente al mostrador si no se está procesando el cobro (`!isLoading`).
  - `ModalCerrarTurno.tsx`: escucha `Escape` para cancelar el arqueo si no está en proceso de envío (`!isSubmitting` y `!cierreCompletado`).
  - `ModalCrearProducto.tsx`: escucha `Escape` para descartar el formulario de nuevo producto (`!isLoading`).
  - `EmpleadosPage.tsx`: escucha `Escape` para cerrar tanto el modal de nuevo empleado como el modal de liquidación de jornada.
  - `ModalAbrirTurno.tsx`: activa bloqueo de scroll (`document.body.style.overflow = 'hidden'`) para impedir desplazamiento accidental y mantener el aislamiento de terminal.
- **2. Prevención de Robo de Foco en `PosBarcodeScanner.tsx`:**
  - Se incorporó la guardia `if (document.body.style.overflow === 'hidden') return;` en el listener global de clics para evitar que el auto-enfoque del lector de código de barras le robe el foco a los inputs interactivos de los modales (montos de pago, saldos o formularios).
- **3. Atajo Global de Cobro `F2` / `F4` en `DashboardPos.tsx`:**
  - El cajero u operador puede pulsar `F2` o `F4` desde cualquier parte del POS para abrir directamente la ventana de cobro si el carrito tiene artículos y el turno está abierto, sin requerir el mouse.
  - Indicador visual explícito en el botón de acción principal: `COBRAR ORDEN [F2] ($ XX.XXX,XX)`.
- **4. Confirmación Preventiva de Vaciado de Ticket ("VACIAR"):**
  - Implementado patrón interactivo de 2 pasos en `DashboardPos.tsx`: al hacer clic en "VACIAR", el botón conmuta a `¿VACIAR?` (destacado en rojo brutalista de alto contraste) y habilita un botón adyacente `NO` para cancelar, con un temporizador automático de seguridad de 3.5 segundos tras el cual se restaura el estado original. Solo un segundo clic intencional ejecuta `clearCart()`.
- **5. Verificación de Compilación:**
  - `npm run build` ejecutado con éxito (código de salida 0, 4.10s, 0 errores TypeScript).
  - Commit: `cf3b72b feat(ux): atajos de teclado F2 y Escape, prevencion de robo de foco y confirmacion de vaciado de ticket`.

---

### Seguridad, Autorización y Lógica Financiera Backend (.NET 8) - PASO 3 COMPLETADO

**Objetivo:** Proteger endpoints críticos de administración bajo política estricta `AdminOnly`, blindar la transacción de cobro contra alteración maliciosa de precios, auditar la pertenencia de turnos de caja para impedir que un cajero cierre el turno de otro, y corregir el cálculo de comisiones de sábado ajustando fechas UTC al huso local de Argentina (UTC-3).

- **Rama:** `feature/backend-security-and-pricing` (creada desde `develop`).
- **1. Política de Autorización Restrictiva `AdminOnly` (`Program.cs`):**
  - Se registró la política `options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(RolUsuario.Admin)))`.
  - Aplicada a los endpoints sensibles del sistema:
    - `MetricasEndpoints.cs`: `GET /api/metricas/*` (ganancias netas y márgenes de negocio protegidos exclusivamente para el Dueño).
    - `UsuariosEndpoints.cs`: `GET/POST /api/usuarios/empleados/*` (salarios, tarifas horarias, altas de personal y liquidación restringidas al Dueño).
    - `CajaEndpoints.cs`: `GET /api/caja/arqueos` (auditoría histórica de todos los arqueos de gaveta restringida a Admin).
    - `CrearProductoEndpoint.cs`: `POST /api/productos`, `POST /api/inventario` y `POST /api/inventario/sincronizar-tiendanube` restringidos a Admin. El catálogo POS de lectura (`GET /api/productos`) queda asegurado con la política `OperadorCaja`.
- **2. Blindaje de Precios en el Servidor (`CobrarOrdenCommandHandler.cs`):**
  - Validación de integridad de importes: Cada artículo en la orden debe tener `PrecioUnitario > 0`.
  - Control de umbral mínimo de catálogo: Si el artículo tiene precio de venta en catálogo (`PrecioVenta > 0`), el servidor rechaza cualquier solicitud donde `PrecioUnitario < 0.5 * PrecioVenta`, impidiendo manipulación de precios desde el cliente o descuentos no autorizados.
- **3. Auditoría de Propiedad de Turno (`CerrarTurnoCommandHandler.cs`):**
  - `CerrarTurnoCommand` extendido con `SolicitanteId` y flag `EsAdmin`.
  - El handler valida que solo el operador que abrió el turno pueda cerrarlo (`turno.EmpleadoId == SolicitanteId`), reservando la potestad de anulación/cierre extraordinario únicamente a usuarios con rol `Admin`.
- **4. Corrección de Timezone en Comisiones de Sábado (`CalculadoraComisiones.cs`):**
  - Detección de huso horario: Si la fecha suministrada es UTC, se traslada a la zona horaria comercial de Argentina (`UTC-3`) antes de evaluar si el día corresponde a `DayOfWeek.Saturday`.
  - Resuelve el caso de ventas nocturnas de sábado (ej. 21:30 hs local = 00:30 hs domingo UTC) que anteriormente perdían la comisión del 5%.
- **5. Cobertura y Suite de Pruebas (105 tests superados, 0 fallos):**
  - 5 nuevas pruebas unitarias añadidas y verificadas:
    - `ComisionesTests.cs`: Cálculo exitoso de comisión para venta en sábado a la noche (domingo en UTC) y exclusión para venta en viernes por la noche (sábado en UTC).
    - `CajaHandlersTests.cs`: Rechazo a un empleado que intenta cerrar el turno de otro, autorización a Admin para cerrar turno ajeno, y rechazo a ventas con precios adulterados por debajo del umbral mínimo del catálogo.
  - Suite completa: 105/105 tests en verde (`dotnet test`).
  - Bundle frontend verificado: `npm run build` sin errores.
  - Commit: `4184897 feat(security): politica AdminOnly, propiedad de turnos, proteccion de precios y huso UTC-3 en comisiones`.

---

### Seguridad Frontend & Gestión de Caché (AdminRoute y TanStack Query) - COMPLETADO

**Objetivo:** Restringir el acceso a rutas privadas del Back-Office (`/admin/*`) exclusivamente a usuarios con rol `Admin` mediante la guarda `AdminRoute` en React Router, ocultar accesos directos al panel para empleados, y purgar de manera reactiva la caché en memoria de TanStack Query (`queryClient.clear()`) al cerrar sesión (`logout`) y al alternar entre bases de datos de Sandbox y Producción.

- **Rama:** `feature/front-security-cache` (creada desde `develop`).
- **1. Guarda de Enrutamiento `AdminRoute` (`App.tsx`):**
  - Implementado el componente de orden superior `AdminRoute`:
    - Valida que el usuario esté autenticado.
    - Intercepta y resuelve el cambio forzoso de contraseña (`debeCambiarPassword`).
    - Valida que `usuario.rol === 'Admin'`. Si un usuario con rol de `Empleado` intenta navegar directamente a `/admin`, lo redirige de inmediato a la terminal POS (`/`).
  - Todas las rutas anidadas del panel de administración (`/admin`, `/admin/inventario`, `/admin/arqueos`, `/admin/empleados`, `/admin/metricas`) quedan protegidas con `AdminRoute`.
- **2. Control Visual de Privilegios en Cabecera (`PosHeader.tsx`):**
  - El botón `"ADMIN"` solo se renderiza si `usuario?.rol === 'Admin'`, impidiendo la exposición innecesaria de accesos administrativos a cajeros o vendedores.
- **3. Purga Automática de Caché en TanStack Query (`useAuthStore.ts` y `useTenantStore.ts`):**
  - `useAuthStore.ts`: la acción `logout()` invoca `queryClient.clear()`, asegurando que al cerrar sesión no queden en memoria datos sensibles de turnos, arqueos o sueldos.
  - `useTenantStore.ts`: las acciones `setSandboxMode()` y `toggleSandboxMode()` invocan `queryClient.clear()`, previniendo que productos ficticios de Sandbox se muestren en Producción (o viceversa) al alternar entre bases de datos.
- **4. Verificación de Compilación:**
  - `npm run build` ejecutado con éxito (código de salida 0, 1.17s, 0 errores TypeScript).
  - Commit: `f206a17 feat(security): implementar AdminRoute y purga de cache de TanStack Query en logout y cambio de tenant`.







