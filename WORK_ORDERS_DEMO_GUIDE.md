# Work Orders Demo Guide

## Overview

Work Orders are tasks created to resolve incidents detected by the system. They track the lifecycle from creation to completion.

## What Was Fixed

Previously, all work orders were seeded with **COMPLETED** status only. Now the seeding creates a realistic mix of statuses for better demo experience.

## New Work Order Distribution (After Re-seeding)

### Status Types:

- **CREATED** (~30% of recent): Just created, awaiting assignment
- **ASSIGNED** (~30% of recent): Assigned to a unit, not started yet
- **IN_PROGRESS** (~40% of recent): Currently being worked on
- **COMPLETED** (older incidents): Finished work orders

### Priority Levels:

- **LOW**: Minor issues (20-40 priority score)
- **MEDIUM**: Standard issues (40-60 priority score)
- **HIGH**: Urgent issues (60-80 priority score)
- **CRITICAL**: Emergency issues (80-100 priority score)

## How to Test Work Orders

### 1. View All Work Orders

- Navigate to **Work Orders** page
- You should see ~20-30 work orders with various statuses
- Default view shows all work orders sorted by priority

### 2. Filter by Status

Click **Filters** button and select:

- **CREATED**: See newly created work orders awaiting assignment
- **ASSIGNED**: See work orders assigned to units
- **IN_PROGRESS**: See active work orders being worked on
- **COMPLETED**: See finished work orders (historical)

### 3. Filter by Priority

Click **Filters** button and select:

- **CRITICAL**: High-priority emergencies
- **HIGH**: Urgent issues
- **MEDIUM**: Standard issues
- **LOW**: Minor issues

### 4. View Work Order Details

- Click on any work order card
- See detailed information:
  - Incident details
  - Assigned unit
  - Location on map
  - Timeline (created → assigned → started → completed)
  - Estimated completion time
  - Duration

### 5. Work Order Lifecycle

Observe the progression:

```
CREATED → ASSIGNED → IN_PROGRESS → COMPLETED
```

### 6. Integration with Incidents

- Work orders are linked to incidents
- From Incidents page, you can create new work orders
- View incident details from work order detail view

## Key Features to Demonstrate

### 1. **Real-time Status Tracking**

- Work orders update as units progress
- Status badges show current state
- Timeline shows progression

### 2. **Priority-based Sorting**

- Critical work orders appear first
- Helps operators focus on urgent tasks

### 3. **Unit Assignment**

- See which units (UNIT-1 to UNIT-20) are assigned
- Track unit workload

### 4. **Location Awareness**

- Work orders include geographic location
- Can be viewed on map
- Zone-based filtering available

### 5. **Time Estimates**

- Estimated completion times
- Actual duration tracking
- Performance metrics

## Demo Scenarios

### Scenario 1: Emergency Response

1. Filter by **CRITICAL** priority
2. Show work orders requiring immediate attention
3. Demonstrate quick assignment and tracking

### Scenario 2: Workload Management

1. View **IN_PROGRESS** work orders
2. Show active operations across the city
3. Demonstrate resource allocation

### Scenario 3: Historical Analysis

1. Filter by **COMPLETED** status
2. Show resolved incidents
3. Analyze response times and patterns

### Scenario 4: New Incident Response

1. Go to Incidents page
2. Select an active incident
3. Click "Create Work Order"
4. Show new work order in CREATED status

## Commands to Re-seed with New Work Orders

```bash
# Clear existing data and reseed with improved work orders
cd backend && npm run clear:readings
npm run seed
```

This will create:

- ~100K sensor readings (7 days, 5-min intervals)
- ~28 incidents (4 per day)
- ~20-25 work orders with mixed statuses
- Demo users and agent logs

## Expected Results After Seeding

```
Work Orders Status Breakdown:
- CREATED: 3-5 work orders
- ASSIGNED: 3-5 work orders
- IN_PROGRESS: 5-8 work orders
- COMPLETED: 8-12 work orders
```

## Troubleshooting

### No Work Orders Showing?

1. Check if filters are applied (click "Clear" button)
2. Verify data was seeded: Check database for work_orders table
3. Check browser console for API errors

### All Work Orders are COMPLETED?

- You're viewing old seeded data
- Re-run the seed command to get the new mixed statuses

### Can't Create New Work Orders?

- Ensure you're logged in as admin or operator
- Check that the incident is ACTIVE status
- Verify backend API is running

## API Endpoints

- `GET /api/work-orders` - List all work orders
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create new work order
- `PATCH /api/work-orders/:id` - Update work order status
- `GET /api/incidents/:id/work-orders` - Get work orders for incident

## What Makes a Good Demo

1. **Show the variety**: Filter through different statuses
2. **Explain the workflow**: CREATED → ASSIGNED → IN_PROGRESS → COMPLETED
3. **Highlight priorities**: Show how critical issues are handled first
4. **Demonstrate integration**: Link between incidents and work orders
5. **Show real-time updates**: Status changes and progress tracking
