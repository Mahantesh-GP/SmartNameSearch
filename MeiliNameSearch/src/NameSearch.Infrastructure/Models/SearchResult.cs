using NameSearch.Domain.Entities;

namespace NameSearch.Infrastructure.Models
{
    /// <summary>
    /// Represents a search hit returned by the name search service. Contains the
    /// underlying PersonRecord and a relevance score reported by Meilisearch.
    /// </summary>
    public record SearchResult(
        string Id,
        double Score,
        PersonRecord Person
    );
}