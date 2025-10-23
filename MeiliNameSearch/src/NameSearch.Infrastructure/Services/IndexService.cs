using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Models;
using System.Text.Json;

namespace NameSearch.Infrastructure.Services
{
    /// <summary>
    /// Service responsible for transforming PersonRecords into Meilisearch documents and
    /// indexing them. It enriches records with nickname expansions and phonetic keys
    /// before sending them to Meilisearch.
    /// </summary>
    public class IndexService
    {
        private const string IndexName = "persons";
        private readonly MeiliSearchClient _client;
        private readonly NicknameProvider _nicknameProvider;
        private readonly DoubleMetaphoneEncoder _doubleMetaphone;

        public IndexService(MeiliSearchClient client, NicknameProvider nicknameProvider, DoubleMetaphoneEncoder doubleMetaphone)
        {
            _client = client;
            _nicknameProvider = nicknameProvider;
            _doubleMetaphone = doubleMetaphone;
        }

        /// <summary>
        /// Indexes a collection of PersonRecord objects. Each record is enriched with nickname
        /// expansions, phonetic keys, and token lists before being sent to Meilisearch.
        /// Returns the number of records processed.
        /// </summary>
        /// <param name="records">The person records to index.</param>
        public async Task<int> IndexRecordsAsync(IEnumerable<PersonRecord> records)
        {
            var docs = new List<Dictionary<string, object?>>();
            foreach (var record in records)
            {
               // for each record
var firsts = _nicknameProvider.Expand(record.FirstName);   // e.g., ["Liz","Elizabeth","Beth",...]
var lasts  = _nicknameProvider.Expand(record.LastName);    // often just the same last name list

// phonetic encodes for all variants (first & last)
var firstPhon = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
var lastPhon  = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

foreach (var f in firsts)
{
    var (p, a) = _doubleMetaphone.Encode(f);
    if (!string.IsNullOrEmpty(p)) firstPhon.Add(p);
    if (!string.IsNullOrEmpty(a)) firstPhon.Add(a!);
}
foreach (var l in lasts)
{
    var (p, a) = _doubleMetaphone.Encode(l);
    if (!string.IsNullOrEmpty(p)) lastPhon.Add(p);
    if (!string.IsNullOrEmpty(a)) lastPhon.Add(a!);
}
                // Build a document for Meilisearch. Additional properties like nicknames and
                // phonetic keys are stored separately to enable filtering and scoring at search time.
                var doc = new Dictionary<string, object?>
                {
                    ["id"] = record.Id,
                    ["firstName"] = record.FirstName,
                    ["lastName"] = record.LastName,
                    ["middleName"] = record.MiddleName,
                    ["city"] = record.City,
                    ["state"] = record.State,
                    ["dob"] = record.Dob?.ToString("yyyy-MM-dd"),
                    ["first_variants"] = firsts.ToArray(),  
                    ["last_variants"] = lasts.ToArray(),
                    ["phoneticFirst"] = firstPhon.ToArray(),
                    ["phoneticLast"] = lastPhon.ToArray(),
                    ["tokens"] =firsts.Concat(lasts)
                   .Concat(firstPhon)
                   .Concat(lastPhon)
                   .Distinct(StringComparer.OrdinalIgnoreCase)
                   .ToArray()
                };
                docs.Add(doc);
            }
            // Create the index if it does not exist. We use "id" as the primary key.
            await _client.EnsureIndexExistsAsync(IndexName, "id");
            // Add documents to Meilisearch. This will replace existing documents with the same id.
            await _client.AddDocumentsAsync(IndexName, docs);
            return docs.Count;
        }

        private static List<string> BuildTokens(PersonRecord record, IReadOnlyList<string> nicknames)
        {
            var tokens = new List<string>();
            // Include all nicknames and the canonical first name.
            tokens.AddRange(nicknames);
            // Include last name.
            tokens.Add(record.LastName);
            // Include optional middle name and location fields if present.
            if (!string.IsNullOrWhiteSpace(record.MiddleName)) tokens.Add(record.MiddleName!);
            if (!string.IsNullOrWhiteSpace(record.City)) tokens.Add(record.City!);
            if (!string.IsNullOrWhiteSpace(record.State)) tokens.Add(record.State!);
            return tokens;
        }
    }
}