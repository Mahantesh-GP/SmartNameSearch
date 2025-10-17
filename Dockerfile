# ----- Base runtime -----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 10000
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

# ----- Build stage -----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy your project folders
COPY SmartNameSearch/MeiliNameSearch/src/NameSearch.Api/ NameSearch.Api/
COPY SmartNameSearch/MeiliNameSearch/src/NameSearch.Domain/ NameSearch.Domain/
COPY SmartNameSearch/MeiliNameSearch/src/NameSearch.Infrastructure/ NameSearch.Infrastructure/

# Restore and publish
RUN dotnet restore NameSearch.Api/NameSearch.Api.csproj
RUN dotnet publish NameSearch.Api/NameSearch.Api.csproj -c Release -o /app/publish

# ----- Final image -----
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "NameSearch.Api.dll"]
