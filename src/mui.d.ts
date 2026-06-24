import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
    surface: {
      subtle: string;
      raised: string;
      sunken: string;
    };
    navigation: {
      background: string;
      text: string;
      muted: string;
      selected: string;
    };
    status: {
      planning: string;
      inProgress: string;
      complete: string;
      danger: string;
    };
  }

  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
    surface?: {
      subtle: string;
      raised: string;
      sunken: string;
    };
    navigation?: {
      background: string;
      text: string;
      muted: string;
      selected: string;
    };
    status?: {
      planning: string;
      inProgress: string;
      complete: string;
      danger: string;
    };
  }
}

