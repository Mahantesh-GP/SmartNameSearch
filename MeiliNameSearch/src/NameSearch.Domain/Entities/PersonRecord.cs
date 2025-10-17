namespace NameSearch.Domain.Entities
{
    /// <summary>
    /// Represents a person or business entity that can be indexed and searched. The
    /// record contains the basic identifying fields. Optional fields may be null.
    /// </summary>
    public record PersonRecord(
        string Id,
        string FirstName,
        string LastName,
        string? MiddleName,
        string? City,
        string? State,
        DateTime? Dob
    );
}