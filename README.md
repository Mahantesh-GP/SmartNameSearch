# 🔍 Smart Name Search

![CI](https://github.com/Mahantesh-GP/SmartNameSearch/actions/workflows/deploy-react.yml/badge.svg)

A **production-ready intelligent name search API** built with **.NET 9** and **Meilisearch** that provides fuzzy matching, phonetic search, and nickname expansion capabilities. Perfect for applications requiring advanced person/business name matching with tolerance for typos, variations, and nicknames.

## 🌟 Live Demo

- **Frontend:** [https://mahantesh-gp.github.io/SmartNameSearch/](https://mahantesh-gp.github.io/SmartNameSearch/)
- **API:** [https://smartnamesearch.onrender.com](https://smartnamesearch.onrender.com)
- **Swagger UI:** [https://smartnamesearch.onrender.com/swagger](https://smartnamesearch.onrender.com/swagger)

## ✨ Features

### Backend API
- 🎯 **Smart Name Matching** - Find "Bob" when searching for "Robert", "Liz" for "Elizabeth"
- 🔊 **Phonetic Search** - Match names that sound similar using Double Metaphone algorithm
- 🌐 **Transitive Nickname Expansion** - Automatically expands nicknames bidirectionally
- ⚡ **Fast Fuzzy Search** - Powered by Meilisearch with typo tolerance
- 🔄 **Background Job Processing** - Async bulk indexing with job status tracking
- � **Ranking Scores** - Returns relevance scores (0.0-1.0) for search results
- �📊 **RESTful API** - Clean API design with Swagger documentation
- 🔧 **Health Monitoring** - `/healthz` endpoint for uptime checks
- 🐳 **Docker Ready** - Easy deployment with Docker containers
- 🚀 **Production Deployed** - Running on Render.com with CI/CD via GitHub Actions

### React Frontend UI
- 🎨 **Modern Design** - Gradient animations, glassmorphism effects, smooth transitions
- 📱 **Mobile Responsive** - Fully optimized for mobile, tablet, and desktop
- 🌓 **Dark/Light Mode** - Automatic theme detection with manual toggle
- 📄 **Pagination** - Navigate through results 10 per page (fetches 100)
- 📊 **Score Display** - Shows match relevance as percentages (e.g., 87%)
- 🔍 **Filters & Sorting** - Filter by state, sort by score or name
- 📤 **Bulk Upload** - One-click sample data generation with job status tracking
- 💾 **Welcome Banner** - First-time user guidance (dismissible)
- ⚡ **Empty Index Detection** - Prompts to index data if search finds nothing
- 🎯 **Progress Bars** - Visual ranking score indicators

## 🎯 Use Cases

- **Customer Relationship Management (CRM)** - Find customer records with name variations
- **Identity Verification** - Match names across different documents and spellings
- **Healthcare Systems** - Locate patient records despite typos or informal names
- **HR & Recruiting** - Search candidates with nickname/full name flexibility
- **Contact Management** - Universal people finder across organizations
- **Background Check Services** - Match names with phonetic and nickname variations

## 🏗️ How It Works

### The Magic Behind Smart Matching

**Example: Searching for "Bob Morrison"**

```
1. INDEXING (when "Robert Morrison" was added):
   ┌─────────────────────────────────────────────────┐
   │ Original: Robert Morrison                       │
   ├─────────────────────────────────────────────────┤
   │ Nickname Expansion:                             │
   │   first_variants: [Robert, Rob, Bob, Bobby]     │
   │   last_variants: [Morrison]                     │
   ├─────────────────────────────────────────────────┤
   │ Phonetic Encoding (Double Metaphone):           │
   │   phoneticFirst: [RPRT, RP, BP, BPY]           │
   │   phoneticLast: [MRSN]                          │
   ├─────────────────────────────────────────────────┤
   │ Combined Tokens: All unique values merged       │
   └─────────────────────────────────────────────────┘

2. SEARCHING (user types "Bob Morrison"):
   ┌─────────────────────────────────────────────────┐
   │ Query: "Bob Morrison"                           │
   ├─────────────────────────────────────────────────┤
   │ Expansion:                                      │
   │   Bob → [Bob, Robert, Bobby, BP, BPY]          │
   │   Morrison → [Morrison, MRSN]                   │
   ├─────────────────────────────────────────────────┤
   │ Meilisearch Query:                              │
   │   "Bob Robert Bobby BP BPY Morrison MRSN"       │
   ├─────────────────────────────────────────────────┤
   │ ✅ Match Found: Robert Morrison (Score: 0.98)  │
   └─────────────────────────────────────────────────┘
```

### Architecture Flow

<img width="891" height="681" alt="image" src="https://github.com/user-attachments/assets/f87660bc-923e-422a-9328-f02a7c078f6c" />


## 📋 API Endpoints

### Search & Index Operations

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/NameSearch/search` | GET | Smart search with nickname & phonetic matching (returns ranking scores) | `?query=Bob&limit=10` |
| `/NameSearch/index` | POST | Add/update person records synchronously | Body: `PersonRecord[]` |
| `/NameSearch/bulk-index-from-randomuser` | POST | Fetch & index sample data from RandomUser.me (sync) | `?count=100` |
| `/NameSearch/bulk-index-sample` | POST | Generate & index synthetic sample data (sync) | `?count=200` |
| `/NameSearch/enqueue-bulk-index` | POST | Queue bulk indexing job using RandomUser.me (async) | `?count=100` |
| `/NameSearch/enqueue-bulk-index-sample` | POST | Queue synthetic data generation job (async) | `?count=100` |
| `/NameSearch/job-status/{id}` | GET | Check background job status | Returns job state |
| `/NameSearch/index-stats` | GET | Get Meilisearch index statistics | Document count, etc. |
| `/NameSearch/example` | GET | Returns sample PersonRecord | For testing |
| `/healthz` | GET | Health check endpoint | Returns `{"status":"ok"}` |

### Example Requests

**Search for names:**
```bash
curl "https://smartnamesearch.onrender.com/NameSearch/search?query=Bob%20Smith&limit=5"
```

**Index a person:**
```bash
curl -X POST "https://smartnamesearch.onrender.com/NameSearch/index" \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "1",
    "firstName": "Robert",
    "lastName": "Smith",
    "city": "Seattle",
    "state": "WA"
  }]'
```

**Queue bulk import job:**
```bash
curl -X POST "https://smartnamesearch.onrender.com/NameSearch/enqueue-bulk-index?count=50"
# Returns: { "jobId": "abc-123..." }

# Check job status:
curl "https://smartnamesearch.onrender.com/NameSearch/job-status/abc-123..."
```

## 🧱 Project Structure

```
SmartNameSearch/
├── MeiliNameSearch/
│   ├── src/
│   │   ├── NameSearch.Api/              # 🌐 ASP.NET Core Web API
│   │   │   ├── Controllers/
│   │   │   │   └── NameSearchController.cs
│   │   │   ├── Background/              # 🔄 Background job infrastructure
│   │   │   │   ├── IBackgroundTaskQueue.cs
│   │   │   │   ├── BackgroundTaskQueue.cs
│   │   │   │   ├── QueuedHostedService.cs
│   │   │   │   └── JobTracker.cs
│   │   │   ├── Program.cs               # App configuration & DI
│   │   │   ├── Dockerfile               # Multi-stage Docker build
│   │   │   └── NameSearch.Api.csproj
│   │   │
│   │   ├── NameSearch.Domain/           # 📦 Domain entities
│   │   │   ├── Entities/
│   │   │   │   └── PersonRecord.cs      # Core person model
│   │   │   └── NameSearch.Domain.csproj
│   │   │
│   │   └── NameSearch.Infrastructure/   # 🛠️ Services & utilities
│   │       ├── Services/
│   │       │   ├── MeiliSearchClient.cs      # HTTP wrapper for Meilisearch
│   │       │   ├── IndexService.cs           # Document enrichment & indexing
│   │       │   ├── SearchService.cs          # Query expansion & search
│   │       │   ├── NicknameProvider.cs       # Nickname graph expansion
│   │       │   └── DoubleMetaphone.cs        # Phonetic encoding
│   │       ├── Models/
│   │       │   └── SearchResult.cs
│   │       └── NameSearch.Infrastructure.csproj
│   │
│   ├── tests/
│   │   └── NameSearch.Tests/            # 🧪 Unit tests
│   │       ├── DoubleMetaphoneTests.cs
│   │       ├── NicknameProviderTests.cs
│   │       └── NameSearch.Tests.csproj
│   │
│   ├── tools/
│   │   └── dictionaries/
│   │       └── nicknames.json           # 📖 Nickname mappings (55+ entries)
│   │
│   ├── scripts/
│   │   └── build-nicknames.js           # 🔧 Script to build nickname dictionary
│   │
│   ├── docker/
│   │   └── docker-compose.yml           # 🐳 Local dev environment
│   │
│   └── MeiliNameSearch.sln              # Solution file
│
├── MeiliNameSearchReact/                # ⚛️ React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                      # Main app component
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile                       # Nginx-based production build
│   └── nginx.conf
│
└── README.md                            # This file
```

## 🔧 Technology Stack

### Backend
- **.NET 9** - Latest LTS framework
- **ASP.NET Core Web API** - RESTful API framework
- **Meilisearch** - Lightning-fast search engine
- **C# Records** - Immutable domain models
- **Docker** - Containerization

### Frontend
- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **GitHub Pages** - Static hosting

### Infrastructure
- **Render.com** - API & Meilisearch hosting
- **GitHub Actions** - CI/CD pipeline
- **Docker Hub** - Container registry

## ⚙️ Key Components Explained

### 1. **NicknameProvider** - Transitive Nickname Graph

Builds a bidirectional graph from `nicknames.json` and performs BFS traversal to find all related names.

```csharp
// Example: "Liz" expands to all related names
var names = nicknameProvider.Expand("Liz");
// Returns: ["Liz", "Elizabeth", "Beth", "Lizzy", "Eliza", "Betty"]
```

**How it works:**
- Loads nickname mappings: `{ "Elizabeth": ["Liz", "Beth", ...] }`
- Creates bidirectional links: Elizabeth ↔ Liz ↔ Beth
- BFS finds transitive closure (all connected names)

### 2. **DoubleMetaphoneEncoder** - Phonetic Matching

Converts names to phonetic codes for sound-alike matching.

```csharp
var (primary, alternate) = encoder.Encode("Smith");
// Returns: ("SM0", "XMT")

encoder.Encode("Smyth");
// Returns: ("SM0", "XMT") - Same as Smith!
```

**Benefits:**
- Handles pronunciation variations
- Language-independent matching
- Returns primary + alternate encodings for better coverage

### 3. **IndexService** - Document Enrichment

Transforms simple PersonRecords into searchable documents with expanded metadata.

```csharp
Input:  { firstName: "Bob", lastName: "Smith" }

Output: {
  firstName: "Bob",
  lastName: "Smith",
  first_variants: ["Bob", "Robert", "Bobby"],
  last_variants: ["Smith"],
  phoneticFirst: ["BP", "RPRT", "BPY"],
  phoneticLast: ["SM0", "XMT"],
  tokens: [all unique values combined]
}
```

### 4. **SearchService** - Query Expansion

Expands user queries with nicknames and phonetics before searching.

```csharp
User types: "Bob"
Expanded query: "Bob Robert Bobby BP RPRT BPY"
Meilisearch finds all matches across these variants
```

### 5. **Background Jobs** - Async Processing

Prevents blocking the API during heavy operations like bulk imports.

```
User Request → JobTracker (Queued) → BackgroundQueue
                     ↓
              QueuedHostedService picks up job
                     ↓
              JobTracker (Running) → Work executes
                     ↓
              JobTracker (Completed/Failed)
```

**Components:**
- `IBackgroundTaskQueue` - Thread-safe job queue (using `Channel<T>`)
- `QueuedHostedService` - Background worker that processes queue
- `JobTracker` - In-memory status tracker (`ConcurrentDictionary`)

## 🚀 Getting Started

### Prerequisites

- **.NET 9 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop)
- **Node.js 22+** - For frontend development (optional)

### Local Development Setup

#### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/Mahantesh-GP/SmartNameSearch.git
cd SmartNameSearch/MeiliNameSearch

# Start Meilisearch and API
cd docker
docker compose up -d

# API available at: http://localhost:5000
# Meilisearch at: http://localhost:7700
```

#### Option 2: Run API Locally (without Docker)

```bash
# 1. Start Meilisearch separately
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-master-key \
  getmeili/meilisearch:latest

# 2. Set environment variables
export MEILI_HOST=http://localhost:7700
export MEILI_API_KEY=your-master-key

# 3. Run the API
cd MeiliNameSearch/src/NameSearch.Api
dotnet run --urls http://localhost:5002

# API available at: http://localhost:5002
# Swagger UI: http://localhost:5002/swagger
```

#### Option 3: Frontend Development

```bash
cd MeiliNameSearchReact

# Install dependencies
npm install

# Start dev server
npm run dev

# Frontend available at: http://localhost:5173
```

### Configuration

#### Environment Variables

**API (NameSearch.Api):**
```bash
MEILI_HOST=https://meilisearch-latest-mhph.onrender.com/
MEILI_API_KEY=your-api-key
ALLOWED_ORIGINS=http://localhost:5173;https://mahantesh-gp.github.io
ENABLE_SWAGGER=true
NICKNAMES_PATH=/app/tools/dictionaries/nicknames.json  # Optional
NICKNAME_PROVIDER=hybrid  # graph | cloudflare | hybrid (default: hybrid)
# Cloudflare Workers AI (optional - required for cloudflare/hybrid)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3-8b-instruct  # Optional model id
```

### Nickname Expansion Providers

By default the API uses a hybrid nickname expansion strategy:

- `cloudflare` (preferred when configured): Expands nicknames via Cloudflare Workers AI and returns results as JSON. Uses the local graph as a fallback on errors.
- `graph`: Use only the local, transitive nickname graph (no external calls).
- `hybrid` (default): Prefer Cloudflare when credentials are present; otherwise fall back to the local graph.

To force local-only behavior (recommended for sensitive PII), set `NICKNAME_PROVIDER=graph` in your environment.

**Frontend (React):**
```bash
VITE_API_BASE_URL=https://smartnamesearch.onrender.com
```

## 📊 Sample Data

### Load Sample Data via API

```bash
# Synchronous (waits for completion)
curl -X POST "http://localhost:5000/NameSearch/bulk-index-from-randomuser?count=100"

# Asynchronous (returns job ID)
curl -X POST "http://localhost:5000/NameSearch/enqueue-bulk-index?count=100"
# Response: { "jobId": "..." }

# Check job status
curl "http://localhost:5000/NameSearch/job-status/{jobId}"
```

### Index Custom Data

```bash
curl -X POST "http://localhost:5000/NameSearch/index" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "1",
      "firstName": "Elizabeth",
      "lastName": "Johnson",
      "city": "New York",
      "state": "NY",
      "dob": "1990-05-15"
    },
    {
      "id": "2",
      "firstName": "Robert",
      "lastName": "Williams",
      "city": "Los Angeles",
      "state": "CA"
    }
  ]'
```

### Search Examples

```bash
# Find "Liz" (matches Elizabeth)
curl "http://localhost:5000/NameSearch/search?query=Liz&limit=5"

# Find "Bob" (matches Robert)
curl "http://localhost:5000/NameSearch/search?query=Bob%20Williams&limit=10"

# Phonetic match: "Smyth" finds "Smith"
curl "http://localhost:5000/NameSearch/search?query=Smyth"
```

## 🧪 Testing

```bash
# Run all tests
cd MeiliNameSearch
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run specific test
dotnet test --filter "FullyQualifiedName~DoubleMetaphoneTests"
```

## 📦 Deployment

### Deploy to Render.com

1. **Fork this repository**

2. **Create Meilisearch Service:**
   - New Web Service → Docker
   - Image: `getmeili/meilisearch:latest`
   - Environment: `MEILI_MASTER_KEY=your-secret-key`

3. **Create API Service:**
   - New Web Service → Build from Dockerfile
   - Root Directory: `MeiliNameSearch/src/NameSearch.Api`
   - Environment variables:
     ```
     MEILI_HOST=https://your-meilisearch-url.onrender.com
     MEILI_API_KEY=your-secret-key
     ENABLE_SWAGGER=true
     ```

4. **Deploy Frontend to GitHub Pages:**
   - Push to `main` branch
   - GitHub Actions automatically builds and deploys
   - Available at: `https://your-username.github.io/SmartNameSearch/`

### Docker Build

```bash
# Build API image
cd MeiliNameSearch/src/NameSearch.Api
docker build -t smartnamesearch-api .

# Run container
docker run -p 8080:8080 \
  -e MEILI_HOST=http://meilisearch:7700 \
  -e MEILI_API_KEY=your-key \
  smartnamesearch-api
```

## 🎨 Frontend Screenshots

### Search Interface
![Search Interface](https://github.com/user-attachments/assets/bb1d2772-6a30-4e98-aa5f-108ac7d987b9)

### Search Results
![Search Results](https://github.com/user-attachments/assets/4d10aaf6-32a9-4184-b085-621b10177287)

## 📚 Nickname Dictionary

The project includes a curated nickname dictionary with 55+ common mappings:

```json
{
  "Bob": ["Robert", "Bobby"],
  "Liz": ["Elizabeth", "Lizzy"],
  "Bill": ["William", "Will", "Billy"],
  "Kate": ["Katherine", "Katie", "Catherine"],
  ...
}
```

**To update the dictionary:**

```bash
# Edit tools/dictionaries/nicknames.json
# Or run the build script
cd MeiliNameSearch
node scripts/build-nicknames.js
```

## 🔍 Troubleshooting

### API returns empty results
```bash
# Check index stats
curl "http://localhost:5000/NameSearch/index-stats"

# If numberOfDocuments is 0, index some data
curl -X POST "http://localhost:5000/NameSearch/enqueue-bulk-index?count=50"
```

### Background jobs failing on Render
- Check Render logs for errors
- Verify `MEILI_HOST` and `MEILI_API_KEY` environment variables
- Ensure Meilisearch service is running and accessible

### CORS issues in development
- Add your local URL to `ALLOWED_ORIGINS` environment variable:
  ```bash
  export ALLOWED_ORIGINS="http://localhost:5173;http://localhost:3000"
  ```

### Port 5000 already in use (macOS/Linux)
```bash
# Use a different port
dotnet run --urls http://localhost:5002
```

## � Recent Updates

### Latest Features (October 2025)
- ✅ **Pagination Support** - Browse through search results 10 per page (up to 100 results)
- ✅ **Mobile Responsiveness** - Fully responsive design optimized for all screen sizes
- ✅ **Score Percentages** - Match relevance displayed as percentages (87% vs 0.87)
- ✅ **Synthetic Data Seeding** - Network-independent sample data generation
- ✅ **Background Job System** - Async bulk indexing with real-time status tracking
- ✅ **Health Monitoring** - `/healthz` endpoint for production monitoring
- ✅ **Dark Mode** - Automatic theme detection with manual toggle

### UI/UX Improvements
- **Mobile-first design** with responsive breakpoints (sm:640px+)
- **Compact pagination** on mobile (← 1/5 → vs Previous Page 1 of 5 Next)
- **Adaptive layouts** - Search button stacks below input on mobile
- **Touch-optimized** controls with proper spacing and sizing
- **Progress bars** showing relative match quality
- **Empty state detection** - Prompts users to index data if search yields no results

## �🛣️ Roadmap

- [ ] **Vector Search** - Add embedding-based semantic search using Ollama
- [ ] **Advanced Phonetics** - Support for multiple phonetic algorithms (Soundex, Metaphone3)
- [ ] **Multi-language Support** - Nickname dictionaries for other languages
- [ ] **Batch Processing** - Support for CSV/Excel imports
- [ ] **Real-time Sync** - WebSocket notifications for index updates
- [ ] **Analytics Dashboard** - Search metrics and usage statistics
- [ ] **Audit Logging** - Track all search and index operations
- [ ] **Rate Limiting** - API throttling and quota management
- [ ] **Caching Layer** - Redis cache for frequent queries

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Meilisearch** - Amazing open-source search engine
- **Double Metaphone** - Phonetic algorithm by Lawrence Philips
- **RandomUser.me** - Free API for generating random user data
- **.NET Team** - Excellent framework and tooling

## 📞 Contact

**Mahantesh GP**
- GitHub: [@Mahantesh-GP](https://github.com/Mahantesh-GP)
- Project: [SmartNameSearch](https://github.com/Mahantesh-GP/SmartNameSearch)

---
 
Feel free to modify the code to suit your own use cases and experiments.  Contributions are welcome!# SmartNameSearch
![CI](https://github.com/Mahantesh-GP/SmartNameSearch/actions/workflows/deploy-react.yml/badge.svg)
