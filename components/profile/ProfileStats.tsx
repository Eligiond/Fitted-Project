import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface StatItem {
  label: string;
  value: number;
}

interface ProfileStatsProps {
  itemCount: number;
  outfitCount: number;
  followerCount: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  itemCount,
  outfitCount,
  followerCount,
}) => {
  const { colors } = useTheme();

  const stats: StatItem[] = [
    { label: 'Items', value: itemCount },
    { label: 'Outfits', value: outfitCount },
    { label: 'Followers', value: followerCount },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <View style={styles.statItem}>
            <Text style={[styles.value, { color: colors.primaryText }]}>
              {formatNumber(stat.value)}
            </Text>
            <Text style={[styles.label, { color: colors.mutedText }]}>{stat.label}</Text>
          </View>
          {index < stats.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 28,
    borderRadius: 1,
  },
});
