import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 30, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const bgColor = isSuccess ? '#064e3b' : isError ? '#881337' : '#1e1b4b';
  const borderColor = isSuccess ? '#10b981' : isError ? '#f43f5e' : '#6366f1';
  const accentColor = isSuccess ? '#34d399' : isError ? '#fb7185' : '#818cf8';
  const labelText = isSuccess ? 'BERHASIL' : isError ? 'PERINGATAN SISTEM' : 'INFORMASI';
  const iconSymbol = isSuccess ? '✓' : isError ? '⚠️' : 'ℹ️';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity onPress={hide} activeOpacity={0.9} style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: `${borderColor}33` }]}>
          <Text style={[styles.icon, { color: accentColor }]}>{iconSymbol}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: accentColor }]}>{labelText}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <Text style={styles.closeBtn}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [state, setState] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setState({ message, type, visible: true });
  };

  const hideToast = () => {
    setState((prev) => ({ ...prev, visible: false }));
  };

  return { toast: state, showToast, hideToast };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 2,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '900',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  message: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  closeBtn: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '800',
    padding: 4,
  },
});
