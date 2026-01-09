# TracBoard Dashboard Setup Script for Windows

Write-Host "Setting up TracBoard Dashboard..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
    
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "Error: Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Setting up database..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "Please edit .env and add your GEMINI_API_KEY" -ForegroundColor Yellow
    } else {
        Write-Host "Warning: .env.example not found. Please create .env manually." -ForegroundColor Yellow
    }
}

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Pushing database schema..." -ForegroundColor Yellow
npx prisma db push

Write-Host "Setup complete! Run 'npm run dev' to start the development server." -ForegroundColor Green
