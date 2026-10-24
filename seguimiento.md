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

---

### Módulo de Gestión de Cambios (POS) + Generador Casero de Etiquetas (EAN-13 / QR) - COMPLETADO

**Objetivo:** Desarrollar el motor integral de cambios de prendas en mostrador con impacto contable exacto en caja, sincronización omnicanal con Tiendanube (Outbox + Tenant Guard), y generador casero de etiquetas imprimibles de códigos de barras (EAN-13) y QR bajo estética Avant-Garde High-End Streetwear.

- **Rama:** `feature/pos-cambios-y-etiquetas` (creada desde `develop`).
- **1. Backend: Motor de Cambios (`RegistrarCambioCommand` y Endpoints):**
  - Entidad `Orden` extendida con `EsCambio` (bool, default false) y `MotivoCambio` (string?).
  - Mapeo en `OrdenConfiguration` y scripts de migración SQLite tolerante en `Program.cs`.
  - Feature slice `Features/Caja/RegistrarCambio/`:
    - `RegistrarCambioCommand` y `RegistrarCambioResult`.
    - `RegistrarCambioCommandValidator`: valida turno, variante devuelta, cantidad devuelta > 0, variante nueva, cantidad nueva > 0 y motivo obligatorio.
    - `RegistrarCambioCommandHandler`:
      - **Ajuste Dual de Stock:** Incrementa stock físico de la prenda devuelta (`+CantidadDevuelta`) y descuenta stock físico de la nueva prenda (`-CantidadNueva`), verificando existencia y stock disponible efectivo.
      - **Tenant Guard Omnicanal (Outbox Pattern):** Si la variante devuelta o nueva pertenece a "Dastik" (`TieneTiendaNube == true` y posee `TiendanubeVariantId`), encola mensajes `StockIncrementadoPorCambio` / `StockReducidoPorCambio` en `OutboxMessages` para sincronización con la API de Tiendanube. Si pertenece a "Hidden Sneakers", la operación opera exclusivamente a nivel de inventario local.
      - **Impacto Contable Exacto en Caja y Arqueo:** Calcula `Diferencia = SubtotalNuevo - SubtotalDevuelto`. Si la diferencia es positiva (`> 0`), asienta en `Orden.Pagos` **únicamente la diferencia cobrada** en el método de pago seleccionado, evitando inflar falsamente la recaudación ni el arqueo del día con el valor total de la prenda. Si la diferencia es nula ($0) o negativa (saldo a favor del cliente), no se generan registros de pago en la caja.
      - Transaccionalidad ACID atómica (`BeginTransactionAsync` + `CommitAsync`).
  - Endpoints expuestos y protegidos con la política `OperadorCaja`:
    - `POST /api/caja/cambios`
    - `POST /api/caja/cambio`
    - `POST /api/ventas/cambio`
- **2. Cobertura de Pruebas Unitarias Backend (112 tests superados en verde):**
  - Suite de pruebas `CambiosTests.cs` (7 casos de negocio exhaustivos):
    - `RegistrarCambio_ManoAMano_MismoPrecio_ActualizaStockYNoGeneraPagos`: verifica incremento de stock devuelto (+1), descuento de stock nuevo (-1), orden marcada con `EsCambio = true`, total = 0 y pagos vacíos.
    - `RegistrarCambio_ConDiferenciaAFavorDelLocal_CobraDiferenciaYAsientaPagoEnCaja`: verifica cobro de la diferencia exacta ($4.500) y registro en pagos.
    - `RegistrarCambio_StockInsuficienteNuevaVariante_RetornaFalloYSinCambios`: verifica rechazo seguro sin alterar stocks.
    - `RegistrarCambio_TenantGuardTiendanube_DastikEncolaOutbox_HiddenSneakersNo`: verifica que solo la variante de Dastik genere evento en Outbox.
    - `RegistrarCambio_TurnoCerrado_RetornaFallo`: bloqueo de cambios en turnos inactivos.
    - `RegistrarCambio_SinMetodoPagoCuandoHayDiferencia_RetornaFallo`: validación de método de pago obligatorio ante saldos a pagar.
    - `RegistrarCambio_SaldoAFavorDelCliente_NoGeneraPagosNiInflaCaja`: verificación de saldo a favor sin alterar la gaveta de efectivo.
  - Total: 112/112 tests en verde (`dotnet test`).
- **3. Frontend: Modal de Gestión de Cambios en Mostrador (`ModalCambio.tsx`):**
  - Botón prominente `"CAMBIO DE PRENDA"` con icono `ArrowsLeftRight` en `PosHeader.tsx` (visible con turno activo).
  - Wizard interactivo de 4 pasos con estética 100% flat Avant-Garde (sin sombras ni gradientes, `rounded-none`, listener `Escape` y fuentes $\ge 10\text{px}$):
    - **Paso 1 (Devuelve):** Escaneo óptico EAN-13 o buscador rápido en catálogo con auto-selección, selector de cantidad devuelta (+1 stock).
    - **Paso 2 (Lleva):** Escaneo óptico o buscador de la nueva prenda, validación de stock disponible en tiempo real, selector de cantidad a llevar (-1 stock).
    - **Paso 3 (Motivo):** Textarea obligatorio con botones rápidos de 1 clic (pills: `"Cambio de Talle"`, `"Cambio de Color"`, `"Regalo"`, `"Falla de Costura"`, `"Preferencia de Modelo"`).
    - **Paso 4 (Liquidación):**
      - Si diferencia = $0: Badge verde `CAMBIO MANO A MANO ($0 DIFERENCIA)` y botón directo de confirmación.
      - Si diferencia > $0: Panel de cobro de diferencia con métodos reales (`Efectivo` con cálculo automático de vuelto, `Transferencia` con recordatorio de alias Ale/Gordo, `Débito`, y `Crédito` con switch de +25% de interés en cuotas).
      - Si diferencia < $0: Alerta de saldo a favor del cliente con constancia de crédito para futuras compras.
  - Integración en `DashboardPos.tsx`: banner de confirmación tras el cambio e invalidación reactiva de caché en TanStack Query (`catalogo-pos`, `turno-activo`, `turnos`, `dashboard-resumen`).
- **4. Frontend: Generador Casero de Etiquetas Imprimibles (`ModalImprimirEtiquetas.tsx`):**
  - Botón `"IMPRIMIR ETIQUETAS"` con icono `Printer` integrado en el cajón de ficha técnica (`ModalDetalleProducto.tsx`).
  - Opciones de formato visual:
    - `Código de Barras (EAN-13)`: Generador vectorial SVG puro (`BarcodeEan13Svg.tsx`) que calcula las 95 barras estándar de GS1 con checksum Módulo 10, guard bars y zonas de silencio para lectura láser garantizada.
    - `Código QR`: Generador vectorial SVG (`QrCodeSvg.tsx`) vía biblioteca `qrcode` (Módulo 21x21 / 25x25).
  - Control de cantidades y curva de talles:
    - Selectores individuales por talle con botones rápidos: `"Cargar según stock actual"` y `"1 por talle (Curva)"`.
  - Vista previa en pantalla y contenedor dedicado `@media print`:
    - Layout de alta legibilidad para impresión en hojas autoadhesivas estándar (A4 o rollos térmicos de 65x40mm): Marca (`DASTIK` / `HIDDEN SNEAKERS`), nombre de la prenda, **TALLE bien grande en badge de alto contraste**, gráfico SVG nítido y código numérico `CodigoBarras` debajo.
- **5. Verificación de Compilación y Calidad:**
  - `dotnet test`: 112/112 pruebas superadas con 0 errores.
  - `npm run build`: compilación de producción exitosa en 1.71s (código de salida 0, 0 errores TypeScript).
  - **Refinamiento de Plantilla 38x21mm (144x80px) y Geometría EAN-13 Comercial:**
    - Resuelto crash por violación de orden de hooks en React.
    - **Geometría Real EAN-13:** Barras de guardia largas (`height="26"`) en bits 0-2, 45-49 y 92-94, y barras de datos cortas (`height="20"`), encajando los dígitos en el hueco a `y="26.5"` con `'JetBrains Mono', 'Courier New', monospace` (dígito 1 a la izquierda de la primera guardia, bloque 1 de 6 dígitos centrado a la izquierda y bloque 2 de 6 dígitos centrado a la derecha).
    - **Tipografía Avant-Garde Streetwear:** Fuente `'Space Grotesk', 'Inter', system-ui, sans-serif` en el contenedor, Marca con `fontSize: '5.5px'`, `fontWeight: 800`, `letterSpacing: '1.2px'`, Prenda con `fontSize: '6.5px'`, `fontWeight: 900`, `letterSpacing: '-0.2px'`, y Talle con `fontSize: '7.5px'`, `fontWeight: 900`, `letterSpacing: '0.3px'`.
    - **Margen Inferior Protegido:** Contenedor con `padding: '4px 7px 6px 7px'`, precios apilados en columna a la derecha con `paddingBottom: '2px'` para garantizar que `Contado: $ ...` nunca toque el borde inferior de la etiqueta.
    - Exportación a PDF vía `html2canvas` (scale 3, 300 DPI) + `jsPDF` y modo nativo `@media print`.

---

### [feature/admin-metricas-avanzadas] Módulo de Finanzas Reales y Velocidad de Rotación (`/admin/metricas`) - COMPLETADO

**Objetivo:** Desarrollar el centro de inteligencia comercial y financiera para el dueño del local (`/admin/metricas`) bajo metodología TDD estricta, permitiendo calcular la ganancia neta real de bolsillo (descontando costos ocultos de pauta, logística y pasarelas), auditar la velocidad de venta diaria y detectar el capital inmovilizado en stock clavo.

- **Rama:** `feature/admin-metricas-avanzadas` (creada a partir de `develop`).
- **1. Backend - CQRS y Endpoint (`GET /api/metricas/avanzadas`):**
  - Feature slice en `Features/Metricas/ObtenerMetricasAvanzadas/`:
    - `MetricasAvanzadasDtos.cs`:
      - `MetricasAvanzadasResponse`: `IngresosBrutos`, `CostoMercaderiaVendida`, `GananciaBruta`, `GastosCajaRegistrados`, `CantidadOperaciones`, `TicketPromedio`, desgloses de pagos (`TotalEfectivo`, `TotalTransferencia`, `TotalDebito`, `TotalCredito`), comparativa por Unidad de Negocio (`IngresosDastik` vs `IngresosHiddenSneakers`), y colecciones `TopMasVendidos` y `ProductosEstancados`.
      - `TopVendidoDto`: variantes ordenadas por mayor volumen de ventas con cálculo de `VelocidadDiaria` (unidades / días de período), `SugerenciaReposicion` (alerta si stock < 7 días de demanda o stock <= 3) y `CantidadSugerida`.
      - `ProductoEstancadoDto`: variantes activas con stock físico > 0 que tuvieron 0 ventas en el período seleccionado, ordenadas por mayor `CapitalInmovilizado` (`StockFisico * CostoBase`).
    - `ObtenerMetricasAvanzadasQuery.cs`: query con soporte para `Periodo` (`hoy`, `semana`, `mes`, `temporada`) y filtro opcional por `UnidadNegocioId`.
    - `ObtenerMetricasAvanzadasHandler.cs`:
      - Cálculo de ventana temporal precisa en UTC-3 Argentina.
      - Aislamiento y agregación transaccional por tenant si `UnidadNegocioId` está presente.
      - Agrupación y ordenamiento en memoria de ventas, rotación y capital inmovilizado.
  - Endpoint expuesto en `MetricasEndpoints.cs`:
    - `GET /api/metricas/avanzadas` con `.RequireAuthorization("AdminOnly")`.
- **2. Cobertura de Pruebas Unitarias Backend (Fase RED y GREEN):**
  - Nueva suite `MetricasAvanzadasTests.cs` (4 pruebas unitarias de negocio exhaustivas):
    - `ObtenerMetricasAvanzadas_CalculaFinanzasYMediosDePagoCorrectamente`: valida ingresos brutos, costo de mercadería vendida, ganancia bruta, gastos de caja y medios de pago (efectivo vs transferencia).
    - `ObtenerMetricasAvanzadas_CalculaTopMasVendidosYVelocidadDiaria`: valida cálculo exacto de unidades/día y sugerencia de reposición preventiva para 7 días.
    - `ObtenerMetricasAvanzadas_IdentificaProductosEstancadosConCapitalInmovilizado`: verifica la detección de stock clavo sin ventas y el capital total atrapado.
    - `ObtenerMetricasAvanzadas_FiltraPorUnidadNegocioCorrectamente`: confirma el aislamiento contable al filtrar por unidad (`Dastik` vs `Hidden Sneakers`).
  - Total: **116/116 tests en verde** (`dotnet test`).
- **3. Frontend - Pantalla de Inteligencia Comercial (`MetricasPage.tsx` & `metricasApi.ts`):**
  - `metricasApi.ts`: método tipado `obtenerMetricasAvanzadas(periodo?, unidadNegocioId?)`.
  - `MetricasPage.tsx` con estética Avant-Garde High-End Streetwear:
    - **Header & Filtros:** Selector de Período con pills (`HOY`, `7 DÍAS`, `30 DÍAS (MES)`, `90 DÍAS (TEMPORADA)`) y filtro de Unidad de Negocio (`TODAS`, `DASTIK`, `HIDDEN SNEAKERS`).
    - **4 Top KPIs Financieros:** Facturación Bruta, CMV, Ganancia Bruta y Ganancia Neta Real de Bolsillo (con badge verde/rojo según margen).
    - **Calculadora Interactiva de Ganancia Neta Real:**
      - Parámetros persistidos automáticamente en `localStorage`: Gasto en Ads/Publicidad ($ ARS), Envíos Absorbidos ($ ARS), Comisión Pasarela (%) y Suscripción Tiendanube/Fijos ($ ARS).
      - Fórmula visual explícita: `GANANCIA BRUTA - GASTOS DE CAJA - COSTOS DIGITALES Y ADS = GANANCIA NETA REAL`.
    - **Distribución por Medios de Pago & Unidad:** Barras de progreso limpias para Efectivo, Transferencia (Ale/Gordo), Débito y Crédito (cuotas), más desglose Dastik vs Hidden Sneakers.
    - **Inteligencia de Catálogo y Rotación (Tabs Duales):**
      - Pestaña `ALTA ROTACIÓN & REPOSICIÓN`: ranking top 10 con velocidad diaria, unidades vendidas y alerta de reposición preventiva.
      - Pestaña `STOCK INMOVILIZADO`: detector de stock clavo con cálculo del capital inmovilizado total y recomendación de promo flash.
  - Integración en navegación:
    - `AdminLayout.tsx`: nuevo enlace `Finanzas` (`/admin/metricas`) con icono `TrendUp`.
    - `App.tsx`: ruta `/admin/metricas` montada con `MetricasPage` bajo `AdminRoute`.
- **4. Verificación de Compilación:**
  - `dotnet test`: 116/116 pruebas superadas en verde.
  - `npm run build`: compilación de producción exitosa con 0 errores TypeScript.
- **5. Merge a `develop`:**
  - Rama `feature/admin-metricas-avanzadas` fusionada en `develop` con `--no-ff`.

---

### [feature/admin-configuracion-y-tema] Módulo de Configuración de Catálogos Base (`/admin/configuracion`) y Light/Dark Mode - COMPLETADO

**Objetivo:** Completar el último módulo del sistema según los requerimientos: gestión de catálogos base (Proveedores con Markup % por defecto, Marcas y Categorías con Temporada y Esquema de Talles) y soporte nativo para modo claro ("Light Mode") y modo oscuro ("Dark Mode") tanto en la terminal POS como en el panel de Administración.

- **Rama:** `feature/admin-configuracion-y-tema` (creada a partir de `develop`).
- **1. Backend - Endpoints de Configuración (`ConfiguracionEndpoints.cs`):**
  - Endpoints protegidos con la política `.RequireAuthorization("AdminOnly")` expuestos bajo `/api/inventario/*` (y alias `/api/configuracion/*`):
    - **Proveedores:**
      - `GET /api/inventario/proveedores`: devuelve `Id`, `Nombre`, `MarkupPorDefecto` y `CantidadProductos`.
      - `POST /api/inventario/proveedores`: recibe `Nombre` y `MarkupPorDefecto`, valida unicidad case-insensitive y persiste el proveedor.
    - **Marcas:**
      - `GET /api/inventario/marcas`: devuelve `Id`, `Nombre` y `CantidadProductos`.
      - `POST /api/inventario/marcas`: recibe `Nombre`, valida duplicados y crea la marca.
    - **Categorías:**
      - `GET /api/inventario/categorias`: devuelve `Id`, `Nombre`, `Temporada`, `EsquemaTalles` y `CantidadProductos`.
      - `POST /api/inventario/categorias`: recibe `Nombre`, `Temporada` y `EsquemaTalles`, valida campos y persiste la categoría.
  - Registrado en `Program.cs` mediante `app.MapConfiguracionEndpoints()`.
  - Suite de pruebas `ConfiguracionEndpointsTests.cs`: **119/119 tests pasando en verde**.
- **2. Frontend - Panel de Configuración (`ConfiguracionPage.tsx` & `configuracionApi.ts`):**
  - Nueva página en `/admin/configuracion` agregada al sidebar de `AdminLayout.tsx` con icono `Gear` y protegida por `AdminRoute` en `App.tsx`.
  - Diseño estructurado en 3 pestañas interactivas:
    1. **Proveedores:** Grilla de proveedores con su factor/porcentaje de Markup y formulario `"Nuevo Proveedor"` con presets rápidos (+50%, +55%, +60%, +80%, +100%).
    2. **Marcas:** Grilla de marcas comerciales ("Dastik", "Hidden Sneakers", "Nike", "Adidas", etc.) con alta rápida en línea.
    3. **Categorías:** Tabla de categorías ("Remeras", "Pantalones", etc.) con selector de `"Temporada"` y `"Esquema de Talles"`.
  - Integración dinámica en `ModalCrearProducto.tsx`: consume los catálogos desde `configuracionApi` y recalcula automáticamente el precio de venta sugerido al seleccionar un proveedor según su `MarkupPorDefecto`.
- **3. Frontend - Sistema de Diseño "Carbon Slate & Alabaster" (Etapas 1 a 4 Completadas):**
  - **Fundación Tipográfica (`index.html` & `index.css`):**
    - Eliminada por completo la fuente `Syne`.
    - Incorporadas **Plus Jakarta Sans** (`--font-sans` y `--font-heading`) para UI/títulos geométricos limpios y **JetBrains Mono** (`--font-mono` con `font-variant-numeric: tabular-nums`) para precios, SKUs, EAN-13 y KPIs financieros.
  - **Tokens Semánticos Reales y Cambio de Tema 0ms Sin Lag (`index.css` & `useThemeStore.ts`):**
    - Eliminados todos los selectores forzados `html:not(.dark) .bg-\[...\]` y el bloqueo global `* { box-shadow: none !important; }`.
    - Tokens semánticos CSS nativos: `:root` (**Alabaster Light Mode**: `--bg-canvas: #F8FAFC`, `--bg-surface: #FFFFFF`, `--bg-elevated: #F1F5F9`, `--border-subtle: #E2E8F0`) y `html.dark` (**Carbon Slate Dark Mode**: `--bg-canvas: #09090B`, `--bg-surface: #121215`, `--bg-elevated: #18181C`, `--border-subtle: #27272A`).
    - Utilitarios semánticos (`bg-canvas`, `bg-surface`, `bg-elevated`, `border-subtle`, `border-strong`, `text-primary`, `text-secondary`, `text-muted`, `shadow-surface`, `shadow-floating`).
    - Supresión temporal de transiciones CSS (`transition: none !important`) durante el cambio de tema en `useThemeStore.ts` con reflow sincrónico para lograr conmutación instantánea (0ms lag).
  - **Refactor Integral de Primitivos, Terminal POS, Admin y Modales:**
    - `Button.tsx` e `Input.tsx` actualizados con `rounded-lg`, estados focus ring y feedback táctil `active:scale-[0.98]`.
    - **Terminal POS (`PosHeader`, `PosBarcodeScanner`, `CatalogoGrid`, `ProductCard`, `DashboardPos`):** corregidos los bloques negros en Modo Claro en el buscador, cabecera `ORDEN EN CURSO` y bloque inferior `TOTAL A COBRAR`; eliminada la barra de scroll horizontal en el header; tarjetas de producto con `rounded-xl`, `shadow-surface` y precios en `JetBrains Mono`.
    - **Back-Office (`AdminLayout`, `DashboardPage`, `InventarioPage`, `ArqueosPage`, `EmpleadosPage`, `MetricasPage`, `ConfiguracionPage`)** y **Autenticación (`LoginPage`, `LoginForm`, `CambiarPasswordModal`)**: migrados al sistema de superficies elevadas `rounded-xl` / `rounded-lg` con soporte nativo Claro/Oscuro.
    - **Modales POS y Admin (`ModalAbrirTurno`, `ModalCerrarTurno`, `ModalPago`, `ModalCambio`, `ModalCrearProducto`, `ModalDetalleProducto`, `ModalImprimirEtiquetas`):** migrados a tokens semánticos manteniendo **100% intacta** la geometría e inline styles de `.etiqueta-38x21` y `#print-sheet-a4` (`144px x 80px` / `38x21mm`).
- **4. Verificación Final:**
  - `dotnet test`: **119/119 pruebas superadas en verde**.
  - `npm run build`: **0 errores TypeScript**, build de producción limpio en 1.66s.

---

### [fix/audit-schema-and-pos-polish] Auditoría Integral, Sincronización No Destructiva de Esquemas SQLite y Pulido Visual del POS - COMPLETADO

**Objetivo:** Ejecutar las 3 fases de consolidación del sistema: (1) Auditoría funcional de punta a punta (`Configuración <-> Inventario`) y modularización Clean Code de componentes extensos, (2) Parcheador automático no destructivo de esquemas SQLite (`SqliteSchemaPatcher`) para Producción (`dastik_dev.db`) y Sandbox (`dastik_sandbox_dev.db`) resolviendo el error `table Ordenes has no column named MotivoCambio`, y (3) Pruebas integrales de cobro en caja, imágenes reales en tarjetas del POS, Menú Hamburguesa en cabecera y Logo/Favicon oficial de Dastik.

- **Rama:** `fix/audit-schema-and-pos-polish` (creada a partir de `develop`).
- **FASE 1: Auditoría Funcional y Refactorización de Código (Clean Code):**
  - **Integración Fin a Fin (`Configuración` <-> `Inventario`):**
    - `ModalCrearProducto.tsx` sincroniza automáticamente `Proveedores`, `Marcas` y `Categorías` desde `/api/inventario/*` al abrir el modal y recalcula en vivo el `PrecioVenta` sugerido tanto al cambiar de `Proveedor` como al modificar el `CostoBase`, aplicando el `MarkupPorDefecto` real del proveedor seleccionado.
    - En `ConfiguracionEndpoints.cs`, las rutas `GET` (`/proveedores`, `/marcas`, `/categorias`) permiten lectura a cualquier operador autenticado mientras que las rutas `POST` permanecen restringidas exclusivamente a `AdminOnly`.
    - `DashboardPage.tsx` auditado y verificado al 100% contra datos reales de `metricasApi` sin datos hardcodeados.
  - **Modularización Clean Code:**
    - Extraído `CrearProductoVariantesSection.tsx` desde `ModalCrearProducto.tsx`.
    - Extraídos `ModalCrearEmpleado` y `ModalLiquidarJornada` en `EmpleadosModals.tsx` desde `EmpleadosPage.tsx`.
    - Extraído `ArqueoAccordionItem.tsx` desde `ArqueosPage.tsx`.
- **FASE 2: Sincronización No Destructiva de Esquemas SQLite (Producción y Sandbox):**
  - Creado `SqliteSchemaPatcher.cs` (`Back/Dastik.Api/Infrastructure/Persistence/SqliteSchemaPatcher.cs`):
    - Inspecciona `PRAGMA table_info(...)` sobre cada tabla de SQLite y ejecuta `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE ... ADD COLUMN ...` únicamente para las columnas faltantes (`EsCambio`, `MotivoCambio`, `GastosTurno`, `TurnoAsignado`, `TarifaPorHora`, `MarkupPorDefecto`, `ImagenUrl`, `CostoBase`, `MarkupAplicado`, `Temporada`, `EsquemaTalles`, etc.).
    - Integrado en el arranque de `Program.cs`, `DataSeeder.SeedInitialDataAsync` (Producción `dastik_dev.db`) y `SandboxDataSeeder.SeedSandboxDataAsync` / `SeedAsync` (Sandbox `dastik_sandbox_dev.db`), garantizando paridad de esquemas sin borrar datos ni tocar la tienda oficial de Tiendanube.
- **FASE 3: Verificación de Cobro en Caja y Pulido Visual del POS:**
  - **Tests de Integración de Cobro y Esquema (`CajaHandlersTests.cs`):**
    - `CobrarOrden_ConCadaMetodoDePago_DeberiaPersistirOrdenDetallesPagosYDescontarStock`: verifica el cobro con `Efectivo`, `Transferencia`, `Debito` y `Credito`.
    - `SqliteSchemaPatcher_SobreEsquemaAntiguoSinMotivoCambio_DeberiaAgregarColumnasYPermitirCobrarOrden`: verifica que una base SQLite con esquema legado sea actualizada automáticamente y permita cobrar órdenes sin error.
    - `SqliteSchemaPatcher_SobreArchivosLocalesDeDesarrollo_DeberiaSincronizarEsquemaSinDestruirDatos`: actualiza no destructivamente `dastik_sandbox_dev.db` y `dastik_dev.db`.
  - **Imágenes Reales en el POS (`ProductCard.tsx`):**
    - Renderiza `producto.imagenUrl` con `object-cover`, `rounded-lg`, `loading="lazy"` y micro-zoom en hover, manteniendo el ícono de categoría (`TShirt` / `Sneaker`) como fallback automático si el producto no tiene imagen o falla la carga (`onError`).
  - **Menú Hamburguesa en Cabecera del POS (`PosHeader.tsx`):**
    - La barra superior conserva visibles únicamente los controles operativos inmediatos del cajero (indicador de Turno activo, botón rápido `Cambio` y botón `Cerrar Turno`).
    - Agrupados en un **Menú Hamburguesa** (`List` / `X`) alineado a la derecha con `backdrop-blur-md`, cierre al hacer clic afuera y tecla `Escape`: datos de la cuenta activa (`tomiDev` / `Dueño`), selector **Producción / Sandbox**, selector **Modo Claro / Oscuro**, acceso a **Ir al Panel Admin** y **Cerrar Sesión**.
  - **Logo Oficial Dastik y Favicon (`Front/public/dastik-logo.png` & `Front/index.html`):**
    - Copiado `Dastik_Image.png` a `Front/public/dastik-logo.png`.
    - Configurado `<link rel="icon" type="image/png" href="/dastik-logo.png" />` y `<title>Dastik // Hidden Sneakers — POS & ERP</title>` en `Front/index.html`.
    - Integrado el logo oficial en `PosHeader.tsx`, `AdminLayout.tsx` y `LoginPage.tsx`.
- **Verificación de Compilación y Tests:**
  - `dotnet test`: **125/125 pruebas superadas en verde** (0 errores).
  - `npm run build`: **0 errores TypeScript**, build de producción limpio.


---

### [feat/pos-anti-ia-ux-and-gallery] Galería Completa de Imágenes (`ImagenesJson`), Identidad Visual `DastikSinFondo.png` y Rediseño UX/UI "Anti-IA" (Origin UI + Kokonut UI + Motion.dev) - COMPLETADO

**Objetivo:** Elevar la experiencia operativa del mostrador y la estética del sistema eliminando patrones genéricos ("AI Slop"), persistiendo todas las imágenes de productos de Tiendanube (`ImagenesJson`), integrando `DastikSinFondo.png` y `favicon_dastik.png`, unificando el buscador y lector óptico en una Omnibar con paginación de 12 ítems, añadiendo el modal Quick-View con carrusel de fotos y código EAN-13 copiable, y enriqueciendo el ticket en vivo con miniaturas, animaciones (`motion/react`) y códigos EAN-13.

- **Rama:** `feat/pos-anti-ia-ux-and-gallery` (creada a partir de `develop`).
- **1. Backend - Galería Completa de Imágenes (`ImagenesJson`):**
  - `Producto.cs`: nueva propiedad `public string ImagenesJson { get; set; } = "[]";`.
  - `SqliteSchemaPatcher.cs`: registrado el parche no destructivo `new("Productos", "ImagenesJson", "TEXT NOT NULL DEFAULT '[]'")` aplicado automáticamente en `dastik_dev.db` y `dastik_sandbox_dev.db`.
  - `ITiendanubeApiClient.cs`, `TiendanubeApiClient.cs` y `TiendanubeSyncService.cs`: extracción del array completo `images[].src` de Tiendanube y persistencia serializada en `ImagenesJson` (conservando la portada en `ImagenUrl`).
  - `ListarProductosQuery.cs`: `ProductoCatalogoDto` expone `List<string>? Imagenes` con fallback automático a `[p.ImagenUrl]` si `ImagenesJson` está vacío.
- **2. Identidad Visual (`DastikSinFondo.png` + `favicon_dastik.png`) y Limpieza "Anti-IA":**
  - `Front/index.html`: configurado `<link rel="icon" type="image/png" href="/favicon_dastik.png" />` y `<link rel="apple-touch-icon" href="/favicon_dastik.png" />`.
  - `PosHeader.tsx`, `AdminLayout.tsx` y `LoginPage.tsx`: integrado `/DastikSinFondo.png` sin cajas negras artificiales (`bg-black`), aplicando `brightness-50 contrast-125 dark:brightness-110` para contraste nítido en Modo Claro y Modo Oscuro.
  - Eliminados textos redundantes y subtítulos artificiales (`POS v1.0`, `"Terminal de Cobro & Control de Inventario"`, `"Lector Óptico EAN-13 Online"`, `"Catálogo Retail en Tiempo Real"`, `"ADMIN // INVENTARIO CENTRAL"`).
- **3. Omnibar Unificada y Paginación en POS (`CatalogoGrid.tsx`):**
  - Unificados el buscador de catálogo y el lector de código de barras EAN-13 en una sola barra de comando superior con atajo `F1` y detección instantánea al presionar `Enter` (agregando la variante al carrito con miniatura y mostrando un toast inline animado).
  - Segmented Control (`Todos | Dastik | Hidden Sneakers`) con indicador activo deslizante (`motion.div` con `layoutId="pos-unit-pill"`), filtro rápido `"Ocultar agotados"` y botón de recarga.
  - Paginación de grilla a **12 productos por página** con pie de página estilo **Origin UI** (`Mostrando X–Y de Z`, botones `Anterior / Siguiente`).
- **4. Tarjeta de Producto Rediseñada y Modal Quick-View (`ProductCard.tsx` & `ModalQuickViewPos.tsx`):**
  - `ProductCard.tsx`: cabecera visual amplia (`h-36` con `object-cover` y micro-zoom), badges flotantes de marca y stock, sin repetición de marca (`DASTIK` + `Dastik`), y pills de talle táctiles con `motion.button` (`whileTap={{ scale: 0.93 }}`).
  - `ModalQuickViewPos.tsx`: modal animado (`AnimatePresence`) con carrusel de fotos reales (`producto.imagenes`) + tira de miniaturas, selector de talle y bloque destacado con el **código numérico EAN-13 (`codigoBarras`)** en `JetBrains Mono`, botón **"Copiar EAN"** con confirmación visual, botón **"Agregar al Ticket"** y acceso directo a **"Etiquetas"**.
- **5. Ticket `ORDEN EN CURSO` Animado y 3 Mejoras Operativas:**
  - `useCartStore.ts` y `DashboardPos.tsx`: cada ítem del carrito se anima con `AnimatePresence` (`motion/react`) y muestra **miniatura real (`w-10 h-10 rounded-lg object-cover`)**, nombre, pill de talle y **código numérico EAN-13 (`codigoBarras`)**.
  - `InventarioPage.tsx`: invalidación de `['catalogo-pos']` al crear productos o sincronizar Tiendanube.
  - `ModalDetalleProducto.tsx`: visualización de la galería completa de miniaturas `producto.imagenes`.
  - `ModalCambio.tsx`: miniatura real del producto junto al código EAN-13 en los pasos de prenda devuelta y prenda nueva.
- **Verificación de Compilación y Tests:**
  - `dotnet test`: **125/125 pruebas superadas en verde**.
  - `npm run build`: **0 errores TypeScript**, build de producción limpio.


---

### [audit/resilience-security-and-backups] Escaneo Integral de Arquitectura, Endurecimiento de Seguridad, Resiliencia ACID y Sistema de Hot Backup/Rollback - COMPLETADO

**Objetivo:** Realizar un escaneo exhaustivo de arquitectura, seguridad (OWASP), deuda técnica y resiliencia de persistencia previa al release en `main`, implementando un sistema a prueba de fallas de copias de seguridad consistentes en caliente (Hot Backup) y Rollback para SQLite, control de concurrencia optimista, protección estricta de endpoints y optimizaciones de render para el catálogo masivo de 1.704 prendas.

- **Rama:** `develop` (trabajo verificado y consolidado; NO se fusiona aún a `main` respetando la directriz).
- **1. Bloque 1: Sistema de Hot Backup y Rollback Atómico (`DatabaseBackupService`):**
  - Creado `DatabaseBackupService.cs` e `IDatabaseBackupService.cs` (`Back/Dastik.Api/Features/Configuracion/Services/`):
    - Utiliza `VACUUM INTO` nativo de SQLite para generar copias en caliente atómicas, auto-contenidas y desfragmentadas en `Back/Dastik.Api/Backups/` (ignorado en `.gitignore`).
    - Nomenclatura normalizada: `{dbName}_{yyyyMMdd_HHmmss}_{motivo}.db`.
    - Snapshots automáticos implementados:
      - Al inicio de la aplicación (`inicio-diario` generado 1 vez al día en `Program.cs`).
      - Pre-sincronización masiva de Tiendanube (`pre-sync` integrado en `TiendanubeSyncService.cs`).
      - Snapshots manuales desde la interfaz con motivo personalizado.
    - Rotación inteligente de snapshots: retiene los 20 más recientes para prevenir saturación de disco.
    - Mecanismo de Rollback en vivo a prueba de fallos:
      - Snapshot preventivo previo del estado actual (`pre-rollback`).
      - Liberación de conexiones activas con `SqliteConnection.ClearAllPools()` y recolección forzada.
      - Limpieza automática de archivos de journal `-wal` y `-shm`.
      - Sobrescritura segura con reintentos y actualización no destructiva de esquemas con `SqliteSchemaPatcher`.
  - Endpoints expuestos bajo `/api/configuracion/backups`:
    - `GET /api/configuracion/backups`: lista snapshots con archivo, fecha, motivo, tamaño legible y origen.
    - `POST /api/configuracion/backups`: creación de snapshot manual.
    - `POST /api/configuracion/backups/{fileName}/restore`: ejecución de Rollback seguro.
    - Todos los endpoints protegidos estrictamente con `.RequireAuthorization("AdminOnly")`.
  - UI Front-End en `/admin/configuracion`:
    - Creado componente modular `BackupsSection.tsx` integrado en `ConfiguracionPage.tsx`.
    - Formulario con feedback animado (`motion/react`), tabla con badges según tipo (`INICIO DIARIO`, `PRE-SYNC TIENDANUBE`, `PRE-ROLLBACK`, `MANUAL`) y modal de doble confirmación con código de seguridad `"RESTAURAR"`.
- **2. Bloque 2: Auditoría de Seguridad y Control de Acceso (OWASP & Dastik Rules):**
  - Endpoints protegidos: verificado que ningún endpoint crítico (métricas avanzadas, liquidación de jornales, arqueos de caja, sincronización Tiendanube, backups y rollback) sea accesible sin rol `Admin` (`AdminOnly`).
  - `/api/sandbox/reset` protegido con `.RequireAuthorization("OperadorCaja")` eliminando el bypass anónimo previo.
  - Aislamiento de tokens y credenciales de Tiendanube: verificado que `TiendanubeAccessToken` jamás se expone en DTOs públicos, consultas de catálogo ni logs.
  - Bloques transaccionales ACID puros:
    - `CobrarOrdenCommandHandler`: transacciones atómicas `BeginTransactionAsync`, `CommitAsync`, `RollbackAsync`.
    - `RegistrarCambioCommandHandler`: transacción atómica de movimiento dual de prendas y pagos.
    - `CerrarTurnoCommandHandler`: transacción atómica para sellar saldo final, gastos y estado cerrado.
  - Concurrencia optimista implementada en `VarianteConfiguration.cs`:
    - Marcada la propiedad `StockFisico` con `.IsConcurrencyToken()` para control optimista en SQLite y PostgreSQL.
    - Captura de `DbUpdateConcurrencyException` en handlers de cobro y cambios retornando respuestas descriptivas con Result Pattern (`Result.Failure`) sin arrojar excepciones no controladas.
- **3. Bloque 3: Deuda Técnica, Detección de Bugs Silenciosos y Compilador:**
  - Eliminados todos los bloques `catch` vacíos o bare `catch`: convertidos a captura tipada (`JsonException`, `UriFormatException`) en `CatalogClassifierService`, `TiendanubeTokenHelper` y `ListarProductosQuery`.
  - Eliminado el warning CS8602 en `RecuperarPasswordCommandHandlerTests.cs` y suprimidos warnings de EF Core en `DatabaseBackupService.cs` y `Program.cs`.
- **4. Bloque 4: Performance, Memoización y Carga de Catálogo:**
  - `CatalogoGrid.tsx` e `InventarioPage.tsx`: filtros de unidad, taxonomía, búsqueda full-text y paginación 100% blindados con `useMemo`.
  - Atributos `loading="lazy"` y `decoding="async"` incorporados en todas las imágenes de catálogo, modales (`ProductCard`, `InventarioPage`, `DashboardPage`, `ModalCrearProducto`, `ModalDetalleProducto`, `ModalQuickViewPos`, `ModalCambio`, `DashboardPos`) para decodificación asíncrona fuera del hilo principal.
- **5. Verificación de Compilación y Tests:**
  - `dotnet test`: **180/180 pruebas superadas en verde** (0 errores, 0 warnings).
  - `npm run build`: **0 errores TypeScript**, bundle de producción limpio generado en 1.80s.

---

### [fix/ui-modal-producto-tabs] Refactorización Visual y de Navegación del Modal de Creación/Edición de Prendas (`ModalCrearProducto.tsx`) - COMPLETADO

**Objetivo:** Solucionar el bug de alineación y desplazamiento del modal al scrollear la tabla de inventario, y reestructurar el formulario kilométrico en 3 pestañas horizontales limpias con cabecera y pie fijos, ergonomía táctil y atajos de teclado (`F2` / `Escape`).

- **Rama:** `develop` (se mantiene en `develop` según directiva de release).
- **1. Corrección de Layout y Centrado Fijo en Viewport:**
  - Contenedor raíz reconfigurado con `fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-hidden`, eliminando el desplazamiento residual hacia el fondo al scrollear el Data Grid.
  - Tarjeta del modal con dimensiones controladas y centradas: `w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface border border-subtle rounded-2xl shadow-2xl overflow-hidden my-auto`.
  - Bloqueo preventivo de scroll del documento en montaje y desmontaje (`document.body.style.overflow = 'hidden'`).
- **2. Reestructuración en 3 Pestañas Horizontales Especializadas:**
  - **Cabecera Fija:** Icono según modo (`PencilSimple` / `Package`), título reactivo con badge `TIENDANUBE #ID` y botón de cierre `X` [ESC].
  - **Barra de Pestañas Fija (`shrink-0`):**
    - `[ 👕 General & Fotos ]` (Tab 1): Nombre de prenda, descripción editorial con toolbar de formato (Negrita, Cursiva, Lista, +Template Fit Modelo) y contador de caracteres, dropzone con drag & drop y explorador de archivos locales, agregador por URL, grilla de fotos con selección de portada y eliminación, URL de video embebido, y selector de tipo de producto (Físico vs Digital/Servicio).
    - `[ 🏷️ Talles, Precios & Stock ]` (Tab 2): Unidad de negocio (`Dastik` vs `Hidden Sneakers`), proveedor con markup sugerido (+XX%), desglose de costos ERP y margen comercial estimado con atajos rápidos (+50%, +60%, +70%, +100%), curva rápida de talles y tabla completa de variantes (`CrearProductoVariantesSection.tsx`).
    - `[ 🌐 Categorías & SEO ]` (Tab 3): Marca, categoría principal, etiquetas/subcategorías dinámicas (chips agregables y borrables), colecciones destacadas (Nuevos, Destacados, Sale) y bloque de optimización SEO (tags, Google title tag con contador /70 y meta description con contador /160).
  - **Cuerpo con Scroll Interno:** `flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin` renderizando exclusivamente la pestaña activa con transición fade-in instantánea.
  - **Pie Fijo (Siempre Visible):** Switch `Sincronizar con Tiendanube Oficial` con indicador Sandbox o exclusividad Dastik, botón `Cancelar [ESC]` y botón de acción primario `Guardar Cambios [F2]` / `Crear Prenda [F2]`.
- **3. Ergonomía de Teclado & Salto Automático por Validación:**
  - Atajos de teclado: `Escape` para cancelar y `F2` para guardar cambios / enviar el formulario desde cualquier pestaña.
  - Validación inteligente: si falta el nombre del producto, la interfaz conmuta automáticamente a la pestaña `General & Fotos`; si no se configuraron variantes o el precio es inválido, conmuta automáticamente a `Talles, Precios & Stock` mostrando el mensaje de alerta.
- **4. Verificación de Compilación y Calidad:**
  - `dotnet test`: **180/180 pruebas superadas en verde** (0 fallos).
  - `npm run build`: **0 errores TypeScript**, bundle de producción generado en 1.98s.

---

### [fix/ui-modal-portal-containment] Corrección de Raíz de Posicionamiento con React Portal y Eliminación de Containing Block (`createPortal` + CSS Fix) - COMPLETADO

**Objetivo:** Eliminar de raíz el bug visual por el cual `ModalCrearProducto` y `ModalDetalleProducto` aparecían hundidos y fuera del viewport tanto al presionar "Nuevo Producto" como al hacer clic en el lápiz de edición de la tabla, producto de la trampa de `containing block` de CSS generada por `transform: translateY(...)` en `.animate-view-fade-in` y el contenedor con scroll `<main>` en `AdminLayout`.

- **Rama:** `develop`.
- **1. Montaje Directo en el Viewport con React Portal (`createPortal`):**
  - Implementado `createPortal(..., document.body)` en `ModalCrearProducto.tsx` y `ModalDetalleProducto.tsx`.
  - Al renderizarse directamente como hijo de `document.body`, los modales escapan de la jerarquía de `<main>` y de los divs con scroll/transform, garantizando que `fixed inset-0` se vincule al viewport real del navegador (`window`).
  - Eliminado `my-auto` de la tarjeta para permitir que `items-center justify-center` centre matemáticamente el diálogo vertical y horizontalmente en el 100% de la pantalla.
  - Asignado `z-index: 9999` y estilos fijos inline para máxima prioridad de capa sobre cualquier header o sidebar.
- **2. Desactivación de Containing Block Permanente en CSS (`index.css`):**
  - Removido `transform: translateY(4px)` y `forwards` de `@keyframes fadeIn` en `.animate-view-fade-in`, dejándolo como animación pura de `opacity: 0 -> 1`. Esto previene que los elementos contenedores de vista se conviertan permanentemente en `containing blocks` para elementos con `position: fixed`.
- **3. Bloqueo Dual de Scroll de Fondo:**
  - `useEffect` actualizado para bloquear tanto `document.body.style.overflow = 'hidden'` como el scroll del contenedor principal `<main>` (`mainEl.style.overflow = 'hidden'`) mientras el modal está abierto, previniendo desplazamientos fantasma del Data Grid de fondo.
- **4. Verificación de Compilación y Tests:**
  - `dotnet test`: **180/180 pruebas superadas en verde** (0 fallos).
  - `npm run build`: **0 errores TypeScript**, bundle de producción generado limpiamente en 2.07s.

---

### [feat/auth-staff-ledger-fx] Autenticación Real, Seed Oficial de Cuentas, ABM de Empleados, Recuperación de Clave por PIN de 6 Dígitos y Gestión Multidivisa con Dólar API en Vivo - COMPLETADO

**Objetivo:** Implementar los 6 bloques fundamentales de autenticación real, gestión integral de personal, normalización de alias de transferencias y control de gastos multidivisa en el ERP antes de la fase de pruebas de casos de uso, siguiendo estrictamente `dastik-dotnet-architecture`, `dastik-efcore-transactions`, `dastik-design-system` y `vercel-react-best-practices`.

- **Rama:** `develop` (permanece en `develop` para preservación de release).
- **1. Limpieza de Login y Seeding de Cuentas Oficiales (Producción y Sandbox):**
  - `LoginPage.tsx` & `LoginForm.tsx`: Removidos botones de acceso rápido y autocompletado en producción y sandbox; inputs inician vacíos con placeholder sobrio.
  - Seeding en `DataSeeder.cs` y `SandboxDataSeeder.cs`:
    - Dev (sin cambio forzado): `tomidev@dastik.com` (`TomiDev2026!` / `tomiDev` / `admin`, Admin), `tomi.empleado@dastik.com` (`TomiDev2026!`, Empleado).
    - Cuentas oficiales del equipo (requieren cambio obligatorio en 1° login con `Dastik2026!`): `diego@dastik.com` (Admin), `ale@dastik.com` (Empleado), `facundo@dastik.com` (Empleado).
    - Manejo de tracking en memoria de EF Core (`context.Usuarios.Local`) para evitar excepciones de unicidad al seedear.
- **2. Tarjeta Mandatoria de Activación de Cuenta / Cambio de Clave en 1° Ingreso:**
  - `CambiarPasswordModal.tsx`: Modal bloqueante de High-Craft UI con toggles independientes de visibilidad (`Eye`/`EyeSlash`), checklist reactivo de 7 reglas de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número, caracter especial, confirmación idéntica y no reutilizar la clave provisoria).
  - Backend: `CambiarPasswordCommandValidator.cs` con validación estricta y `CambiarPasswordCommandHandler.cs` que persiste el nuevo hash con BCrypt, remueve el flag `DebeCambiarPassword` y emite un nuevo JWT definitivo para desbloquear la sesión sin desloguear al usuario.
- **3. Normalización Global de Alias de Transferencia:**
  - Actualización de `"Gordo"` a `"Facundo"` en toda la interfaz (`ModalPago.tsx`, `ModalCambio.tsx`, `MetricasPage.tsx`).
  - `SqliteSchemaPatcher.cs`: parche no destructivo de base de datos para sanear registros históricos en `Ordenes.MotivoCambio`.
- **4. Flujo de Recuperación de Contraseña por PIN de 6 Dígitos:**
  - Modelo de datos: Agregados campos `PinRecuperacionHash` y `PinRecuperacionExpira` a `Usuario` en `UsuarioConfiguration.cs` y parchado en `SqliteSchemaPatcher.cs`.
  - Endpoints REST en `AuthEndpoints.cs`:
    - `POST /api/auth/solicitar-pin-recuperacion`: Generación de PIN numérico de 6 dígitos con hash BCrypt y vencimiento a 10 minutos (incluye retorno para entorno dev/local).
    - `POST /api/auth/verificar-pin-recuperacion`: Validación de PIN activo y soporte de Master Key de emergencia para el Dueño.
    - `POST /api/auth/confirmar-recuperacion-pin`: Validación de complejidad y reseteo definitivo de credencial sin requerir cambio posterior.
  - Frontend: `ModalRecuperarPassword.tsx` con asistente guiado en 3 pasos (Ingreso de correo -> 6 inputs OTP con auto-foco, pegado de portapapeles y retroceso -> Nueva contraseña con checklist de seguridad) + pestaña de desbloqueo por Llave Maestra.
- **5. ABM Completo de Empleados en Panel Admin:**
  - Endpoints REST en `UsuariosEndpoints.cs` mapeados en `/api/empleados` y `/api/usuarios/empleados`:
    - `GET /api/empleados`: Listado de colaboradores.
    - `POST /api/empleados`: Alta con rol, turno (Mañana/Tarde/Rotativo), valor hora (`decimal(18,2)`) y clave temporal.
    - `PUT /api/empleados/{id}`: Edición de datos, tarifa y asignaciones.
    - `POST /api/empleados/{id}/reset-password`: Reseteo directo a `Dastik2026!` con activación forzada de `DebeCambiarPassword = true`.
    - `PATCH /api/empleados/{id}/toggle-activo`: Suspensión o reactivación lógica sin borrar turnos ni historial de ventas.
  - Frontend UI en `EmpleadosPage.tsx` y `EmpleadosModals.tsx`:
    - Modales estilizados para Alta, Edición, Reseteo y Liquidación de Jornal.
    - Acciones rápidas por fila con badges de estado (`Activo`, `Pausado`, `Clave Temp.`, `Admin`).
- **6. Cotización del Dólar en Vivo (DolarApi.com) y Ledger Multidivisa de Gastos:**
  - Servicio de Backend `DolarCotizacionService.cs` (`IDolarCotizacionService`): Consulta a `https://dolarapi.com/v1/dolares` con timeout defensivo de 5s, caching en memoria (`IMemoryCache`, 15 min) y fallback offline (`Blue: 1240/1220`, `Oficial: 1090/1050`).
  - Entidad de dominio `Gasto.cs` (`Domain/Entities/Gasto.cs`) con mapeo en `GastoConfiguration.cs` y tipos exactos `decimal(18,2)`.
  - Endpoints en `FinanzasEndpoints.cs`:
    - `GET /api/finanzas/cotizacion-dolar`: Consulta en tiempo real de tipos de cambio.
    - `GET /api/finanzas/gastos`: Listado del libro diario con totales calculados en ARS y USD.
    - `POST /api/finanzas/gastos`: Registro de egresos en ARS o USD con cotización congelada y conversión exacta a ARS.
    - `DELETE /api/finanzas/gastos/{id}`: Eliminación lógica (`Activo = false`).
  - Frontend UI en `MetricasPage.tsx` y `finanzasApi.ts`:
    - Widget superior con cotizaciones del Dólar Blue y Oficial y badge de estado en vivo / contingencia.
    - Gestor de Gastos Operativos con selector de divisa ARS/USD, previsualización de conversión en vivo (`U$S 100 x $ 1.240 = $ 124.000 ARS`), categorías y deducción automática en el cálculo de Utilidad Neta real.
- **7. Verificación de Compilación y Suite de Tests:**
  - `dotnet test Back/DastikERP.sln`: **180/180 pruebas superadas en verde** (0 errores, 0 fallos).
  - `npm run build --prefix Front`: **0 errores TypeScript**, compilación completada en 1.88s.
---

### [feat/dev-stealth-and-clean-staff] Invisibilidad de Cuentas Dev (Stealth Mode), Limpieza de Usuarios en Producción y Alineación de Cabecera en Empleados - COMPLETADO

**Objetivo:** Implementar la jerarquía y modo fantasma (`EsOcultoDev`) para las cuentas personales de Tomi, purgar de raíz las cuentas de prueba de la base de datos de producción (`dastik_dev.db`) para que solo figure el personal operativo real, y alinear el diseño y espaciado de la cabecera de `EmpleadosPage.tsx` con el estándar de `ArqueosPage.tsx` e `InventarioPage.tsx`.

- **Rama:** `develop`.
- **1. Jerarquía y Modo Fantasma (Stealth Mode) para Cuentas Dev:**
  - `Usuario.cs` & `UsuarioConfiguration.cs`: Incorporado atributo booleano `EsOcultoDev` (default `false`).
  - `SqliteSchemaPatcher.cs`: Añadida columna a `Usuarios` y parche de datos automático marcando `EsOcultoDev = 1` para `tomidev@dastik.com` y `tomi.empleado@dastik.com`.
  - `LoginResult`, `LoginCommandHandler`, `JwtProvider` y `auth.types.ts`: Propagación de claim y propiedad `esOcultoDev`.
  - `AdminLayout.tsx` & `PosHeader.tsx`: Si la sesión activa corresponde a Tomi, en el perfil inferior izquierdo y badges de cabecera se muestra **`Desarrollador (Dev)`** en vez de `Dueño`.
  - `SandboxBanner.tsx` & `PosHeader.tsx`: El acceso rápido a `Tomi (Dev)` se filtra de la lista y se renderiza **únicamente** si el usuario actual es Tomi; si está logueado Diego, Ale o Facundo, `Tomi (Dev)` es 100% invisible en la interfaz.
- **2. Invisibilidad Total a Nivel Backend y Endpoints:**
  - `UsuariosEndpoints.cs`:
    - `GET /api/empleados` y `GET /api/usuarios/empleados`: Excluyen siempre a nivel base de datos las cuentas con `EsOcultoDev == true` o emails `tomidev@dastik.com` y `tomi.empleado@dastik.com`.
    - Endpoints de edición, reseteo de clave, liquidación y toggle de estado: Devuelven `404 Not Found` ante cualquier intento de acceso o modificación de cuentas de desarrollador.
    - Creación de empleados: Prohíbe registrar usuarios con correos reservados de desarrollo.
  - Blindaje defensivo en `EmpleadosPage.tsx`: Filtro en memoria `empleadosVisibles` garantizando que las cuentas dev no aparezcan en tablas ni alteren métricas de empleados activos o tarifa promedio por hora.
- **3. Limpieza de Cuentas Basura en Producción (`dastik_dev.db`):**
  - `DataSeeder.cs` & `SqliteSchemaPatcher.cs`: Removido el seeding de cuentas de prueba (`cajero.sandbox@dastik.com`, `sofia.empleada@dastik.com`, `admin@dastik.com`) en Producción y agregado script de saneamiento automático que elimina `cajero.sandbox@dastik.com`, `sofia.empleada@dastik.com`, `lucas@dastik.com`, `franco@dastik.com` y `admin@dastik.com` de `dastik_dev.db`.
  - Base de producción saneada: `Equipo & Jornales` ahora lista únicamente a los empleados reales del local (**Ale** y **Facundo**).
- **4. Corrección de UI y Espaciado en Cabecera de `EmpleadosPage.tsx`:**
  - Contenedor unificado: `p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full`, eliminando el encimado contra el botón circular `<` de colapso del sidebar en `AdminLayout`.
  - Formato tipográfico alineado con `ArqueosPage.tsx` e `InventarioPage.tsx`:
    - Subtítulo: `<p className="text-xs font-medium text-amber-400 mb-1">Operaciones &amp; Gestión de Personal</p>`.
    - Título: `<h1 className="text-2xl font-bold tracking-tight text-primary">Equipo &amp; Jornales</h1>`.
  - Unificado también el ancho máximo del contenedor en `MetricasPage.tsx` a `max-w-[1600px] mx-auto w-full`.
- **5. Verificación de Compilación y Suite de Tests:**
  - `dotnet test Back/DastikERP.sln`: **181/181 pruebas superadas en verde** (0 fallos, 0 errores), incluyendo nuevo test de Stealth Mode `ListarEmpleados_DebeOcultarCuentasDev_StealthMode`.
  - `npm run build --prefix Front`: **0 errores TypeScript**, bundle generado exitosamente en 2.68s.
---

### [fix/tiendanube-notnull-and-cambios-audit] Corrección de Error 19 NOT NULL en Sincronización Tiendanube y Auditoría Exhaustiva de Cambios de Ropa e Integridad de Base de Datos - COMPLETADO

**Objetivo:** Resolver el Error 500 (`SQLite Error 19: 'NOT NULL constraint failed: Productos.SeoTitulo'`) reportado al sincronizar con Tiendanube, y ejecutar una auditoría profunda de la integridad de base de datos para Cambios de Ropa (inmutabilidad temporal de turnos cerrados, prevención de doble cambio de prendas, tabla de auditoría `MovimientosStock` y verificación física de integridad SQLite).

- **Rama:** `develop`.
- **1. Corrección Defensiva de Columnas NOT NULL en Tiendanube e Inventario:**
  - `Producto.cs`: Inicializadores por defecto seguros (`= string.Empty;` / `= "[]";`) para todas las propiedades editoriales y de SEO (`VideoUrl`, `TagsSeo`, `SeoTitulo`, `SeoDescripcion`, `SubcategoriasJson`, `DestacadosJson`).
  - `ProductoConfiguration.cs`: Mapeo explícito `.HasDefaultValue("")` y `.HasDefaultValue("[]")` en Fluent API.
  - `SqliteSchemaPatcher.cs`:
    - Incorporadas columnas con defaults a `ColumnPatches` y a la sentencia `CREATE TABLE IF NOT EXISTS "Productos"`.
    - Script de saneamiento de base de datos ejecutando `COALESCE(columna, '')` para purgar cualquier valor `NULL` residual existente en `dastik_dev.db` y `dastik_sandbox_dev.db`.
  - Handlers de backend (`TiendanubeSyncService.cs`, `CrearProductoCommandHandler.cs`, `EditarProductoCommandHandler.cs`): Operador de coalescencia `?? string.Empty` y `?? "[]"` defensivo garantizando que jamás se transmita un `null` hacia SQLite.
  - Nueva prueba unitaria: `SincronizarCatalogoAsync_ConCamposSeoNulos_InsertaExitosamenteSinViolacionNotnull`.
- **2. Auditoría y Trazabilidad de Cambios de Ropa (Inmutabilidad Temporal & Doble Cambio):**
  - **Inmutabilidad de Turnos Cerrados:** Un cambio de ropa proveniente de un ticket emitido en un turno anterior ya cerrado (`Estado = Cerrado`) asienta el comprobante y la diferencia dineraria únicamente en el turno activo actual (`Estado = Abierto`), manteniendo inalterados los saldos, totales y arqueos del turno anterior.
  - **Prevención de Doble Cambio (`FueCambiado`):**
    - Añadido campo `FueCambiado` (boolean, default `false`) en `DetalleOrden.cs` y su configuración EF Core.
    - `RegistrarCambioCommandHandler.cs`: Verifica si el ítem devuelto del ticket original ya fue cambiado (`itemTicketDevuelto.FueCambiado == true`); en caso afirmativo, rechaza la operación inmediatamente (`"La prenda seleccionada del ticket #... ya fue cambiada previamente"`).
    - Al procesarse el cambio con éxito, marca `FueCambiado = true` dentro de la transacción.
  - **Tabla de Auditoría `MovimientosStock`:**
    - Creada entidad `MovimientoStock.cs` con configuración Fluent API (`MovimientoStockConfiguration.cs`) y tabla correspondiente en SQLite (`SqliteSchemaPatcher.cs`).
    - En cada cambio, se asientan dos registros atómicos: `TipoMovimientoStock.DevolucionCambio` (+stock devuelto) y `TipoMovimientoStock.SalidaCambio` (-stock nuevo), con stock resultante, timestamp UTC, referencia a la orden y motivo de cambio.
    - Se mapeó la relación `Orden` para garantizar la resolución ordenada de claves foráneas en EF Core.
  - **Pruebas Automatizadas:**
    - `RegistrarCambio_EntreTurnoCerradoYTurnoAbierto_NoAlteraTurnoCerradoYAsientaEnTurnoActual`.
    - `RegistrarCambio_ItemDeTicketCambiadoPreviamente_RechazaSegundoCambio`.
- **3. Auditoría Física de Integridad SQLite (`PRAGMA`):**
  - Ejecutado `PRAGMA integrity_check;` en `dastik_dev.db` y `dastik_sandbox_dev.db` -> **Resultado: `ok`**.
  - Ejecutado `PRAGMA foreign_key_check;` en ambas bases de datos -> **Resultado: 0 violaciones de integridad referencial**.
- **4. Verificación de Compilación y Suite de Tests:**
  - `dotnet test Back/DastikERP.sln`: **184/184 pruebas superadas en verde** (0 fallos, 0 errores).
  - `npm run build --prefix Front`: **0 errores TypeScript**, bundle generado exitosamente en 2.17s.
---

### [feat/not-found-and-error-boundary] Pantalla 404 Personalizada y Animada con Temática Streetwear y Error Boundary Global - COMPLETADO

**Objetivo:** Implementar una pantalla de error 404 personalizada (`NotFoundPage.tsx`) con estética de etiqueta retail (*clothing hangtag*) y código de barras vectorial con animación de escaneo láser en `motion/react`, junto con un `GlobalErrorBoundary.tsx` para atrapar cualquier excepción de renderizado imprevista sin dejar la pantalla en blanco.

- **Rama:** `develop`.
- **1. Pantalla 404 Retail / Streetwear (`NotFoundPage.tsx`):**
  - **Identidad Visual High-Craft:** Diseño de tarjeta tipo hangtag con ojal metálico, hilo superior, badge monospaciado `ERROR DE RUTA // SKU FUERA DE CATÁLOGO`, tipografía display `404` con física spring y código de barras vectorial.
  - **Línea Láser Ámbar Animada (`motion/react`):** Escáner láser vertical continuo con `animate={{ y: [0, 48, 0] }}` y `repeat: Infinity`.
  - **Chip de Ruta Intentada:** Muestra en formato monoespaciado la ruta inexistente (`location.pathname`) para diagnóstico inmediato.
  - **Acciones de Rescate Operativo:**
    - Botón primario de rescate a Terminal POS (`/pos` o `/login` según autenticación).
    - Botón secundario condicional hacia Panel Admin (`/admin/dashboard`) exclusivo para roles `Admin` o `Dev`.
    - Botón terciario de retroceso (`navigate(-1)`).
    - Atajos de teclado físicos (`Escape` y `Backspace` fuera de campos de texto) con redirección automática.
- **2. Conexión de Rutas en React Router (`App.tsx`):**
  - Incorporada la ruta comodín `<Route path="*" element={<NotFoundPage />} />` tanto a nivel raíz como dentro de las subrutas administrativas `/admin/*`.
- **3. Contingencia Global ante Fallos de Renderizado (`GlobalErrorBoundary.tsx`):**
  - Captura excepciones con `componentDidCatch` y muestra una tarjeta sobria con estética Dastik compatible con modo Dark y Light.
  - Opciones de recuperación: `Recargar Sistema` (`window.location.reload()`) y `Volver al POS` (`window.location.href = '/pos'`).
  - Panel colapsable de traza técnica con botón de copiado al portapapeles.
  - Integrado envolviendo la jerarquía en `main.tsx` y en el núcleo de `App.tsx`.
- **4. Verificación de Compilación y Suite de Tests:**
  - `npm run build --prefix Front`: **0 errores TypeScript**, bundle generado en 2.05s.
  - `dotnet test Back/DastikERP.sln`: **184/184 pruebas superadas en verde** (0 fallos).
---

### [chore/tiendanube-credentials-sanitization] Saneamiento de Credenciales de Tiendanube y Blindaje de Secretos en Git - COMPLETADO

**Objetivo:** Eliminar cualquier token o enlace real de Tiendanube expuesto en el código y pruebas unitarias (resolviendo alerta de GitGuardian), blindar el rastreo de Git mediante `.gitignore` para secretos y configuraciones locales (`appsettings.Development.json`, `appsettings.Local.json`, `.env*`), y configurar el token local desacoplado.

- **Rama:** `develop`.
- **1. Saneamiento de Pruebas Unitarias y Código Fuente:**
  - `TiendanubeApiClientTests.cs`: Enlace compartido reemplazado por `"https://shared.tiendanube.com/share/api-key/mock_test_key_dummy_12345"` y aserción de cabecera contra `"bearer mock_token_dummy_98765"`.
  - `TiendanubeTokenHelper.cs`: Eliminados hashes y tokens duros; ahora normaliza dinámicamente cualquier URI válida y maneja mocks ficticios sin datos sensibles.
  - `TiendanubeSyncServiceTests.cs`: Token real sustituido por `"mock_test_token_dastik_999"`.
  - `TiendanubeApiClient.cs`: Ajustada la guardia `EsModoMock` para permitir que el test de cabeceras de red evalúe el envío del bearer simulado.
- **2. Blindaje de Git y Archivos de Configuración:**
  - `.gitignore` (raíz y `Back/`): Incorporadas reglas explícitas para ignorar `appsettings.Development.json`, `appsettings.Local.json`, `appsettings.*.json` (excepto `appsettings.json`), `.env` y `.env.*`.
  - `git rm --cached Back/Dastik.Api/appsettings.Development.json`: Removido del índice de Git sin eliminar el archivo físico local.
  - `appsettings.json` (público/trackeado): Valores de Tiendanube limpios (`"StoreId": "5686318"`, `"AccessToken": ""`).
  - `DataSeeder.cs`: Habilitada la lectura jerárquica de `Tiendanube:StoreId` y `Tiendanube:AccessToken` desde `IConfiguration` además de variables de entorno.
- **3. Configuración Local Segura:**
  - `appsettings.Development.json` (ignorado en Git): Configurado con el StoreId `"5686318"` y el nuevo token de desarrollo de Tiendanube.
- **4. Verificación de Compilación y Suite de Tests:**
  - `dotnet test Back/DastikERP.sln`: **184/184 pruebas superadas en verde** (0 fallos).
  - `npm run build --prefix Front`: **0 errores TypeScript**, compilación completada limpiamente.
  - Verificación `git grep`: **0 ocurrencias** de credenciales sensibles en todo el repositorio rastreado.
---

### [feat/tiendanube-intelligent-fallback] Jerarquía de Configuración y Fallback Inteligente de Tokens Tiendanube - COMPLETADO

**Objetivo:** Implementar la lectura jerárquica de credenciales desde `IConfiguration` (`appsettings.Development.json`), fallback inteligente ante respuestas 401 Unauthorized y auto-sincronización en base de datos (`dastik_dev.db`), unificando todas las fuentes del StoreId `5686318` y token de Tiendanube.

- **Rama:** `develop`.
- **1. Jerarquía de Configuración y Fallback Inteligente (`TiendanubeSyncService.cs`):**
  - Inyección de `IConfiguration` en `TiendanubeSyncService` para priorizar los valores configurados en `appsettings.Development.json` (`Tiendanube:StoreId` y `Tiendanube:AccessToken`) sobre la base de datos y variables de entorno.
  - Implementado mecanismo de reintento automático: si el token inicial es rechazado con `401 Unauthorized`, reintenta de forma transparente con el token alternativo (ej. el de BD si difiere del de Config, o viceversa).
  - Auto-sanación de base de datos: si una credencial resulta exitosa (`200 OK`), actualiza inmediatamente el registro de `UnidadNegocio` "Dastik" en `AppDbContext` (`await _context.SaveChangesAsync()`).
- **2. Unificación en Fuentes Locales y Base de Datos:**
  - `dastik_dev.db`: Actualizada la entidad `UnidadNegocio` de Dastik con `StoreId: '5686318'` y `AccessToken: 'b0b1c5f8e482ed372168badfe114d2cf97254bd5'`.
  - `dastik_sandbox_dev.db`: Mantiene aislado su entorno mock (`Store: 'sandbox-dastik'`, `Token: 'mock-token-dastik'`).
  - `Back/.env`: Sincronizado con `TIENDANUBE_STORE_ID="5686318"` y `TIENDANUBE_ACCESS_TOKEN="b0b1c5f8e482ed372168badfe114d2cf97254bd5"`.
  - `Back/Dastik.Api/appsettings.Development.json`: Persistido con las credenciales locales de desarrollo.
  - `SqliteSchemaPatcher.cs`: Añadido parche 7 para asegurar que `TieneTiendaNube = 1` y `TiendanubeStoreId = '5686318'` en la base local de producción.
- **3. Verificación de Compilación y Suite de Tests:**
  - Nueva prueba unitaria: `SincronizarCatalogoAsync_CuandoTokenPrimarioResponde401_EjecutaFallbackConTokenAlternativoYActualizaBd` en `TiendanubeSyncServiceTests.cs`.
  - `dotnet test Back/DastikERP.sln`: **185/185 pruebas superadas en verde** (0 fallos).
  - `npm run build --prefix Front`: **0 errores TypeScript**, compilación en 1.86s.
