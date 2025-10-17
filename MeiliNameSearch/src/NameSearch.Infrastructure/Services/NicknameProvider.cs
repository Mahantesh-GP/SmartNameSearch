using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using NameSearch.Domain.Entities;

namespace NameSearch.Infrastructure.Services
{
    /// <summary>
    /// Provides nickname expansions for given first names based on a JSON dictionary.
    /// The dictionary should map a canonical name to an array of known nicknames.
    /// </summary>
    public class NicknameProvider
    {
        private readonly Dictionary<string, List<string>> _nicknameMap;

        public NicknameProvider(IConfiguration configuration)
        {
            var filePath = configuration["NICKNAMES_PATH"];
            if (string.IsNullOrWhiteSpace(filePath))
            {
                // Fall back to a relative path within the app folder. This allows the
                // dictionary to be resolved when running inside Docker.
                filePath = Path.Combine(AppContext.BaseDirectory, "tools", "dictionaries", "nicknames.json");
            }
            _nicknameMap = LoadNicknameDictionary(filePath);
        }

        /// <summary>
        /// Returns a list of nicknames associated with the given first name. Includes
        /// the original name in the returned list for convenience.
        /// </summary>
        /// <param name="firstName">The canonical first name.</param>
        public IReadOnlyList<string> GetNicknames(string firstName)
        {
            if (string.IsNullOrWhiteSpace(firstName)) return Array.Empty<string>();
            var key = firstName.ToLowerInvariant();
            if (_nicknameMap.TryGetValue(key, out var list))
            {
                // Prepend the canonical name if not already present.
                var result = new List<string>(list.Count + 1);
                if (!list.Contains(firstName, StringComparer.OrdinalIgnoreCase))
                {
                    result.Add(firstName);
                }
                result.AddRange(list);
                return result;
            }
            return new List<string> { firstName };
        }

        private static Dictionary<string, List<string>> LoadNicknameDictionary(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    // Deserialize into Dictionary<string, string[]>
                    var raw = JsonSerializer.Deserialize<Dictionary<string, string[]>>(json) ?? new();
                    // Normalize keys and values to lower-case for case-insensitive lookups.
                    return raw.ToDictionary(
                        pair => pair.Key.ToLowerInvariant(),
                        pair => pair.Value
                                   .Where(v => !string.IsNullOrWhiteSpace(v))
                                   .Select(v => v.Trim())
                                   .ToList(),
                        StringComparer.OrdinalIgnoreCase);
                }
            }
            catch (Exception)
            {
                // Ignore parsing errors and fall back to empty dictionary.
            }
            return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        }
    }
}