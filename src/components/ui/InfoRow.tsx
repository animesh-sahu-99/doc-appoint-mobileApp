import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
}

export function InfoRow({ icon, label, value, highlight }: InfoRowProps) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 }}>
            <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: `${colors.primary}10`,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 11, fontWeight: '600', color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2,
                }}>
                    {label}
                </Text>
                <Text style={{
                    fontSize: 14,
                    fontWeight: highlight ? '700' : '500',
                    color: highlight ? '#0f172a' : '#334155',
                    lineHeight: 20,
                }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}
