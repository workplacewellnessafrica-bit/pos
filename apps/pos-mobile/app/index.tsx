import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DukaPOS Mobile</Text>
      <Text style={styles.sub}>POS Core running on Expo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0' },
  sub: { fontSize: 16, color: '#94a3b8', marginTop: 8 },
});
