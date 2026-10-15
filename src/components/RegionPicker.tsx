import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { outwardCode } from '@/lib/postcode';
import { useTheme } from '@/theme';

interface Props {
  outcode: string | null;
  region: string | null;
  onChange: (outcode: string | null) => void;
}

/** Optional postcode for a regional forecast. Only the outward half is kept and sent. */
export function RegionPicker({ outcode, region, onChange }: Props) {
  const t = useTheme();
  const [text, setText] = useState(outcode ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const code = outwardCode(text);
    if (!code) {
      setError("That doesn't look like a UK postcode. Try the first half, like EH1.");
      return;
    }
    setError(null);
    setText(code);
    onChange(code);
  };

  const clear = () => {
    setError(null);
    setText('');
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: t.text }]} nativeID="postcode-label">
        Your postcode (optional)
      </Text>
      <Text style={[styles.help, { color: t.muted }]}>
        For your local grid. Only the first half, like EH1, is used, so your address stays on your device.
      </Text>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          aria-labelledby="postcode-label"
          accessibilityLabel="Your postcode (optional)"
          aria-invalid={error ? true : undefined}
          placeholder="e.g. EH1"
          placeholderTextColor={t.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="postal-code"
          returnKeyType="search"
          maxLength={8}
          style={[
            styles.input,
            { color: t.text, borderColor: error ? '#c93a3a' : t.border, backgroundColor: t.surface },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={submit}
          style={({ pressed }) => [styles.button, { backgroundColor: t.accent }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.buttonText, { color: t.onAccent }]}>Use postcode</Text>
        </Pressable>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={[styles.error, { color: t.text }]}>
          {error}
        </Text>
      )}
      <View style={styles.row}>
        <Text style={[styles.help, { color: t.muted }]}>
          {outcode ? `Showing ${region ?? outcode} (${outcode})` : 'Showing all of Great Britain'}
        </Text>
        {/* Only once a regional forecast has loaded. If it failed, the error box offers this instead, so the
            same control never appears twice. */}
        {outcode && region && (
          <Pressable accessibilityRole="button" onPress={clear} style={styles.link}>
            <Text style={[styles.linkText, { color: t.accent }]}>Use all of Great Britain</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 16, fontWeight: '700' },
  help: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: {
    minHeight: 44,
    minWidth: 120,
    flexGrow: 1,
    flexBasis: 120,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  error: { fontSize: 14, fontWeight: '600' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
