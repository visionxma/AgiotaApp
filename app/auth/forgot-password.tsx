import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, ArrowLeft, Key } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/utils/authNative';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (!authService.validateEmail(email)) {
      setError('Email inválido');
      return false;
    }

    setError('');
    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) return;

    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email);

      if (result.success) {
        Alert.alert(
          'Email Enviado',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      Alert.alert('Erro', 'Falha ao enviar email. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
          <Key size={48} color="#1e40af" />
          <Text style={styles.title}>Esqueci minha senha</Text>
          <Text style={styles.subtitle}>
            Digite seu email para receber instruções de recuperação
          </Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6b7280" style={styles.inputIcon} />
            <Input
              label="Email *"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) {
                  setError('');
                }
              }}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
              accessibilityLabel="Campo de email"
              accessibilityHint="Digite o email da sua conta"
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Enviaremos um email com instruções para redefinir sua senha.
            </Text>
          </View>

          <Button
            title={isSubmitting ? 'Enviando...' : 'Enviar Instruções'}
            onPress={handleForgotPassword}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        </Card>

        <View style={styles.backToLoginContainer}>
          <Text style={styles.backToLoginText}>Lembrou da senha?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.backToLoginLink}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 38,
    zIndex: 1,
  },
  infoContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  backToLoginLink: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
});