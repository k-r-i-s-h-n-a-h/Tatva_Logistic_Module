from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.calculator import LogisticsCalculator

app = FastAPI(title="Tatvaops Smart Engine API")

# Allow the Node.js frontend to talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/calculate")
async def calculate_route(payload: dict):
    try:
        print(f"--> Received calculation request for: {payload['order_details']['service_category']}")
        
        # Run the calculator
        calc = LogisticsCalculator(payload)
        smart_metrics = calc.calculate_metrics()
        
        return {
            "status": "success",
            "metrics": smart_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))