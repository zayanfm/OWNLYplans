import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// On web this page runs inside the auth popup and hands the callback URL back
// to openAuthSessionAsync in the OWNLYplan window.
WebBrowser.maybeCompleteAuthSession();

export default function MockPassCallbackPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Returning to OWNLYplan…</Text>
      <Text style={styles.body}>You can close this window if it does not close automatically.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F6F3',
  },
  title: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: '#6F6A63',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
