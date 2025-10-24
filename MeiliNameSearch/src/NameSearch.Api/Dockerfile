FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Set environment variable to skip .csproj file copy during Docker build
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Copy all project files (build context should be MeiliNameSearch)
COPY ["src/NameSearch.Api/NameSearch.Api.csproj", "NameSearch.Api/"]
COPY ["src/NameSearch.Domain/NameSearch.Domain.csproj", "NameSearch.Domain/"]
COPY ["src/NameSearch.Infrastructure/NameSearch.Infrastructure.csproj", "NameSearch.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "NameSearch.Api/NameSearch.Api.csproj"

# Copy all source files
COPY src/NameSearch.Api/ NameSearch.Api/
COPY src/NameSearch.Domain/ NameSearch.Domain/
COPY src/NameSearch.Infrastructure/ NameSearch.Infrastructure/

# Copy nickname dictionary from tools directory
COPY tools/dictionaries/nicknames.json NameSearch.Api/tools/dictionaries/nicknames.json

# Build and publish
WORKDIR /src/NameSearch.Api
RUN dotnet publish "NameSearch.Api.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish /p:UseAppHost=false

# Manually copy nicknames.json to the publish output
RUN mkdir -p /app/publish/tools/dictionaries
COPY tools/dictionaries/nicknames.json /app/publish/tools/dictionaries/nicknames.json

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENTRYPOINT ["sh", "-c", "dotnet NameSearch.Api.dll --urls http://0.0.0.0:$PORT"]
