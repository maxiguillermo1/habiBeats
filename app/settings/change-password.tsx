// change-password.tsx
// Maxwell Guillermo

// START of Change Password UI/UX
// START of Maxwell Guillermo Contribution
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Keyboard } from 'react-native';
import { getAuth, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

// This file handles the password change functionality in the HabiBeats app
// It provides a user interface for users to safely update their passwords
const ChangePassword = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('alerts.error_required_fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('alerts.error_password_mismatch'));
      return;
    }

    try {
      if (auth.currentUser?.email) {
        await signInWithEmailAndPassword(auth, auth.currentUser.email, currentPassword);
        await updatePassword(auth.currentUser, newPassword);
        Alert.alert(t('common.success'), t('alerts.success_password'));
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = t('alerts.error_generic');
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('alerts.error_wrong_password');
      }
      
      setError(errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('settings.account.change_password')}</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('settings.account.current_password')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder={t('settings.account.new_password')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder={t('settings.account.confirm_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.requirementText}>
            {t('settings.account.password_requirements')}
          </Text>

          <TouchableOpacity 
            style={styles.changeButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.changeButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 150,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fba904',
    fontWeight: 'bold',
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fc6c85',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  subtitleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#0e1514',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 0,
    paddingHorizontal: 10,
    color: '#808080',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  smallerText: {
    fontSize: 12,
  },
  changeButton: {
    backgroundColor: 'rgba(121, 206, 84, 1)',
    padding: 15,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },
  changeButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  message: {
    color: '#0e1514',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'center',
  },
  requirementText: {
    fontSize: 12,
    color: '#808080',
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default ChangePassword;

// END of Change Password UI/UX
// END of Maxwell Guillermo Contribution