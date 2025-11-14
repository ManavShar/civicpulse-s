-- Migration: Initial Schema
-- Creates all tables for CivicPulse AI platform

-- Enable PostGIS extension for geographic data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Zones table (must be created first due to foreign key dependencies)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    boundary GEOGRAPHY(POLYGON) NOT NULL,
    population INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for zones
CREATE INDEX IF NOT EXISTS idx_zones_boundary ON zones USING GIST(boundary);

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sensors
CREATE INDEX IF NOT EXISTS idx_sensors_zone ON sensors(zone_id);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_location ON sensors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);

-- Sensor Readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(20),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sensor readings (optimized for time-series queries)
CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON sensor_readings(timestamp DESC);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    priority_score INTEGER NOT NULL,
    confidence NUMERIC(3,2),
    location GEOGRAPHY(POINT) NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    sensor_id UUID REFERENCES sensors(id) ON DELETE SET NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    scoring_breakdown JSONB DEFAULT '{}'::jsonb,
    detected_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for incidents (optimized for filtering and sorting)
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_zone ON incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_incidents_detected ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    predicted_timestamp TIMESTAMP NOT NULL,
    predicted_value NUMERIC NOT NULL,
    confidence NUMERIC(3,2),
    lower_bound NUMERIC,
    upper_bound NUMERIC,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_sensor ON predictions(sensor_id);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(predicted_timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON predictions(confidence DESC);

-- Work Orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    priority VARCHAR(20) NOT NULL,
    assigned_unit_id VARCHAR(50),
    location GEOGRAPHY(POINT) NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    estimated_duration INTEGER,
    estimated_completion TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for work orders
CREATE INDEX IF NOT EXISTS idx_workorders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_workorders_incident ON work_orders(incident_id);
CREATE INDEX IF NOT EXISTS idx_workorders_zone ON work_orders(zone_id);
CREATE INDEX IF NOT EXISTS idx_workorders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_workorders_assigned_unit ON work_orders(assigned_unit_id);
CREATE INDEX IF NOT EXISTS idx_workorders_created ON work_orders(created_at DESC);

-- Agent Logs table
CREATE TABLE IF NOT EXISTS agent_logs (
    id BIGSERIAL PRIMARY KEY,
    agent_type VARCHAR(50) NOT NULL,
    step VARCHAR(50) NOT NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for agent logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_type ON agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_incident ON agent_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_work_order ON agent_logs(work_order_id);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE zones IS 'Geographic zones for city subdivision';
COMMENT ON TABLE sensors IS 'IoT sensors monitoring city infrastructure';
COMMENT ON TABLE sensor_readings IS 'Time-series data from sensors';
COMMENT ON TABLE incidents IS 'Detected infrastructure problems';
COMMENT ON TABLE predictions IS 'ML-generated forecasts for sensor values';
COMMENT ON TABLE work_orders IS 'Maintenance tasks assigned to field units';
COMMENT ON TABLE agent_logs IS 'AI agent reasoning and decision logs';
COMMENT ON TABLE users IS 'System users for authentication';
