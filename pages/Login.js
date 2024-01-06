import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Login = ({ onAuthChange }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');


  const login = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
  
      const data = await response.json();
  
      if (response.status === 200) {
        await AsyncStorage.setItem('userData', JSON.stringify(data));
        onAuthChange();
      } else {

        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      alert('An error occurred while logging in.');
    }
  };
  
  return (
    <View style={styles.container}>
    <View style={styles.formContainer}>
      <Image source={require('../assets/gooffice_black.png')} style={styles.logo} />
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={loginEmail}
        onChangeText={setLoginEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={loginPassword}
        onChangeText={setLoginPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
formContainer: {
  width: '80%',
  backgroundColor: '#ffffff',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.25,
  shadowRadius: 28,
  elevation: 20,
},
logo: {
  resizeMode: 'contain', 
  height: 70,
  marginBottom: 20,
  alignSelf: 'center'
},
title: {
  fontSize: 24,
  marginBottom: 20,
  fontWeight: '800'
},
input: {
  height: 40,
  width: '100%',
  margin: 12,
  borderWidth: 1,
  borderColor: '#ffffff',
  backgroundColor: '#eee',
  color: '#333',
  padding: 10,
  borderRadius: 5,
},
button: {
  backgroundColor: '#1b1c23',
  padding: 10,
  width: '100%',
  borderRadius: 5,
  alignItems: 'center',
  marginTop: 12,
},
buttonText: {
  color: '#ffffff',
  fontSize: 16,
},
});

export default Login;
