-- Removes all demo suppliers and their listings (profiles and listings are deleted with the user).
delete from auth.users where email like '%@demo.naijabulk.test';
