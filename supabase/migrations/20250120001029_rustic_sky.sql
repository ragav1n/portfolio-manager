/*
  # Initial Schema Setup

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `dob` (date)
      - `created_at` (timestamp)

    - `portfolios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `last_updated` (timestamp)
      - `total_investments` (numeric)

    - `investments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `portfolio_id` (uuid, foreign key)
      - `asset_name` (text)
      - `type` (enum)
      - `value` (numeric)
      - `risk` (enum)
      - `sector` (text)
      - `created_at` (timestamp)

    - `analysis_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `portfolio_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `risk` (enum)
      - `prediction` (text)

    - `market_data`
      - `id` (uuid, primary key)
      - `symbol` (text)
      - `price` (numeric)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM ('Real Estate', 'Stocks', 'Bonds', 'Crypto', 'Deposits');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  dob date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  total_investments numeric DEFAULT 0 CHECK (total_investments >= 0)
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  type asset_type NOT NULL,
  value numeric NOT NULL CHECK (value >= 0),
  risk risk_level NOT NULL,
  sector text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create analysis_reports table
CREATE TABLE IF NOT EXISTS analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  risk risk_level NOT NULL,
  prediction text NOT NULL
);

-- Create market_data table
CREATE TABLE IF NOT EXISTS market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  price numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
DO $$ BEGIN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
    ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies (wrapped in DO block to handle existing policies)
DO $$ BEGIN
    CREATE POLICY "Users can read own profile"
      ON user_profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile"
      ON user_profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can read own portfolios"
      ON portfolios FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own portfolios"
      ON portfolios FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own portfolios"
      ON portfolios FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can read own investments"
      ON investments FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own investments"
      ON investments FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own investments"
      ON investments FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own investments"
      ON investments FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can read own analysis reports"
      ON analysis_reports FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own analysis reports"
      ON analysis_reports FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Everyone can read market data"
      ON market_data FOR SELECT
      TO authenticated
      USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_portfolio_id ON investments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_portfolio_id ON analysis_reports(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);