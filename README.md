# Trading App for Collectibles 

## Authentication 
### Supabase Auth Set-Up 
We used Supabase's React Native authentication guide: https://supabase.com/docs/guides/auth/quickstarts/react-native to implement authentication with our app 

### Supabase Row-Level Security 
We used Supabase's Row Level Security documentation guide: https://supabase.com/docs/guides/database/postgres/row-level-security to create table policies that control who can read and write data in each table based on the user who's logged in.


## Deployment

Our backend is deployed on Render at:
```
https://trade-app-gjde.onrender.com
```

> [!NOTE]
>The free tier spins down after 15 minutes of inactivity. The first request may take 30-60 seconds to wake up. Hit `/health` before demoing.

To use the deployed backend instead of localhost, update `frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://trade-app-gjde.onrender.com

```
