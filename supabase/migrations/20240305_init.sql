-- Create tables for log processing system

-- Table for storing uploaded log files
CREATE TABLE log_files (
  id SERIAL PRIMARY KEY,
  file_id UUID NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL, -- 'uploaded', 'processing', 'completed', 'failed'
  processed_lines INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table for storing individual log entries
CREATE TABLE log_entries (
  id SERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES log_files(file_id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing log level statistics
CREATE TABLE log_stats (
  level TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing time distribution of logs
CREATE TABLE log_time_distribution (
  hour INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_log_entries_file_id ON log_entries(file_id);
CREATE INDEX idx_log_entries_level ON log_entries(level);
CREATE INDEX idx_log_entries_timestamp ON log_entries(timestamp);

-- Function to get hourly distribution of logs
CREATE OR REPLACE FUNCTION get_hourly_log_distribution()
RETURNS TABLE (hour INTEGER, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM timestamp)::INTEGER AS hour,
    COUNT(*)::BIGINT AS count
  FROM 
    log_entries
  GROUP BY 
    hour
  ORDER BY 
    hour;
END;
$$ LANGUAGE plpgsql;

