using Microsoft.EntityFrameworkCore; // contains the methods that help communicate with the db
using MealMajor.API.Models; // getting the data models 

namespace MealMajor.API.Data;

public class AppDbContext : DbContext // inherit from dbcontext 
{
    // shoudln't worry much about the parameter its is essentially an iidentifier for the db argument passed
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {

    }

    public DbSet<User> Users {get;set;}
}
