using Microsoft.EntityFrameworkCore;

namespace MealMajor.API.Data;

public static class EnsureTable
{
    private static string commandQueryTableUsers = @"
CREATE TABLE Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Email TEXT NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL
)";
    public static string GetUsersTable(AppDbContext db) {
         var conn = db.Database.GetDbConnection();
        var shouldClose = conn.State != System.Data.ConnectionState.Open;

        try
        {
            if (shouldClose)
            {
                conn.Open();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='Users';";
            var exists = cmd.ExecuteScalar() != null;

            if (!exists)
            {
                return "Users table does not exist.";
            }

            var result = new System.Text.StringBuilder();
            result.AppendLine("=== Users Table Data ===");
            result.AppendLine("ID | Email | PasswordHash");
            result.AppendLine("----------------------------------------");

            using var selectCmd = conn.CreateCommand();
            selectCmd.CommandText = "SELECT Id, Email, PasswordHash FROM Users;";
            using var reader = selectCmd.ExecuteReader();
            
            var hasData = false;
            while (reader.Read())
            {
                hasData = true;
                var id = reader.GetInt32(0);
                var email = reader.GetString(1);
                //var passwordHash = reader.GetString(2);
                
                result.AppendLine($"{id} | {email} ");
            }

            if (!hasData)
            {
                result.AppendLine("No data found in Users table.");
            }

            return result.ToString();
        }
        finally
        {
            if (shouldClose)
            {
                conn.Close();
            }
        }
    }

    public static void EnsureUsersTable(AppDbContext db)
    {
        var conn = db.Database.GetDbConnection();
        var shouldClose = conn.State != System.Data.ConnectionState.Open;

        try
        {
            if (shouldClose)
            {
                conn.Open();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='Users';";
            var exists = cmd.ExecuteScalar() != null;

            if (!exists)
            {
                using var createCmd = conn.CreateCommand();
                createCmd.CommandText = commandQueryTableUsers;
                createCmd.ExecuteNonQuery();
            }
        }
        finally
        {
            if (shouldClose)
            {
                conn.Close();
            }
        }
    }
}