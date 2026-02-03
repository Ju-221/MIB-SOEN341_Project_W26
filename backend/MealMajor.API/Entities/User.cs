using System.ComponentModel.DataAnnotations; // allows you to write annotations to define limits for each property (column in user table you make )

namespace MealMajor.API.Entities; // defines a namespace to avoid naming conflicts by using full qualification

//TODO : we should probably start here defining more properties for the user such as name, address, etc. 
//       and making sure OOP is being followed properly.

public class User {
    public string Id {get; set;}

    [Required]
    [EmailAddress]
    public string Email {get; set;} = string.Empty; // avoid email from being null to reduce checks

    [Required]
    public string passwordHash {get; set;} = string.Empty;

    // public static implicit operator User(User v) //honestly what were you trying to do here GPT...
    // {
    //     throw new NotImplementedException();
    // }
}

