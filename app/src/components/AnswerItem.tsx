import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface AnswerItemProps {
  item: string;
  onSwipeLeft: (item: string) => void;
  onSwipeRight: (item: string) => void;
}

export const AnswerItem: React.FC<AnswerItemProps> = ({
  item,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [dragX] = useState(new Animated.Value(0));

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      dragX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const threshold = 100;
      if (gestureState.dx > threshold) {
        // Swipe right (NO)
        Animated.timing(dragX, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeRight(item);
          dragX.setValue(0);
        });
      } else if (gestureState.dx < -threshold) {
        // Swipe left (YES)
        Animated.timing(dragX, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeLeft(item);
          dragX.setValue(0);
        });
      } else {
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const animatedStyle = {
    transform: [{ translateX: dragX }],
  };

  // Calculate opacity for left and right backgrounds based on drag position
  const leftBackgroundOpacity = dragX.interpolate({
    inputRange: [-150, -50, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: 'clamp',
  });

  const rightBackgroundOpacity = dragX.interpolate({
    inputRange: [0, 50, 150],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      marginBottom: 10,
    },
    backgroundLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
      paddingInline: theme.spacing.xl,
    },
    leftBackground: {
      backgroundColor: '#10B981', // Green color
    },
    rightBackground: {
      backgroundColor: theme.colors.destructiveHover,
    },
    swipeLabelRight: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      zIndex: 1,
      opacity: 1,
      alignSelf: 'flex-end',
    },
    swipeLabelLeft: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      zIndex: 1,
      opacity: 1,
      alignSelf: 'flex-start',
    },
    answerItem: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryActive,
      padding: 15,
      borderRadius: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      zIndex: 2,
    },
    answerContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    answerLabel: {
      fontSize: theme.fontSize.base,
      fontWeight: '600',
      color: theme.colors.destructiveForeground,
      marginBottom: 4,
      opacity: 0.8,
    },
    correctAnswer: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.destructiveForeground,
      marginBottom: 8,
    },
    userAnswer: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.destructiveForeground,
      marginBottom: 4,
    },
    ArrowIcon: {
      width: 48,
      height: 48,
    },
  });

  return (
    <View style={styles.container}>
      {/* Left swipe background (YES) */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          styles.leftBackground,
          { opacity: leftBackgroundOpacity },
        ]}
      >
        <Text style={styles.swipeLabelRight}>{t('defaultScreen.yes')}</Text>
      </Animated.View>

      {/* Right swipe background (NO) */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          styles.rightBackground,
          { opacity: rightBackgroundOpacity },
        ]}
      >
        <Text style={styles.swipeLabelLeft}>{t('defaultScreen.no')}</Text>
      </Animated.View>

      {/* Main answer item */}
      <Animated.View
        style={[styles.answerItem, animatedStyle]}
        {...panResponder.panHandlers}
      >
        <Image
          source={require('../assets/images/arrows-right-01.png')}
          style={styles.ArrowIcon}
        />
        <View style={styles.answerContent}>
          <Text style={styles.answerLabel}>
            {t('defaultScreen.userAnswerLabel')}
          </Text>
          <Text style={styles.userAnswer}>{item}</Text>
        </View>
        <Image
          source={require('../assets/images/arrows-left-01.png')}
          style={styles.ArrowIcon}
        />
      </Animated.View>
    </View>
  );
};
