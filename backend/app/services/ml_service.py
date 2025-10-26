import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta

def predict_completion_date(transactions: list, goal_amount: float):
    df = pd.DataFrame(transactions)

    if "status" in df.columns:
        df = df[df["status"].isin(["approved"])]
        if df.empty:
            return {"error": "No approved transactions yet."}
    
    df['createdAt'] = pd.to_datetime(df['createdAt'])
    df = df.sort_values(by='createdAt')
    df['total_amount'] = df['amount'].cumsum()
    df['days_since_start'] = (df['createdAt'] - df['createdAt'].iloc[0]).dt.days
    
    x = df[['days_since_start']].values
    y = df['total_amount'].values

    # too little data or goal already reached
    if len(df) < 2 or y[-1] >= goal_amount:
        return {
            "predicted_completion_date": None,
            "current_rate": None,
            "days_remaining": 0,
            "message": "Goal already reached or insufficient data."
        }

    model = LinearRegression()
    model.fit(x,y)

    slope = model.coef_[0]
    intercept = model.intercept_

    # negative rate
    if slope <= 0:
        return {
            "predicted_completion_date": None,
            "current_rate": round(slope, 2),
            "days_remaining": None,
            "message": "No positive saving trend detected."
        }

    days_to_goal = (goal_amount - intercept) / slope
    predicted_date = df['createdAt'].iloc[0] + timedelta(days=int(days_to_goal))

    return {
        "predicted_completion_date": predicted_date.date(),
        "current_rate": round(slope, 2),
        "message": f"At your current pace, you'll reach your goal by {predicted_date.date()}."
    }

# example
if __name__ == "__main__":
    sample_transactions = [
        {"amount": 100, "createdAt": "2024-01-01", "status": "approved"},
        {"amount": 150, "createdAt": "2024-01-10", "status": "approved"},
        {"amount": 200, "createdAt": "2024-01-20", "status": "approved"},
        {"amount": 250, "createdAt": "2024-01-30", "status": "approved"},
    ]
    goal = 2000
    result = predict_completion_date(sample_transactions, goal)
    print(result)