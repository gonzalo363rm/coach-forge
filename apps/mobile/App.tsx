import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coach Forge Mobile</Text>
      <Text style={styles.subtitle}>Proyecto inicializado correctamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#eaeaea',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});