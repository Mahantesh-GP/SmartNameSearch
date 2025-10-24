FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files from the build context (src/) so restore can be cached
COPY NameSearch.Domain/NameSearch.Domain.csproj NameSearch.Domain/
COPY NameSearch.Infrastructure/NameSearch.Infrastructure.csproj NameSearch.Infrastructure/
COPY NameSearch.Api/NameSearch.Api.csproj NameSearch.Api/

# Restore as distinct layers to improve build performance.
RUN dotnet restore NameSearch.Api/NameSearch.Api.csproj

# Copy the rest of the source code
COPY . .

# Copy nickname dictionary from tools directory
COPY ../../tools/dictionaries/nicknames.json /src/tools/dictionaries/

# Build and publish the application
WORKDIR /src/NameSearch.Api
RUN dotnet publish NameSearch.Api.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS="http://0.0.0.0:8080"
ENTRYPOINT ["sh", "-c", "dotnet NameSearch.Api.dll --urls http://0.0.0.0:$PORT"]