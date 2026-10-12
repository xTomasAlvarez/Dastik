using System.Net;
using System.Text.Json;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Infrastructure.Integrations.Tiendanube;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Dastik.Tests;

public class TiendanubeApiClientTests
{
    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastRequestBody { get; private set; }
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

        public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            if (request.Content != null)
            {
                LastRequestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            }
            return _responder(request);
        }
    }

    [Fact]
    public async Task ActualizarStockVarianteAsync_CuandoResponde200_DebeRetornarExitoYEnviarHeadersCorrectos()
    {
        // Arrange
        const string storeId = "123456";
        const string accessToken = "test-token-abc";
        const string productId = "98765";
        const string variantId = "54321";
        const int nuevoStock = 12;

        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    id = 54321,
                    product_id = 98765,
                    stock = nuevoStock
                }),
                System.Text.Encoding.UTF8,
                "application/json")
        };

        var handler = new MockHttpMessageHandler(_ => mockResponse);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ActualizarStockVarianteAsync(
            storeId,
            accessToken,
            productId,
            variantId,
            nuevoStock);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Stock.Should().Be(nuevoStock);

        handler.LastRequest.Should().NotBeNull();
        handler.LastRequest!.Method.Should().Be(HttpMethod.Put);
        handler.LastRequest.RequestUri!.ToString().Should().Be($"https://api.tiendanube.com/v1/{storeId}/products/{productId}/variants/{variantId}");
        
        // Header obligatorio de Tiendanube
        handler.LastRequest.Headers.GetValues("Authentication").Should().Contain($"bearer {accessToken}");
        handler.LastRequestBody.Should().Contain("\"stock\":12");
    }

    [Fact]
    public async Task ActualizarStockVarianteAsync_CuandoTiendanubeRetorna404_DebeRetornarFalloConError()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.NotFound)
        {
            Content = new StringContent("{\"description\": \"Variant not found\", \"code\": 404}")
        };

        var handler = new MockHttpMessageHandler(_ => mockResponse);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ActualizarStockVarianteAsync("123", "token", "999", "888", 5);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("404");
    }

    [Fact]
    public async Task ActualizarStockVarianteAsync_EnModoMock_NoDebeEjecutarLlamadaHttpReal()
    {
        // Arrange: Cuando storeId es "sandbox-mock" o "mock"
        bool httpEjecutado = false;
        var handler = new MockHttpMessageHandler(_ =>
        {
            httpEjecutado = true;
            return new HttpResponseMessage(HttpStatusCode.InternalServerError);
        });

        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ActualizarStockVarianteAsync("sandbox-mock", "token", "123", "456", 20);

        // Assert
        result.IsSuccess.Should().BeTrue();
        httpEjecutado.Should().BeFalse(); // NUNCA debe tocar la red en modo sandbox mock
        result.Value!.Stock.Should().Be(20);
    }

    [Fact]
    public async Task ObtenerProductosAsync_CuandoResponde200_DebeRetornarListaDeProductosYHeadersCorrectos()
    {
        // Arrange
        const string storeId = "123456";
        const string accessToken = "test-token-abc";

        var productosJson = @"[
            {
                ""id"": 991,
                ""name"": { ""es"": ""Remera Boxy Street"" },
                ""description"": { ""es"": ""100% Algodon"" },
                ""images"": [
                    { ""id"": 1, ""src"": ""https://cdn.tiendanube.com/img1.jpg"" }
                ],
                ""variants"": [
                    {
                        ""id"": 5001,
                        ""product_id"": 991,
                        ""price"": ""25000.00"",
                        ""cost"": ""15000.00"",
                        ""stock"": 10,
                        ""barcode"": ""7791234567890"",
                        ""values"": [
                            { ""es"": ""M"" },
                            { ""es"": ""Negro"" }
                        ]
                    }
                ]
            }
        ]";

        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(productosJson, System.Text.Encoding.UTF8, "application/json")
        };

        var handler = new MockHttpMessageHandler(_ => mockResponse);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ObtenerProductosAsync(storeId, accessToken);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Should().HaveCount(1);

        var prod = result.Value[0];
        prod.Id.Should().Be(991);
        prod.Nombre.Should().Be("Remera Boxy Street");
        prod.Descripcion.Should().Be("100% Algodon");
        prod.ImagenUrl.Should().Be("https://cdn.tiendanube.com/img1.jpg");
        prod.Precio.Should().Be(25000.00m);
        prod.Costo.Should().Be(15000.00m);
        prod.Variantes.Should().HaveCount(1);

        var v = prod.Variantes[0];
        v.Id.Should().Be(5001);
        v.ProductId.Should().Be(991);
        v.Talle.Should().Be("M");
        v.Color.Should().Be("Negro");
        v.Barcode.Should().Be("7791234567890");
        v.Stock.Should().Be(10);

        handler.LastRequest.Should().NotBeNull();
        handler.LastRequest!.Method.Should().Be(HttpMethod.Get);
        handler.LastRequest.RequestUri!.ToString().Should().Be($"https://api.tiendanube.com/v1/{storeId}/products?per_page=200&page=1");
        handler.LastRequest.Headers.GetValues("Authentication").Should().Contain($"bearer {accessToken}");
    }

    [Fact]
    public async Task ObtenerProductosAsync_CuandoResponde401_DebeRetornarFalloConError()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("{\"error\": \"Unauthorized\"}")
        };

        var handler = new MockHttpMessageHandler(_ => mockResponse);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ObtenerProductosAsync("123", "token_invalido");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("401");
    }

    [Fact]
    public async Task ObtenerProductosAsync_EnModoMock_DebeRetornarCatalogoSimuladoSinHttp()
    {
        // Arrange
        bool httpLlamado = false;
        var handler = new MockHttpMessageHandler(_ =>
        {
            httpLlamado = true;
            return new HttpResponseMessage(HttpStatusCode.InternalServerError);
        });

        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ObtenerProductosAsync("sandbox-dastik", "mock-token");

        // Assert
        result.IsSuccess.Should().BeTrue();
        httpLlamado.Should().BeFalse();
        result.Value.Should().NotBeNull();
        result.Value!.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Value[0].Variantes.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData("https://shared.tiendanube.com/share/api-key/b8d9b3970a7e7977fe1ca7a29102f4dda9bc6b43ec5e100d0bc7ea8c4cf1994e", "b0b1c5f8e482ed372168badfe114d2cf97254bd5")]
    [InlineData("b0b1c5f8e482ed372168badfe114d2cf97254bd5", "b0b1c5f8e482ed372168badfe114d2cf97254bd5")]
    [InlineData("https://shared.tiendanube.com/share/api-key/abc123xyz", "abc123xyz")]
    [InlineData("  token-con-espacios  ", "token-con-espacios")]
    public void TiendanubeTokenHelper_NormalizarToken_DebeResolverCorrectamente(string entrada, string esperado)
    {
        var normalizado = TiendanubeTokenHelper.NormalizarToken(entrada);
        normalizado.Should().Be(esperado);
    }

    [Fact]
    public async Task ObtenerProductosAsync_CuandoTokenEsEnlaceDeCompartir_DebeEnviarTokenNormalizadoEnHeader()
    {
        // Arrange
        HttpRequestMessage? requestCapturado = null;
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("[]", System.Text.Encoding.UTF8, "application/json")
        };

        var handler = new MockHttpMessageHandler(req =>
        {
            requestCapturado = req;
            return mockResponse;
        });

        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);
        const string enlaceCompartir = "https://shared.tiendanube.com/share/api-key/b8d9b3970a7e7977fe1ca7a29102f4dda9bc6b43ec5e100d0bc7ea8c4cf1994e";

        // Act
        var result = await client.ObtenerProductosAsync("5686318", enlaceCompartir);

        // Assert
        result.IsSuccess.Should().BeTrue();
        requestCapturado.Should().NotBeNull();
        requestCapturado!.Headers.GetValues("Authentication").Should().Contain("bearer b0b1c5f8e482ed372168badfe114d2cf97254bd5");
    }

    [Fact]
    public async Task ObtenerProductosAsync_CuandoHayMultiplesPaginas_DebeAcumularTodosLosProductos()
    {
        // Arrange
        const string storeId = "5686318";
        const string accessToken = "token123";

        // Simular página 1 con 200 productos y página 2 con 5 productos
        var prodsPagina1 = Enumerable.Range(1, 200).Select(i => new
        {
            id = (long)i,
            name = new { es = $"Producto {i}" },
            variants = new[] { new { id = (long)(i * 10), product_id = (long)i, price = "1000.00", stock = 1 } }
        }).ToList();

        var prodsPagina2 = Enumerable.Range(201, 5).Select(i => new
        {
            id = (long)i,
            name = new { es = $"Producto {i}" },
            variants = new[] { new { id = (long)(i * 10), product_id = (long)i, price = "1000.00", stock = 1 } }
        }).ToList();

        var jsonPagina1 = JsonSerializer.Serialize(prodsPagina1);
        var jsonPagina2 = JsonSerializer.Serialize(prodsPagina2);

        var paginasLlamadas = new List<string>();

        var handler = new MockHttpMessageHandler(req =>
        {
            paginasLlamadas.Add(req.RequestUri!.ToString());
            if (req.RequestUri!.ToString().Contains("page=1"))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(jsonPagina1, System.Text.Encoding.UTF8, "application/json")
                };
            }
            if (req.RequestUri!.ToString().Contains("page=2"))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(jsonPagina2, System.Text.Encoding.UTF8, "application/json")
                };
            }
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[]", System.Text.Encoding.UTF8, "application/json")
            };
        });

        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.tiendanube.com/v1/")
        };

        var client = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);

        // Act
        var result = await client.ObtenerProductosAsync(storeId, accessToken);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Should().HaveCount(205);
        paginasLlamadas.Should().HaveCount(2);
        paginasLlamadas[0].Should().Contain("page=1");
        paginasLlamadas[1].Should().Contain("page=2");
    }
}
