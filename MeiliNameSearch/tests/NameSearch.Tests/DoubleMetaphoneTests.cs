using NameSearch.Infrastructure.Services;
using Shouldly;
using Xunit;

namespace NameSearch.Tests
{
    public class DoubleMetaphoneTests
    {
        [Theory]
        [InlineData("Smith", "S")]
        [InlineData("morrison", "M")]
        [InlineData("", "")] // empty string returns empty codes
        [InlineData(null, "")] // null returns empty codes
        public void Compute_Should_Return_First_Letter_Uppercase(string word, string expected)
        {
            var dm = new DoubleMetaphone();
            var (primary, alternate) = dm.Compute(word ?? string.Empty);
            primary.ShouldBe(expected);
            alternate.ShouldBe(expected);
        }
    }
}