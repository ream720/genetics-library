import { alpha, createTheme, PaletteMode } from "@mui/material/styles";

const lightColors = {
  background: "#F3F1E9",
  paper: "#FCFBF7",
  subtle: "#ECEDE4",
  raised: "#FFFFFF",
  sunken: "#E6E8DE",
  text: "#1D241F",
  textSecondary: "#5D685F",
  divider: "#D4D8CD",
  primary: "#4F6F52",
  primaryContrast: "#FFFFFF",
  accent: "#A66F22",
  accentContrast: "#FFFFFF",
  navigation: "#172019",
  navigationText: "#EDF3EA",
  navigationMuted: "#AEBBAF",
  navigationSelected: "#DCE8D6",
};

const darkColors = {
  background: "#111612",
  paper: "#192019",
  subtle: "#202820",
  raised: "#252E25",
  sunken: "#0D120E",
  text: "#EDF2EA",
  textSecondary: "#AEB9AE",
  divider: "#354036",
  primary: "#91B88E",
  primaryContrast: "#102012",
  accent: "#D2A85D",
  accentContrast: "#241805",
  navigation: "#0D120E",
  navigationText: "#EDF3EA",
  navigationMuted: "#94A196",
  navigationSelected: "#26362A",
};

export const createAppTheme = (mode: PaletteMode) => {
  const colors = mode === "dark" ? darkColors : lightColors;

  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 768,
        lg: 1024,
        xl: 1440,
      },
    },
    palette: {
      mode,
      primary: {
        main: colors.primary,
        contrastText: colors.primaryContrast,
      },
      secondary: {
        main: colors.accent,
        contrastText: colors.accentContrast,
      },
      accent: {
        main: colors.accent,
        contrastText: colors.accentContrast,
      },
      background: {
        default: colors.background,
        paper: colors.paper,
      },
      surface: {
        subtle: colors.subtle,
        raised: colors.raised,
        sunken: colors.sunken,
      },
      navigation: {
        background: colors.navigation,
        text: colors.navigationText,
        muted: colors.navigationMuted,
        selected: colors.navigationSelected,
      },
      status: {
        planning: mode === "dark" ? "#AEB9AE" : "#667168",
        inProgress: mode === "dark" ? "#E0B66C" : "#8B5A16",
        complete: mode === "dark" ? "#82C995" : "#267044",
        danger: mode === "dark" ? "#F0948E" : "#B63832",
      },
      success: {
        main: mode === "dark" ? "#82C995" : "#267044",
      },
      warning: {
        main: mode === "dark" ? "#E0B66C" : "#9B651B",
      },
      error: {
        main: mode === "dark" ? "#F0948E" : "#B63832",
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary,
      },
      divider: colors.divider,
    },
    shape: {
      borderRadius: 14,
    },
    spacing: 8,
    typography: {
      fontFamily:
        '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: "clamp(2rem, 3vw, 2.75rem)",
        fontWeight: 720,
        lineHeight: 1.12,
        letterSpacing: "-0.035em",
      },
      h2: {
        fontSize: "clamp(1.65rem, 2.4vw, 2.2rem)",
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: "-0.025em",
      },
      h3: {
        fontSize: "clamp(1.4rem, 2vw, 1.75rem)",
        fontWeight: 680,
        lineHeight: 1.25,
        letterSpacing: "-0.018em",
      },
      h4: {
        fontSize: "clamp(1.55rem, 2.2vw, 2rem)",
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.025em",
      },
      h5: {
        fontSize: "1.35rem",
        fontWeight: 680,
        lineHeight: 1.3,
      },
      h6: {
        fontSize: "1.05rem",
        fontWeight: 680,
        lineHeight: 1.35,
      },
      subtitle1: {
        fontWeight: 600,
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.9rem",
        lineHeight: 1.55,
      },
      button: {
        fontWeight: 700,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      caption: {
        fontSize: "0.78rem",
        lineHeight: 1.45,
        letterSpacing: "0.01em",
      },
    },
    shadows: [
      "none",
      `0 1px 2px ${alpha("#000000", mode === "dark" ? 0.24 : 0.08)}`,
      `0 4px 14px ${alpha("#000000", mode === "dark" ? 0.28 : 0.08)}`,
      `0 10px 30px ${alpha("#000000", mode === "dark" ? 0.32 : 0.1)}`,
      `0 16px 42px ${alpha("#000000", mode === "dark" ? 0.36 : 0.12)}`,
      ...Array(20).fill(
        `0 18px 48px ${alpha("#000000", mode === "dark" ? 0.4 : 0.14)}`
      ),
    ] as ReturnType<typeof createTheme>["shadows"],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            minHeight: "100%",
            backgroundColor: colors.background,
            scrollBehavior: "smooth",
          },
          body: {
            minHeight: "100%",
            backgroundColor: colors.background,
          },
          "#root": {
            minHeight: "100dvh",
          },
          "*, *::before, *::after": {
            boxSizing: "border-box",
          },
          "::selection": {
            backgroundColor: alpha(colors.primary, 0.28),
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              scrollBehavior: "auto !important",
              transitionDuration: "0.01ms !important",
            },
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            transition:
              "background-color 200ms ease, border-color 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
            "&:focus-visible": {
              outline: `3px solid ${alpha(colors.primary, 0.42)}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: 12,
            paddingInline: 18,
          },
          contained: {
            boxShadow: `0 6px 18px ${alpha(colors.primary, 0.2)}`,
            "&:hover": {
              boxShadow: `0 8px 22px ${alpha(colors.primary, 0.26)}`,
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: colors.divider,
            "&:hover": {
              borderColor: colors.primary,
              backgroundColor: alpha(colors.primary, 0.07),
            },
          },
          sizeSmall: {
            minHeight: 40,
            paddingInline: 14,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            borderRadius: 12,
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${colors.divider}`,
            borderRadius: 18,
            boxShadow: `0 8px 26px ${alpha("#000000", mode === "dark" ? 0.16 : 0.055)}`,
          },
        },
      },
      MuiCardActionArea: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            "&:hover": {
              backgroundColor: alpha(colors.primary, 0.055),
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          rounded: {
            borderRadius: 18,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: alpha(colors.raised, mode === "dark" ? 0.55 : 0.82),
            transition:
              "background-color 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
            "&:hover": {
              backgroundColor: colors.raised,
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.14)}`,
            },
          },
          notchedOutline: {
            borderColor: colors.divider,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontWeight: 550,
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            minHeight: 32,
            borderRadius: 999,
            fontWeight: 650,
          },
          clickable: {
            minHeight: 44,
            "&:hover": {
              backgroundColor: alpha(colors.primary, 0.14),
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.divider}`,
            borderRadius: 22,
            backgroundColor: colors.paper,
            boxShadow: `0 24px 70px ${alpha("#000000", 0.38)}`,
            "@media (max-width: 599.95px)": {
              width: "100%",
              maxWidth: "100%",
              height: "100dvh",
              maxHeight: "100dvh",
              margin: 0,
              border: 0,
              borderRadius: 0,
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1.3rem",
            fontWeight: 700,
            padding: "22px 24px 14px",
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: "12px 24px 24px",
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            gap: 8,
            padding: "14px 24px 20px",
            borderTop: `1px solid ${colors.divider}`,
            "@media (max-width: 599.95px)": {
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              flexWrap: "wrap",
              backgroundColor: colors.paper,
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              "& > .MuiButton-root": {
                flex: "1 1 140px",
              },
            },
          },
        },
      },
      MuiAccordion: {
        defaultProps: {
          elevation: 0,
          disableGutters: true,
        },
        styleOverrides: {
          root: {
            overflow: "hidden",
            border: `1px solid ${colors.divider}`,
            borderRadius: "16px !important",
            backgroundColor: colors.paper,
            "&::before": {
              display: "none",
            },
            "& + &": {
              marginTop: 12,
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 56,
            paddingInline: 18,
            "&.Mui-expanded": {
              minHeight: 56,
            },
          },
          content: {
            marginBlock: 14,
            "&.Mui-expanded": {
              marginBlock: 14,
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: "4px 18px 20px",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            alignItems: "center",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 9,
            fontSize: "0.78rem",
            padding: "8px 10px",
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            minHeight: 68,
            backgroundColor: colors.paper,
            borderTop: `1px solid ${colors.divider}`,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 64,
            minHeight: 64,
            color: colors.textSecondary,
            "&.Mui-selected": {
              color: colors.primary,
            },
          },
          label: {
            fontSize: "0.72rem",
            fontWeight: 650,
            "&.Mui-selected": {
              fontSize: "0.72rem",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: colors.subtle,
            color: colors.text,
            fontWeight: 700,
          },
          root: {
            borderColor: colors.divider,
          },
        },
      },
    },
  });
};
