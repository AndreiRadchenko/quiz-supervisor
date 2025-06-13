import { colors, ColorScheme } from './colors';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from './tokens';

export const createTheme = (colorScheme: ColorScheme) => ({
  colors: colors[colorScheme],
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  // Common component styles
  components: {
    container: {
      flex: 1,
      backgroundColor: colors[colorScheme].background,
      padding: spacing.xs,
    },
    card: {
      backgroundColor: colors[colorScheme].card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.md,
    },
    button: {
      primary: {
        backgroundColor: colors[colorScheme].primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      secondary: {
        backgroundColor: colors[colorScheme].secondary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      destructive: {
        backgroundColor: colors[colorScheme].destructive,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
    },
    input: {
      backgroundColor: colors[colorScheme].input,
      color: colors[colorScheme].foreground,
      borderWidth: 1,
      borderColor: colors[colorScheme].border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.base,
    },
    text: {
      heading: {
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.bold,
        color: colors[colorScheme].foreground,
      },
      subheading: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors[colorScheme].foreground,
      },
      body: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.normal,
        color: colors[colorScheme].foreground,
      },
      muted: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.normal,
        color: colors[colorScheme].mutedForeground,
      },
      error: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.medium,
        color: colors[colorScheme].destructive,
      },
    },
  },
});

export type Theme = ReturnType<typeof createTheme>;
