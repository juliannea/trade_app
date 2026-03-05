import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView  } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@rneui/themed'

type Mode = 'login' | 'signup';

function Sparkle({ size = 20, style }: { size?: number; style?: object }) {
  return (
    <Text style={[{ fontSize: size, position: 'absolute', color: '#f9a8d4' }, style]}>✦</Text>
  );
}

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
    
    <View style={styles.background}>
      {/* Soft blob shapes for layered blush background */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />
      <View style={styles.blobCenter} />

      {/* Sparkle accents scattered around */}
      <Sparkle size={22} style={{ top: 62,  left: 32,  opacity: 0.75 }} />
      <Sparkle size={14} style={{ top: 88,  left: 58,  opacity: 0.5  }} />
      <Sparkle size={18} style={{ top: 58,  right: 42, opacity: 0.65 }} />
      <Sparkle size={12} style={{ top: 112, right: 62, opacity: 0.4  }} />
      <Sparkle size={16} style={{ bottom: 130, left: 28,  opacity: 0.55 }} />
      <Sparkle size={20} style={{ bottom: 210, right: 32, opacity: 0.6  }} />
      <Sparkle size={12} style={{ bottom: 170, right: 58, opacity: 0.4  }} />
      <Sparkle size={10} style={{ bottom: 80,  left: 60,  opacity: 0.35 }} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isSignup ? 'Create Account' : 'Welcome to Delulu Exchange!'}</Text>
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
            buttonStyle={{ backgroundColor: '#6b21a8', borderRadius: 25 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#fce4ec',
    overflow: 'hidden',
  },
  blobTopLeft: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#a78bca',
    opacity: 0.2, top: '-10%', left: '-20%',
  },
  blobBottomRight: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#a78bca',
    opacity: 0.2, bottom: '-10%', right: '-20%',
  },
  blobCenter: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#a78bca',
    opacity: 0.2, top: '35%', left: '35%',
  },
  container: {
    padding: 20,
    paddingTop: 80,
    // backgroundColor: '#fdf6f0',
    flexGrow: 1,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#6b21a8',
  },
  subtitle: {
    fontSize: 14,
    color: '#a78bca',
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
    color: '#a78bca',
  },
  toggleLink: {
    color: '#6b21a8',
    fontWeight: '600',
  },
});
