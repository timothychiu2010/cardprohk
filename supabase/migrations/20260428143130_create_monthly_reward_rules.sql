/*
  # Create Monthly Reward Rules Table

  1. New Tables
    - `monthly_reward_rules`
      - Stores credit card reward rules by month
      - Allows updating rates for each card per month
      - Cards: bank name, card id, category, reward rate, conditions
      - Monthly scope: applicable dates
    - `user_registered_bonuses`
      - Tracks which bonuses user has registered for
      - Links card id + bonus index to user

  2. Security
    - Enable RLS on both tables
    - Users can only see their own registered bonuses
    - Reward rules are public read-only
*/

CREATE TABLE IF NOT EXISTS monthly_reward_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id text NOT NULL,
  card_bank text NOT NULL,
  card_name text NOT NULL,
  category text NOT NULL,
  rate numeric NOT NULL,
  miles_rate numeric,
  monthly_cap integer,
  monthly_reward_cap integer,
  min_spend integer,
  description text,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_registered_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  bonus_index integer NOT NULL,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id, bonus_index)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reward_rules_card_id ON monthly_reward_rules(card_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reward_rules_valid_dates ON monthly_reward_rules(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_user_registered_bonuses_user_id ON user_registered_bonuses(user_id);

ALTER TABLE monthly_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registered_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reward rules are publicly readable"
  ON monthly_reward_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own registered bonuses"
  ON user_registered_bonuses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register bonuses for themselves"
  ON user_registered_bonuses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister bonuses"
  ON user_registered_bonuses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
