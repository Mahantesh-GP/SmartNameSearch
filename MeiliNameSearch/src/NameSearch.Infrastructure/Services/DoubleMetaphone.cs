namespace NameSearch.Infrastructure.Services
{
    /// <summary>
    /// Placeholder implementation of the Double Metaphone algorithm. In a production
    /// implementation you would replace this with a full implementation that
    /// calculates primary and secondary phonetic keys for a given word. For the
    /// purposes of this skeleton, it returns the uppercase initial letter of
    /// the input for both keys.
    /// </summary>
    public class DoubleMetaphone
    {
        /// <summary>
        /// Computes the primary and alternate phonetic codes for the specified word.
        /// </summary>
        /// <param name="word">The word to compute codes for.</param>
        /// <returns>A tuple containing the primary and alternate codes.</returns>
        public (string Primary, string Alternate) Compute(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return (string.Empty, string.Empty);
            }
            var letter = char.ToUpperInvariant(word[0]).ToString();
            return (letter, letter);
        }
    }
}