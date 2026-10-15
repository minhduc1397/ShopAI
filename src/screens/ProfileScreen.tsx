import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';
import { COLORS, SIZES } from '@constants/theme';
import { API_BASE_URL, APP_ENV, APP_VERSION } from '@constants/env';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthStore } from '@store/useAuthStore';
import { monitoring } from '@services/monitoring';
import { formatCompactVnd } from '@utils/formatCurrency';
import { setHapticsEnabled } from '@utils/haptics';

type Me = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

const initials = (name: string | null, email: string) => {
  const source = (name ?? email).trim();
  const parts = source.split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark, toggleTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const [haptics, setHaptics] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await axiosClient.get<Me>('/api/auth/me')).data,
  });

  const confirmLogout = () =>
    Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để mua hàng.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);

  const Row = ({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) => (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textLight }]} numberOfLines={1}>
        {value ?? (onPress ? '›' : '')}
      </Text>
    </Pressable>
  );

  const events = monitoring.getEvents();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Thẻ hồ sơ */}
        <View style={[styles.profile, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{me ? initials(me.name, me.email) : '…'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{isLoading ? 'Đang tải…' : (me?.name ?? 'Khách hàng ShopAI')}</Text>
            <Text style={styles.email}>{me?.email ?? ''}</Text>
            {me && (
              <Text style={styles.since}>
                Thành viên từ {new Date(me.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{me?.orderCount ?? '—'}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Đơn đã đặt</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {me ? formatCompactVnd(me.totalSpent) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Đã thanh toán</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.textLight }]}>CÀI ĐẶT</Text>
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>🌙 Giao diện tối</Text>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>📳 Rung phản hồi</Text>
            <Switch
              value={haptics}
              onValueChange={(v) => {
                setHaptics(v);
                setHapticsEnabled(v);
              }}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
          <Row label="🧾 Đơn hàng của tôi" onPress={() => navigation.navigate('Orders')} />
          <Row
            label="✨ Hỏi trợ lý AI"
            onPress={() => navigation.navigate('HomeTab', { screen: 'AIChat' })}
          />
        </View>

        <Text style={[styles.section, { color: colors.textLight }]}>HỌC TẬP & KỸ THUẬT</Text>
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          <Row
            label="🧩 Demo Redux Toolkit (đề cương 5.2)"
            onPress={() => navigation.navigate('ReduxCartDemo')}
          />
          <Row
            label="🛰️ Nhật ký giám sát"
            value={`${events.length} sự kiện`}
            onPress={() => setShowLogs((v) => !v)}
          />
          {showLogs && (
            <View style={styles.logs}>
              {events.length === 0 ? (
                <Text style={[styles.logLine, { color: colors.textLight }]}>Chưa có sự kiện nào.</Text>
              ) : (
                events.slice(0, 12).map((e, i) => (
                  <Text
                    key={`${e.at}-${i}`}
                    style={[styles.logLine, { color: e.kind === 'error' ? COLORS.danger : colors.textLight }]}
                  >
                    {new Date(e.at).toLocaleTimeString('vi-VN')} · {e.message}
                  </Text>
                ))
              )}
            </View>
          )}
          <Row label="Môi trường" value={APP_ENV} />
          <Row label="Server" value={API_BASE_URL} />
          <Row label="Phiên bản" value={`v${APP_VERSION}`} />
        </View>

        <Pressable
          style={[styles.logout, { borderColor: COLORS.danger }]}
          onPress={confirmLogout}
          testID="logout"
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: SIZES.padding, paddingBottom: 40 },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: '900' },
  name: { color: COLORS.white, fontSize: SIZES.h3, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  since: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 12 },
  stat: { flex: 1, padding: 14, borderRadius: SIZES.radius, alignItems: 'center' },
  statValue: { fontSize: SIZES.h2, fontWeight: '900' },
  statLabel: { fontSize: 12, marginTop: 2 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  group: { borderRadius: SIZES.radius, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15, flexShrink: 1 },
  rowValue: { fontSize: 13, maxWidth: '55%', textAlign: 'right' },
  logs: { paddingHorizontal: 14, paddingVertical: 8 },
  logLine: { fontSize: 11, marginBottom: 4 },
  logout: {
    marginTop: 28,
    borderWidth: 1.5,
    borderRadius: SIZES.radius,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: COLORS.danger, fontWeight: '800', fontSize: 16 },
});

export default ProfileScreen;
