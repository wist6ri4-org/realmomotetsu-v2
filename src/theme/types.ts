import "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Palette {
        light: Palette["primary"];
        team1: Palette["primary"];
        team2: Palette["primary"];
        team3: Palette["primary"];
        team4: Palette["primary"];
    }

    interface PaletteOptions {
        light?: PaletteOptions["primary"];
        team1?: PaletteOptions["primary"];
        team2?: PaletteOptions["primary"];
        team3?: PaletteOptions["primary"];
        team4?: PaletteOptions["primary"];
    }
}

// 各コンポーネントの型拡張
declare module "@mui/material/Button" {
    interface ButtonPropsColorOverrides {
        light: true;
        team1: true;
        team2: true;
        team3: true;
        team4: true;
    }
}

declare module "@mui/material/Chip" {
    interface ChipPropsColorOverrides {
        light: true;
        team1: true;
        team2: true;
        team3: true;
        team4: true;
    }
}

declare module "@mui/material/IconButton" {
    interface IconButtonPropsColorOverrides {
        light: true;
        team1: true;
        team2: true;
        team3: true;
        team4: true;
    }
}

declare module "@mui/material/Fab" {
    interface FabPropsColorOverrides {
        light: true;
        team1: true;
        team2: true;
        team3: true;
        team4: true;
    }
}