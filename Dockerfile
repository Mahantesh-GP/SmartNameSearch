# ----- Base runtime -----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 10000
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

# ----- Build stage -----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1) Copy only csproj first (better caching)
COPY MeiliNameSearch/src/NameSearch.Domain/*.csproj NameSearch.Domain/
COPY MeiliNameSearch/src/NameSearch.Infrastructure/*.csproj NameSearch.Infrastructure/
COPY MeiliNameSearch/src/NameSearch.Api/*.csproj NameSearch.Api/

RUN dotnet restore NameSearch.Api/NameSearch.Api.csproj

# 2) Copy the rest of the sources
COPY MeiliNameSearch/src/NameSearch.Domain/ NameSearch.Domain/
COPY MeiliNameSearch/src/NameSearch.Infrastructure/ NameSearch.Infrastructure/
COPY MeiliNameSearch/src/NameSearch.Api/ NameSearch.Api/

RUN dotnet publish NameSearch.Api/NameSearch.Api.csproj -c Release -o /app/publish

# ----- Final image -----
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet","NameSearch.Api.dll"]
