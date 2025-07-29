import "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Palette {
        team1: Palette["primary"];
        team2: Palette["primary"];
        team3: Palette["primary"];
        team4: Palette["primary"];
    }

    interface PaletteOptions {
        team1?: PaletteOptions["primary"];
        team2?: PaletteOptions["primary"];
        team3?: PaletteOptions["primary"];
        team4?: PaletteOptions["primary"];
    }
}

// Buttonコンポーネントの型も拡張
declare module "@mui/material/Button" {
    interface ButtonPropsColorOverrides {
        team1: true;
        team2: true;
        team3: true;
        team4: true;
    }
}
