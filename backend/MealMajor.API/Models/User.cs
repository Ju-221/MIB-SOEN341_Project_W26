using System.ComponentModel.DataAnnotations; // allows you to write annotations to define limits for each property (column in user table you make )

namespace MealMajor.API.Models; // defines a namespace to avoid naming conflicts by using full qualification

public class User {
    public int Id {get; set;}

    [Required]
    [EmailAddress]
    public string Email {get; set;} = string.Empty; // avoid email from being null to reduce checks

    [Required]
    public string passwordHash {get; set;} = string.Empty;
}

