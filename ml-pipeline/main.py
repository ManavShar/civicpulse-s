"""
CivicPulse AI ML Pipeline Entry Point
This file will be implemented in subsequent tasks
"""

from fastapi import FastAPI

app = FastAPI(title="CivicPulse AI ML Pipeline")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-pipeline"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
