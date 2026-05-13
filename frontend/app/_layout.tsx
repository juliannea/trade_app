import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { JwtPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
// import { View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export const unstable_settings = {
  anchor: '(tabs)',
};

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fafafa',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [claims, setClaims] = useState<JwtPayload | null>(null);

  useEffect(() => {
    //checks if the user is signed in when app first starts
    supabase.auth.getClaims().then(({ data }) => { 
      setClaims(data?.claims ?? null);
    });

    //listens for changes in user's auth state: logged in or out 
    supabase.auth.onAuthStateChange(() => { 
      supabase.auth.getClaims().then(({ data }) => {
        setClaims(data?.claims ?? null);
      });
    });
  }, []);

  if (!claims) { //if user is not logged in show sign in/up screen
    return <Auth />;
  }

  return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={AppTheme}>
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
 
  </GestureHandlerRootView>
   );
}
