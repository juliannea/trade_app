import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView  } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@rneui/themed'

type Mode = 'login' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  //fields for signing up 
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    //make sure user inputs username 
    if (!userName.trim()) {
      Alert.alert('Username is required');
      return;
    }

    setLoading(true)
    const {
      data: { session },
      error:  signUpError,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    
    if (signUpError) {
      Alert.alert(signUpError.message);
      setLoading(false);
      return;
    }

    if (!session) {
      Alert.alert('session error');
      setLoading(false);
      return;
    }

    //update the user table with the sign up info 
    const { error: updateError } = await supabase
      .from('User')
      .update({
        user_name:       userName.trim(),
        user_first_name: firstName.trim() || null,
        user_last_name:  lastName.trim()  || null,
        user_phone:      phone.trim()     || null,
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      Alert.alert('account created but profile update failed', updateError.message);
    }

    setLoading(false);

  }
  const isSignup = mode === 'signup';


  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
      <Text style={styles.subtitle}>
        {isSignup ? 'Sign up to start trading collectibles!' : 'Sign in to your account'}
      </Text>

      {/* check if new user siging up */}
      {isSignup && (
        <>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="First Name"
                onChangeText={setFirstName}
                value={firstName}
                placeholder="e.g. Sam"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Last Name"
                onChangeText={setLastName}
                value={lastName}
                placeholder="e.g. Smith"
              />
            </View>
          </View>
          <View style={styles.field}>
            <Input
              label="Username *"
              onChangeText={setUserName}
              value={userName}
              placeholder="e.g. labubu_lover99"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Phone Number"
              onChangeText={setPhone}
              value={phone}
              placeholder="e.g. 212-555-0199"
              keyboardType="phone-pad"
            />
          </View>
        </>
      )}

    
      <View style={styles.field}>
        <Input
          label="Email"
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.field}>
        <Input
          label="Password"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Button
          title={isSignup ? 'Sign Up' : 'Sign In'}
          disabled={loading}
          onPress={isSignup ? signUpWithEmail: signInWithEmail}
        />
      </View>

      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => setMode(isSignup ? 'login' : 'signup')}
      >
        <Text style={styles.toggleText}>
          {isSignup
            ? 'Already have an account? '
            : "Don't have an account? "}
          <Text style={styles.toggleLink}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  field: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfField: {
    flex: 1,
  },
  toggleContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#888',
  },
  toggleLink: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
