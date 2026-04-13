import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CheckerboardProps {
  size?: number;
  darkColor?: string;
  lightColor?: string;
  rows?: number;
  cols?: number;
}

export const Checkerboard: React.FC<CheckerboardProps> = ({
  size = 14,
  darkColor = '#b0b0b0',
  lightColor = '#e8e8e8',
  rows = 8,
  cols = 8,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: cols }).map((_, col) => (
            <View
              key={col}
              style={{
                width: size,
                height: size,
                backgroundColor: (row + col) % 2 === 0 ? darkColor : lightColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
