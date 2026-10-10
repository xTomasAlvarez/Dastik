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

**Paso 6: EF Core y Fluent API (Feat)**
- Instrucciones para crear la rama `feature/efcore-setup`.
- Instalar paquetes NuGet (`Microsoft.EntityFrameworkCore.Design`, `Npgsql.EntityFrameworkCore.PostgreSQL`).
- Crear el `AppDbContext` y las clases `IEntityTypeConfiguration` para las entidades del Paso 5.
- Instrucciones para generar la primera migración inicial.
- Mensaje de commit sugerido.
