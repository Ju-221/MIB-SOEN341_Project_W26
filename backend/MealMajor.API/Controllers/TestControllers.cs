using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc; // model view controller architecture 

namespace MealMajor.API.Controllers;

[ApiController]
// the route is determined by the class name Controller -> test
[Route("[Controller]")]
public class TestController: ControllerBase
{
    // Get: /Test/public
    [HttpGet("public")]
    public IActionResult GetPublic()
    {
        return Ok(new {message = "This is a public endpoint. Anyone can see this."});

    }

    // Get: /Test/protected
    [HttpGet("protected")]
    [Authorize] // <-- this attribute makes it Members only chceks jwt
    public IActionResult GetProtected()
    {
        // minus 300 aura points for whimsy messages GPT generated.
        return Ok( new {message = "You are authenticated! This is a protected endpoint."});
    }
}