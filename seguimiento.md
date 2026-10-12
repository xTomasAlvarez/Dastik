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
- Estilo estricto *Avant-Garde / High-End Streetwear* (`Design_Base.md`):
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

