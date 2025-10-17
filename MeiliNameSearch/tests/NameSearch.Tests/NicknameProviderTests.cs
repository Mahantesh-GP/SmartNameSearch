using System;
using System.IO;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using Shouldly;
using Xunit;
using NameSearch.Infrastructure.Services;

namespace NameSearch.Tests
{
    public class NicknameProviderTests
    {
        [Fact]
        public void LoadsNicknamesFromJsonFile()
        {
            // Use the repository-relative path used by the provider when env var is not set
            var repoBase = AppContext.BaseDirectory;
            // The test runs from the test bin folder; construct path to repository root
            // Walk up until we find the solution folder or tools directory
            var dir = new DirectoryInfo(repoBase);
            while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "tools")))
            {
                dir = dir.Parent;
            }
            dir.ShouldNotBeNull();
            var dictPath = Path.Combine(dir.FullName, "tools", "dictionaries", "nicknames.json");
            File.Exists(dictPath).ShouldBeTrue("Expected nicknames.json to exist in tools/dictionaries");

            var config = new ConfigurationManager();
            config["NICKNAMES_PATH"] = dictPath;

            var provider = new NicknameProvider(config);

            // Verify mapping exists in the dictionary: the JSON maps canonical->nicknames
            // For example, 'bill' should map to include 'william'
            var result = provider.GetNicknames("bill");
            result.ShouldNotBeNull();
            result.Count.ShouldBeGreaterThan(0);
            result.ShouldContain(x => string.Equals(x, "william", StringComparison.OrdinalIgnoreCase));
        }
    }
}
