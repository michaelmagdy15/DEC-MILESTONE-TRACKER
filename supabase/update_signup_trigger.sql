-- This updates the trigger to use the metadata provided during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.engineers (id, name, role, hourly_rate, weekly_goal_hours)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'Engineer'),
    COALESCE(CAST(NULLIF(new.raw_user_meta_data->>'hourly_rate', '') AS numeric), 0),
    COALESCE(CAST(NULLIF(new.raw_user_meta_data->>'weekly_goal_hours', '') AS integer), 40)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
