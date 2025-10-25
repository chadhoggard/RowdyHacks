"""
TrustVault API - Main Application
Joint investment platform for underserved communities
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_routes, group_routes, transaction_routes

# Initialize FastAPI app
app = FastAPI(
    title="TrustVault API",
    description="Joint investment platform with group savings and democratic voting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth_routes.router)
app.include_router(group_routes.router)
app.include_router(transaction_routes.router)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "TrustVault API"
    }


@app.get("/")
def root():
    """Root endpoint with API info"""
    return {
        "message": "TrustVault API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
