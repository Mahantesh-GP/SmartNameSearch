using Lucene.Net.Analysis.Phonetic.Language;

namespace NameSearch.Infrastructure.Services
{
    public interface IPhoneticEncoder
    {
        (string? primary, string? alternate) Encode(string? term);
    }

    public class DoubleMetaphoneEncoder : IPhoneticEncoder
    {
        private readonly DoubleMetaphone _dm;

        public DoubleMetaphoneEncoder(bool useAlternate = true, int maxCodeLen = 4)
        {
            _dm = new DoubleMetaphone { MaxCodeLen = maxCodeLen };
            _useAlternate = useAlternate;
        }

        private readonly bool _useAlternate;

        public (string? primary, string? alternate) Encode(string? term)
        {
            if (string.IsNullOrWhiteSpace(term)) return (null, null);
            term = term.Trim();
            var primary = _dm.GetDoubleMetaphone(term);
            var alternate = _useAlternate ? _dm.Encode(term) : null;
            return (string.IsNullOrWhiteSpace(primary) ? null : primary,
                    string.IsNullOrWhiteSpace(alternate) ? null : alternate);
        }
    }
}
