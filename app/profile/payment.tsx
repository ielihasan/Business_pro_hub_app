import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

type PaymentMethodType = 'easypaisa' | 'jazzcash' | 'bank';

interface PaymentMethod {
    id: PaymentMethodType;
    nameKey: string;
    icon: string;
    color: string;
}

export default function PaymentScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const paymentMethods: PaymentMethod[] = [
        { id: 'easypaisa', nameKey: 'profile.payment.easypaisa', icon: 'phone-portrait-outline', color: '#37B34A' },
        { id: 'jazzcash', nameKey: 'profile.payment.jazzcash', icon: 'phone-portrait-outline', color: '#BF202F' },
        { id: 'bank', nameKey: 'profile.payment.bank', icon: 'business-outline', color: '#007AFF' },
    ];

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/profile');
        }
    };

    const handlePayment = async () => {
        if (!selectedMethod || !accountNumber || !amount) {
            Alert.alert(t('common.error'), t('profile.payment.validation_error'));
            return;
        }

        setIsLoading(true);
        // Simulate real-time payment processing
        setTimeout(() => {
            setIsLoading(false);
            const methodName = t(paymentMethods.find(m => m.id === selectedMethod)?.nameKey || '');
            Alert.alert(
                t('profile.payment.success_title'),
                t('profile.payment.success_message', { amount, method: methodName }),
                [
                    { text: 'OK', onPress: handleBack }
                ]
            );
        }, 2000);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.foreground }]}>{t('profile.payment.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('profile.payment.select_method')}</Text>

                    <View style={styles.methodsContainer}>
                        {paymentMethods.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodCard,
                                    {
                                        backgroundColor: selectedMethod === method.id ? colors.primary + '10' : colors.card,
                                        borderColor: selectedMethod === method.id ? colors.primary : colors.border,
                                    }
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: method.color + '20' }]}>
                                    <Ionicons name={method.icon as any} size={24} color={method.color} />
                                </View>
                                <Text style={[styles.methodName, { color: colors.foreground }]}>{t(method.nameKey)}</Text>
                                {selectedMethod === method.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.checkIcon} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {selectedMethod && (
                        <View style={styles.formContainer}>
                            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: Spacing[6] }]}>
                                {t('profile.payment.enter_details')}
                            </Text>
                            <Card>
                                <CardContent>
                                    <Input
                                        label={selectedMethod === 'bank' ? t('profile.payment.account_number') : t('profile.payment.phone_number')}
                                        value={accountNumber}
                                        onChangeText={setAccountNumber}
                                        placeholder={selectedMethod === 'bank' ? "PK..." : "03..."}
                                        keyboardType={selectedMethod === 'bank' ? 'default' : 'phone-pad'}
                                        leftIcon={selectedMethod === 'bank' ? 'card-outline' : 'call-outline'}
                                    />

                                    <View style={{ height: Spacing[4] }} />

                                    <Input
                                        label={t('profile.payment.amount')}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        leftIcon="cash-outline"
                                    />
                                </CardContent>
                            </Card>

                            <Button
                                style={styles.payButton}
                                onPress={handlePayment}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                {isLoading ? t('profile.payment.processing') : t('profile.payment.pay_now')}
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[4],
    },
    backButton: { padding: Spacing[1] },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    content: {
        padding: Spacing[4],
    },
    sectionTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    methodsContainer: {
        gap: Spacing[3],
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[3],
    },
    methodName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        flex: 1,
    },
    checkIcon: {
        marginLeft: Spacing[2],
    },
    formContainer: {
        marginTop: Spacing[2],
    },
    payButton: {
        marginTop: Spacing[6],
    },
});
