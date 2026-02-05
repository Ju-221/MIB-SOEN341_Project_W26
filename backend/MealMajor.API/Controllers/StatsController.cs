using MealMajor.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MealMajor.API.Controllers;

[ApiController]
[Route("stats")]
public class StatsController : ControllerBase 
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    
    [HttpGet("user-table-db")]
    [Authorize]
    public IActionResult GetTable()
    {
        var tableData = EnsureTable.GetUsersStringTable(_context);
        Console.WriteLine("Fetching Users table data...\n" + tableData);
        return Ok(tableData);
    }
    
    [HttpGet("user-json-db")]
    [Authorize]
    public IActionResult GetJsonTable()
    {
        var tableData = EnsureTable.GetUsersJSON(_context);
        Console.WriteLine("Fetching Users table data...\n" + tableData);
        return Ok(tableData);
    }
}
