import React from 'react';
import { View, Text, TextInput } from 'react-native';

/**
 * Shared form field wrapper with label, optional required star, and inline error.
 * Used by EditDoctorProfileScreen and EditPatientProfileScreen.
 */
export function FieldWrapper({
    label,
    required,
    children,
    error,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <View>
            <Text style={{
                fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4,
            }}>
                {label}
                {required && <Text style={{ color: '#ef4444' }}> *</Text>}
            </Text>
            {children}
            {error && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {error}
                </Text>
            )}
        </View>
    );
}

/**
 * Shared styled text input with a leading icon.
 */
export function StyledInput({
    icon,
    hasError,
    multiline,
    ...rest
}: {
    icon: React.ReactNode;
    hasError?: boolean;
    multiline?: boolean;
    [key: string]: any;
}) {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: hasError ? '#ef4444' : '#e2e8f0',
            borderRadius: 12,
            paddingHorizontal: 12,
            ...(multiline ? { paddingTop: 14, minHeight: 100 } : { height: 50 }),
        }}>
            <View style={multiline ? { marginTop: 2 } : {}}>{icon}</View>
            <TextInput
                style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 15,
                    color: '#0f172a',
                    ...(multiline ? { textAlignVertical: 'top' } : {}),
                }}
                placeholderTextColor="#94a3b8"
                multiline={multiline}
                {...rest}
            />
        </View>
    );
}
