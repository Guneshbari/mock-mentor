-- Update the handle_new_user function to be more robust
-- It will now check for both 'full_name' (used by our signup page) and 'name' (used by some OAuth providers)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, profile_image_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- One-time sync for existing users who might have empty names but have it in their auth metadata
-- This is a safe way to backfill missing names in the public.users table
do $$
declare
    user_record record;
begin
    for user_record in select id, raw_user_meta_data from auth.users where raw_user_meta_data->>'full_name' is not null or raw_user_meta_data->>'name' is not null loop
        update public.users
        set name = coalesce(user_record.raw_user_meta_data->>'full_name', user_record.raw_user_meta_data->>'name')
        where id = user_record.id and (name is null or name = '');
    end loop;
end $$;
