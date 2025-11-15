# Predictions Page Fix Summary

## Issues Fixed

### 1. ML Pipeline - Model Directory Path Error

**Problem**: `FileNotFoundError: [Errno 2] No such file or directory: '/app/models'`

**Root Cause**: The `.env` file had `MODEL_CACHE_DIR=/app/models` (Docker absolute path) instead of a relative path for local development.

**Fix**: Updated `ml-pipeline/.env`:

```env
MODEL_CACHE_DIR=./models  # Changed from /app/models
```

### 2. Backend - SQL Query Parameter Placeholders

**Problem**: PostgreSQL queries were failing due to incorrect parameter placeholders.

**Root Cause**: Template literals were using `${paramIndex}` instead of `$${paramIndex}`, resulting in invalid SQL like `$1` being interpreted as a variable instead of a placeholder.

**Fix**: Updated `backend/src/repositories/PredictionRepository.ts`:

- Fixed `findWithFilters()` method to use `$${paramIndex}` for proper PostgreSQL placeholders
- Fixed `createBatch()` method with correct parameter syntax

### 3. Frontend - Missing Prediction Generation UI

**Problem**: No way to manually trigger prediction generation from the UI.

**Fix**: Added to `frontend/src/pages/Predictions.tsx`:

- "Generate Predictions" button in page header
- Handler function to call batch prediction API
- Auto-refresh after 5 seconds
- User feedback with alerts

### 4. Frontend - API Client Missing Methods

**Problem**: API client didn't have methods to trigger prediction generation.

**Fix**: Added to `frontend/src/lib/api.ts`:

```typescript
predictions: {
  generate: (sensorId: string) => api.post(`/predictions/generate/${sensorId}`),
  generateBatch: () => api.post("/predictions/generate-batch"),
  // ... existing methods
}
```

### 5. Frontend - Filter Logic Bug

**Problem**: Time horizon filter wasn't working because it expected numbers but received strings like "1h", "6h".

**Fix**: Updated `frontend/src/components/predictions/PredictionList.tsx`:

```typescript
const maxHours = parseInt(filters.timeHorizon.replace(/\D/g, ""));
```

## Current Issue: Insufficient Sensor Data

### Problem

The ML pipeline logs show:

```
WARNING - Insufficient data for sensor <sensor_id>
400 Bad Request
```

### Root Cause

The ML pipeline requires **at least 50 sensor readings** per sensor to generate predictions. Your database likely has fewer readings per sensor.

### Solution

**Option 1: Generate Historical Data (Recommended)**

```bash
cd backend
npm run seed:historical
```

This will generate:

- ~2,000 readings per sensor (7 days of data at 5-minute intervals)
- Realistic patterns (daily/weekly variations)
- Sufficient data for ML predictions

**Option 2: Check Current Data**

```bash
cd backend
node check-sensor-data.js
```

This will show:

- Total sensors and readings
- Readings per sensor
- Which sensors have insufficient data

**Option 3: Lower the Threshold (Quick Fix)**
Edit `ml-pipeline/forecaster.py` line 60:

```python
if df is None or len(df) < 50:  # Change 50 to 20 or 30
```

⚠️ **Warning**: Lower thresholds may result in less accurate predictions.

## Testing the Fix

### 1. Start All Services

```bash
# Terminal 1 - ML Pipeline
cd ml-pipeline
uvicorn main:app --reload --port 8002

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### 2. Generate Historical Data (if needed)

```bash
cd backend
npm run seed:historical
```

### 3. Generate Predictions

1. Open the frontend (http://localhost:5173)
2. Navigate to Predictions page
3. Click "Generate Predictions" button
4. Wait 5 seconds for auto-refresh
5. Predictions should appear!

### 4. Test Filters

- Filter by sensor type (WASTE, LIGHT, WATER, etc.)
- Filter by confidence level (50%, 60%, 70%, etc.)
- Filter by time horizon (1h, 6h, 12h, 24h)
- Click "Apply Filters" to see results

## Files Modified

1. `ml-pipeline/.env` - Fixed model cache directory path
2. `backend/src/repositories/PredictionRepository.ts` - Fixed SQL placeholders
3. `frontend/src/pages/Predictions.tsx` - Added generation UI
4. `frontend/src/lib/api.ts` - Added API methods
5. `frontend/src/components/predictions/PredictionList.tsx` - Fixed filter logic

## New Files Created

1. `backend/check-sensor-data.js` - Utility to check sensor data counts
2. `PREDICTIONS_FIX_SUMMARY.md` - This document

## Next Steps

1. ✅ Run `npm run seed:historical` to generate sensor data
2. ✅ Verify ML pipeline is running without errors
3. ✅ Click "Generate Predictions" in the UI
4. ✅ Test filters and sorting
5. ✅ Monitor predictions table in database

## Troubleshooting

### ML Pipeline Still Shows Errors

- Check database connection in `ml-pipeline/.env`
- Verify sensors have readings: `node backend/check-sensor-data.js`
- Check ML pipeline logs for specific errors

### Predictions Not Appearing

- Check browser console for API errors
- Verify backend is running on port 4000
- Check Redis is running (required for job queue)
- Look at backend logs for prediction generation status

### Filters Not Working

- Clear browser cache
- Check that predictions have the expected fields (sensorId, confidence, predictedTimestamp)
- Verify filter values match data in database
