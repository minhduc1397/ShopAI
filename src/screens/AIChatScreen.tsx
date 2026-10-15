import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ShopButton from '@components/ui/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { extractProductIds } from '@utils/productLinks';
import { AI_GREETING, AI_SUGGESTIONS, MAX_HISTORY_TURNS } from '@constants/aiPrompt';
import { askShopAI, toFriendlyError, type ChatTurn } from '@services/aiChatService';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  status?: 'sent' | 'error'; // 'error' -> hiện nút Thử lại (Phần 8.10)
};

export default function AIChatScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const botBg = isDark ? '#262B40' : '#E5E7EB';
  const [messages, setMessages] = useState<Message[]>([
    { id: 'greeting', text: AI_GREETING, isBot: true, status: 'sent' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);
  // Lưu lại câu hỏi vừa lỗi để nút "Thử lại" biết phải gửi lại cái gì
  const lastQuestionRef = useRef<string>('');

  const scrollToEnd = () => {
    // Hoãn một nhịp để FlatList kịp render item mới rồi mới cuộn
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  /**
   * Dựng lịch sử hội thoại gửi kèm câu hỏi.
   * `list` luôn kết thúc bằng chính câu hỏi đang gửi → bỏ phần tử cuối, Server tự ghép câu hỏi vào sau
   * (trước đây câu hỏi bị gửi 2 lần liền nhau). Chỉ giữ N lượt gần nhất để tiết kiệm token (Phần 8.11).
   */
  const buildHistory = useCallback((list: Message[]): ChatTurn[] => {
    return list
      .slice(0, -1)
      .filter((m) => m.id !== 'greeting' && m.status !== 'error') // Bỏ câu chào và các tin lỗi
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({
        role: m.isBot ? ('model' as const) : ('user' as const),
        parts: [{ text: m.text }],
      }));
  }, []);

  /** Lõi gửi tin — dùng chung cho cả nút Gửi lẫn nút Thử lại. */
  const send = useCallback(
    async (question: string, historySource: Message[]) => {
      lastQuestionRef.current = question;
      setIsTyping(true);
      scrollToEnd();

      try {
        const reply = await askShopAI(question, buildHistory(historySource));
        setMessages((prev) => [
          ...prev,
          { id: `bot-${Date.now()}`, text: reply, isBot: true, status: 'sent' },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, text: toFriendlyError(error), isBot: true, status: 'error' },
        ]);
      } finally {
        setIsTyping(false);
        scrollToEnd();
      }
    },
    [buildHistory],
  );

  const handleSend = useCallback(
    (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || isTyping) return; // Chống spam: đang chờ AI thì không cho gửi tiếp

      const userMsg: Message = { id: `user-${Date.now()}`, text, isBot: false, status: 'sent' };
      const next = [...messages, userMsg];

      setMessages(next);
      setInputText(''); // Xoá ô nhập NGAY LẬP TỨC để user cảm thấy phản hồi tức thì
      send(text, next);
    },
    [inputText, isTyping, messages, send],
  );

  /** Nút Thử lại: xoá bong bóng lỗi cuối cùng rồi gửi lại đúng câu hỏi cũ. */
  const handleRetry = useCallback(() => {
    if (isTyping || !lastQuestionRef.current) return;
    const cleaned = messages.filter((m) => m.status !== 'error');
    setMessages(cleaned);
    send(lastQuestionRef.current, cleaned);
  }, [isTyping, messages, send]);

  const renderItem = ({ item }: { item: Message }) => (
    <View>
      <View
        style={[
          styles.bubble,
          item.isBot ? [styles.botBubble, { backgroundColor: botBg }] : styles.userBubble,
          item.status === 'error' && styles.errorBubble,
        ]}
      >
        <Text
          selectable // Cho phép chạm giữ để copy (Phần 8.10)
          style={{
            color:
              item.isBot && item.status !== 'error' ? colors.text : item.isBot ? '#7F1D1D' : COLORS.white,
          }}
        >
          {item.text}
        </Text>
      </View>

      {item.isBot && item.status === 'sent' && extractProductIds(item.text).length > 0 && (
        <View style={styles.productLinks}>
          {extractProductIds(item.text).map((id) => (
            <Pressable
              key={id}
              style={[styles.productLink, { backgroundColor: colors.primarySoft }]}
              onPress={() => navigation.navigate('ProductDetail', { productId: id })}
            >
              <Text style={[styles.productLinkText, { color: colors.primary }]}>Xem {id} →</Text>
            </Pressable>
          ))}
        </View>
      )}

      {item.status === 'error' && (
        <Pressable onPress={handleRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>🔄 Thử lại</Text>
        </Pressable>
      )}
    </View>
  );

  /** Trạng thái rỗng: gợi ý sẵn câu hỏi để user biết hỏi gì (Phần 8.10). */
  const renderSuggestions = () => (
    <View style={styles.suggestBox}>
      <Text style={[styles.suggestTitle, { color: colors.textLight }]}>Gợi ý cho bạn:</Text>
      <View style={styles.chipRow}>
        {AI_SUGGESTIONS.map((s) => (
          <Pressable key={s} style={styles.chip} onPress={() => handleSend(s)} disabled={isTyping}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const canSend = inputText.trim().length > 0 && !isTyping;

  return (
    // SafeAreaView tránh Notch/Status Bar che mất Header
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* KeyboardAvoidingView — "phao cứu sinh" chống bàn phím che khung Chat */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trợ lý ShopAI ✨</Text>
          <Text style={[styles.headerSub, { color: colors.textLight }]}>
            {isTyping ? 'Đang soạn tin...' : 'Đang hoạt động'}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SIZES.padding, flexGrow: 1 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled" // Bấm chip gợi ý được ngay cả khi bàn phím đang mở
          // Chỉ hiện gợi ý khi user chưa hỏi câu nào (mới có mỗi câu chào)
          ListFooterComponent={
            <>
              {messages.length <= 1 && renderSuggestions()}
              {/* Typing indicator — bong bóng ba chấm (Phần 8.10) */}
              {isTyping && (
                <View
                  style={[styles.bubble, styles.botBubble, styles.typingBubble, { backgroundColor: botBg }]}
                >
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={[styles.typingText, { color: colors.textLight }]}>
                    {' '}
                    Trợ lý đang soạn tin...
                  </Text>
                </View>
              )}
            </>
          }
        />

        <View style={[styles.inputArea, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập câu hỏi tư vấn..."
            placeholderTextColor={colors.textLight}
            maxLength={500} // Chặn user dán cả cuốn tiểu thuyết (Phần 8.11, chiến lược #2)
            editable={!isTyping} // Khoá ô nhập khi đang chờ AI
            multiline
            onSubmitEditing={() => handleSend()}
          />
          <ShopButton
            title="Gửi"
            onPress={() => handleSend()}
            isLoading={isTyping}
            disabled={!canSend} // Ô rỗng hoặc đang chờ -> nút mờ đi, không bấm được
            style={{ width: 80, height: 40, opacity: canSend ? 1 : 0.5 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { padding: 15, alignItems: 'center' },
  headerTitle: { fontSize: SIZES.h2, fontWeight: 'bold' },
  headerSub: { fontSize: 12, marginTop: 2 },

  bubble: { padding: 15, borderRadius: 20, marginBottom: 10, maxWidth: '80%' },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  errorBubble: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: COLORS.error },
  typingBubble: { flexDirection: 'row', alignItems: 'center' },
  typingText: { color: '#666', fontSize: 13 },

  productLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -4, marginBottom: 12 },
  productLink: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  productLinkText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  retryBtn: { alignSelf: 'flex-start', marginBottom: 12, paddingHorizontal: 4 },
  retryText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

  suggestBox: { marginTop: 8, marginBottom: 16 },
  suggestTitle: { fontSize: 13, color: '#777', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: COLORS.primary, fontSize: 13 },

  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: COLORS.surface, alignItems: 'flex-end' },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F0F0F0',
    color: '#000',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    marginRight: 10,
  },
});
