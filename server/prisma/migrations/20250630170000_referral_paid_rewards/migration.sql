CREATE TABLE IF NOT EXISTS referral_paid_rewards (
  referred_user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_kind VARCHAR(16) NOT NULL,
  pro_days_granted INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_paid_rewards_referrer_user_id_idx
  ON referral_paid_rewards(referrer_user_id);
