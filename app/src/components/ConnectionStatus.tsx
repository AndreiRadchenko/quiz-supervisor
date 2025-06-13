import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../theme';

interface ConnectionStatusProps {
  style?: any;
  showTitle?: boolean;
}

export const ConnectionStatus = (props: ConnectionStatusProps) => {
  const { style, showTitle } = props;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { status: wsStatus, errorDetails } = useWebSocketContext();

  const showTitleResolved = showTitle ?? true;

  const styles = StyleSheet.create({
    container: {
      // ...theme.components.card,
      position: 'absolute',
        bottom: theme.spacing.md,
        left: theme.spacing.md,
        right: theme.spacing.md,
        // backgroundColor: `${theme.colors.card}F0`, // Semi-transparent
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
      ...style,
    },
    title: {
      ...theme.components.text.subheading,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.xs,
    },
    label: {
      ...theme.components.text.body,
      ...theme.components.text.muted,
      flex: 1,
    },
    status: {
      ...theme.components.text.body,
      fontWeight: theme.fontWeight.medium,
    },
    connected: {
      color: '#10b981', // Green
    },
    disconnected: {
      color: theme.colors.destructive,
    },
    connecting: {
      color: theme.colors.accent,
    },
    error: {
      color: theme.colors.destructive,
    },
    connectionType: {
      ...theme.components.text.muted,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    errorText: {
      ...theme.components.text.error,
      fontSize: theme.fontSize.xs,
      marginTop: theme.spacing.xs,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return theme.colors.accent;
      case 'error':
      case 'disconnected':
      default:
        return theme.colors.destructive;
    }
  };

  return (
    <View style={styles.container}>
      {showTitleResolved && (
        <Text style={styles.title}>{t('defaultScreen.connectionStatus')}</Text>
      )}
      
      <View style={styles.row}>
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(wsStatus) }
          ]} 
        />
        <Text style={styles.label}>WebSocket</Text>

        {wsStatus !== 'connected' && (
          <Text style={[
            styles.status,
            wsStatus === 'disconnected' && styles.disconnected,
            wsStatus === 'connecting' && styles.connecting,
            wsStatus === 'error' && styles.error,
          ]}>
            {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
          </Text>
        )}
        
      </View>

      {/* Show errors */}
      {wsStatus === 'error' && errorDetails && (
        <Text style={styles.errorText}>WS: {errorDetails}</Text>
      )}
    </View>
  );
};
