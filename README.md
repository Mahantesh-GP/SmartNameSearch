# Smart Name Search API (Meilisearch Edition)

This repository contains a sample implementation of a **phonetic name search** service built with **.NET 9** and backed by **Meilisearch**.  The goal of the project is to demonstrate how to index and query person/business records using phonetic matching, nickname expansion and fuzzy search.  The solution is structured as a small microservice that can be run locally using Docker or deployed to any cloud environment.

## ✨ Features

- **Phonetic matching** – names are converted to **Double Metaphone** codes so that similarly pronounced names (e.g. *Smith* and *Smyth*) return the same results.
- **Nickname expansion** – common nicknames are expanded to their formal equivalents (e.g. *Liz* → *Elizabeth*, *Bob* → *Robert*) using a simple JSON dictionary.
- **Fuzzy matching** – Meilisearch’s built‑in typo‑tolerance is used to match minor spelling mistakes.
- **Modular architecture** – the solution is split into **API**, **Domain** and **Infrastructure** projects to keep concerns separated.
- **Docker support** – a `docker-compose.yml` is provided to spin up Meilisearch and the API together.
- **Unit tests** – a minimal test project ensures the infrastructure components (e.g. phonetic encoding) behave as expected.

## 🧱 Architecture

The solution is organized into the following projects:

| Project | Purpose |
|---|---|
| **NameSearch.Api** | ASP.NET Core Web API exposing endpoints for indexing and searching. |
| **NameSearch.Domain** | Domain entities, such as `PersonRecord`. |
| **NameSearch.Infrastructure** | Infrastructure services (Meilisearch client, indexing, search, phonetic encoding, nickname expansion). |
| **tests/NameSearch.Tests** | xUnit tests for the infrastructure components. |
| **docker** | Contains `docker-compose.yml` to run Meilisearch and the API together. |
| **tools** | Contains a sample `nicknames.json` dictionary used for nickname expansion. |

## ⚙️ Prerequisites

1. **.NET 9 SDK** – Install the latest stable version of the .NET SDK.  According to the .NET release schedule, .NET 9.0 is the current stable release as of October 2025【529390732680042†L154-L190】.
2. **Docker** – Required to run Meilisearch locally via the provided `docker-compose.yml` file.
3. **Make** (optional) – Some commands are provided via `make` targets for convenience.

## 🚀 Running the service locally

1. **Clone this repository** and navigate into it:

   ```bash
   git clone <your fork>
   cd MeiliNameSearch
   ```

2. **Build the solution:**

   ```bash
   dotnet build
   ```

3. **Start the services with Docker Compose:**

   ```bash
   cd docker
   docker compose up -d
   ```

   This command starts a Meilisearch instance and the ASP.NET Core API.  The API will be available on port `5000` and Meilisearch on port `7700` by default.

4. **Verify the API is running:**

   ```bash
   curl http://localhost:5000/NameSearch/example
   ```

   You should see a sample `PersonRecord` returned as JSON.  You can then use the `/NameSearch/index` endpoint to index your own data and `/NameSearch/search` to query it.

## 🛠️ Project structure (summary)

```text
MeiliNameSearch/
├── src/
│   ├── NameSearch.Api/               # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Program.cs
│   │   ├── Dockerfile
│   │   └── NameSearch.Api.csproj
│   ├── NameSearch.Domain/           # Domain entities
│   │   ├── Entities/
│   │   └── NameSearch.Domain.csproj
│   └── NameSearch.Infrastructure/   # Infrastructure services
│       ├── DoubleMetaphone.cs
│       ├── NicknameProvider.cs
│       ├── MeiliSearchClient.cs
│       ├── IndexService.cs
│       ├── SearchService.cs
│       ├── Models/
│       │   └── SearchResult.cs
│       └── NameSearch.Infrastructure.csproj
├── tests/NameSearch.Tests/          # Unit tests
├── tools/dictionaries/nicknames.json
├── docker/docker-compose.yml        # Docker compose for Meilisearch + API
└── README.md                        # This file
```

## 🔨 Next steps and improvements

The current implementation provides a minimal scaffolding.  To turn this into a fully featured service you can:

1. **Complete the indexing logic:** Extend `IndexService` to generate comprehensive phonetic keys and nickname expansions.
2. **Enhance search ranking:** Adjust ranking rules and synonyms in Meilisearch to produce more relevant results.
3. **Add hybrid search:** Combine full‑text and vector search by computing embeddings (e.g., using a local model via [Ollama](https://ollama.ai/)) and storing them in Meilisearch’s vector field.
4. **Implement a UI:** Create a simple frontend (e.g., with Blazor or React) to query the API and visualize results and scores.
5. **Deploy to the cloud:** Use services like Railway, Render or Fly.io to host both Meilisearch and the API for free (or nearly free) as part of a learning portfolio.

Feel free to modify the code to suit your own use cases and experiments.  Contributions are welcome!# SmartNameSearch
