-- Insert dummy data for demonstration
-- Using NULL user_id for publicly visible demo data
INSERT INTO public.mentions (user_id, content, source, sentiment, sentiment_score, user_name, platform_user_id, suggested_response, timestamp) VALUES
  (NULL, 'This product exceeded all my expectations! The quality is outstanding and customer service was fantastic.', 'Twitter', 'positive', 0.95, 'sarah_tech', 'twitter_12345', NULL, NOW() - INTERVAL '2 hours'),
  (NULL, 'Absolutely love it! Been using it for 3 months now and it just keeps getting better. Highly recommend!', 'Reddit', 'positive', 0.92, 'happy_user_2024', 'reddit_abc123', NULL, NOW() - INTERVAL '5 hours'),
  (NULL, 'Best purchase I made this year. Worth every penny. The attention to detail is remarkable.', 'Google Reviews', 'positive', 0.89, 'Jennifer M.', NULL, NULL, NOW() - INTERVAL '1 day'),
  (NULL, 'Pretty decent overall. Does what it says on the tin. Nothing extraordinary but solid.', 'Twitter', 'neutral', 0.55, 'tech_reviewer', 'twitter_67890', NULL, NOW() - INTERVAL '3 hours'),
  (NULL, 'It''s okay I guess. Not bad but not amazing either. Gets the job done.', 'Reddit', 'neutral', 0.50, 'average_joe_123', 'reddit_def456', NULL, NOW() - INTERVAL '8 hours'),
  (NULL, 'Meh. Expected more based on the reviews. It''s functional but nothing special.', 'Google Reviews', 'neutral', 0.48, 'Alex P.', NULL, NULL, NOW() - INTERVAL '12 hours'),
  (NULL, 'Terrible experience! The app crashes constantly and I lost all my data. Customer support is non-responsive.', 'Twitter', 'negative', 0.12, 'frustrated_customer', 'twitter_99999', 'Thank you for bringing this to our attention. We sincerely apologize for the frustrating experience you''ve had with app crashes and data loss. This is absolutely not the experience we want our customers to have. Please DM us your account details so our technical team can investigate this immediately and help recover your data.', NOW() - INTERVAL '30 minutes'),
  (NULL, 'Completely disappointed. Paid premium price for buggy software. Would not recommend to anyone.', 'Reddit', 'negative', 0.18, 'buyer_beware', 'reddit_xyz789', 'We''re truly sorry to hear about your disappointing experience. Quality is our top priority, and we clearly fell short. We''d like to make this right - please contact our support team so we can address the bugs you''re experiencing and discuss compensation options.', NOW() - INTERVAL '1 hour'),
  (NULL, 'Worst customer service ever. Been waiting 2 weeks for a response to my support ticket. Unacceptable!', 'Google Reviews', 'negative', 0.08, 'Mike R.', NULL, 'We sincerely apologize for the delayed response to your support ticket. A 2-week wait is unacceptable, and we''re taking immediate steps to address this. I''ve escalated your case to our management team who will contact you within 24 hours to resolve your issue.', NOW() - INTERVAL '4 hours'),
  (NULL, 'Game changer! This has revolutionized how we work. The whole team is impressed.', 'Twitter', 'positive', 0.97, 'business_pro', 'twitter_54321', NULL, NOW() - INTERVAL '6 hours'),
  (NULL, 'Buggy update broke several features. Very frustrating. Please fix ASAP!', 'Reddit', 'negative', 0.22, 'power_user_87', 'reddit_bug123', 'We apologize for the issues caused by the recent update. Our development team is aware of the bugs affecting these features and is working on a hotfix that will be released within the next 48 hours. Thank you for your patience.', NOW() - INTERVAL '15 minutes'),
  (NULL, 'Good value for money. Does everything I need without any fuss.', 'Google Reviews', 'positive', 0.82, 'David L.', NULL, NULL, NOW() - INTERVAL '18 hours');

-- Update the SELECT policy to include demo data (where user_id IS NULL)
DROP POLICY IF EXISTS "Users can view their own mentions" ON public.mentions;

CREATE POLICY "Users can view their own mentions and demo data"
  ON public.mentions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);