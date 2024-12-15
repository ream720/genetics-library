import { createTheme } from "@mui/material/styles";

// Light Theme
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#646cff",
    },
    background: {
      default: "#ffffff",
      paper: "#f9f9f9",
    },
    text: {
      primary: "#213547",
      secondary: "#535bf2",
    },
  },
});

// Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#646cff",
    },
    background: {
      default: "#242424",
      paper: "#1a1a1a",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "#535bf2",
    },
  },
});

export { lightTheme, darkTheme };
