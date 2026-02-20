import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Test() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('User').select('*');
      console.log('data:', data);
      console.log('error:', error);
    }
    testConnection();
  }, []);

  return (
    <View>
      <Text>Testing Supabase Connection...</Text>
    </View>
  );
}