# Contributing to Meal Major

## Overview

Meal Major is a .NET 10 application built with modern architecture principles. This guide will help you get started with development.

## Getting Started

### Prerequisites
- .NET 10 SDK
- VSCode with C# extensions OR Visual Studio 2022+
- Git (hub) 
- "appsettings.json.example"

### Setup
1. Clone the repository
2. Make sure you have your own branch for new features
3. Run 'dotnet restore' to install dependencies
4. Configure your 'appsettings.Development.json' file with required Supabase keys (contact DevOps for file)
5. When ready to submit, do a pull request to DEV, never pr to the MAIN

## Architecture

This project follows a layered architecture:

| Layer | Responsibility |
|-------|-----------------|
| **program.cs** | Configuration, logging, and dependency injection only |
| **Controllers** | Routing and API endpoint definitions |
| **Models** | Core data structures |
| **DTOs** | Data transfer objects for API contracts |
| **Services** | Business logic implementation |

## Code Standards

- Keep `.cs` files under 300 lines for readability
- Break larger files into smaller, focused modules
- Follow C# naming conventions and OOP
- Please use camelCase for naming I beg you

## Important Notes

- This project is under active development and subject to rapid changes
- Always pull the latest changes before starting work
- Check open issues and pull requests before starting new work

**Meal Major Beta 0.1** MIB © 2026 All rights reserved