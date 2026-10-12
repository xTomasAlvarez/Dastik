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
}
