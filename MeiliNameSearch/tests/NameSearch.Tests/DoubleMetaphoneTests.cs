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
        [InlineData("", "")] // empty string returns null codes in encoder
        [InlineData(null, "")] // null returns null codes in encoder
        public void Compute_Should_Return_First_Letter_Uppercase(string word, string expected)
        {
            var dm = new DoubleMetaphoneEncoder();
            (string? primary, string? alternate) = dm.Encode(word ?? string.Empty);

            if (string.IsNullOrEmpty(word))
            {
                primary.ShouldBeNull();
                alternate.ShouldBeNull();
                return;
            }

            primary.ShouldNotBeNull();
            primary![0].ToString().ShouldBe(expected);
        }
    }
}