# Staff accounts / Comptes du personnel

The kitchen, rider and admin apps ask staff to sign in with an email and a password
(Supabase Auth). What each person can see and do depends on their **role** in the
`public.staff` table:

| Role      | Kitchen app | Rider app                       | Admin app |
| --------- | ----------- | ------------------------------- | --------- |
| `kitchen` | yes         | no                              | no        |
| `rider`   | no          | only their own deliveries       | no        |
| `admin`   | yes         | yes (every delivery on the way) | yes       |

The database enforces this (row level security and the SQL functions), not only the apps.

## Once: turn off public sign-up

Staff accounts are only created by the owner. In the Supabase dashboard → Authentication →
Sign In / Providers, turn off **Allow new users to sign up**. (Even if someone signs up, they see
nothing without a row in `public.staff`, but there is no reason to allow it.)

## Add a staff member

1. Supabase dashboard → project **jollofco** → Authentication → Users → **Add user** →
   "Create new user": email + password, tick **Auto confirm user**.
2. SQL editor, give them a name and a role:

   ```sql
   insert into public.staff (user_id, name, role)
   select id, 'Awa', 'kitchen' from auth.users where email = 'awa@example.com';
   ```

3. They sign in to their app with that email and password.

## Staff without an email address

The address is only a login name: Supabase sends nothing to it when "Auto confirm user" is ticked.
Use a made-up one such as `moussa@staff.jollofco`. "Forgot password" can't work for these
accounts, so the owner resets the password in Authentication → Users.

## Remove access

Change or remove their row, then delete the user in Authentication → Users:

```sql
update public.staff set role = 'rider' where name = 'Awa';      -- change role
```

## FR

Une seule fois : Authentication → Sign In / Providers → désactiver **Allow new users to sign up**.

Ajouter quelqu'un :

1. Tableau de bord Supabase → projet **jollofco** → Authentication → Users → **Add user** :
   e-mail + mot de passe, cocher **Auto confirm user**.
2. Dans l'éditeur SQL, la requête ci-dessus avec son nom et son rôle (`kitchen` = cuisine,
   `rider` = livreur, `admin` = administration).
3. La personne se connecte à son app avec cet e-mail et ce mot de passe.

Sans adresse e-mail : inventez-en une comme `moussa@staff.jollofco` (elle sert seulement
d'identifiant). En cas d'oubli, changez le mot de passe dans Authentication → Users.
