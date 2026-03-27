import React from 'react';
import { View, Text } from 'react-native';

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps) {
    return (
        <View style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
            borderWidth: 1, borderColor: '#f1f5f9',
            shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}>
            <Text style={{
                fontSize: 13, fontWeight: '800', color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
            }}>
                {title}
            </Text>
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 4 }} />
            {children}
        </View>
    );
}
