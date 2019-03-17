import * as ReactDOM from "react-dom";
import * as React from "react";
import { App } from "./App";
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from "@material-ui/core/CssBaseline";
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';

import "typeface-open-sans-condensed";
import "../scss/app.sass";

const theme = createMuiTheme({
    palette: {
        primary: blue,
        secondary: red
    },
});

ReactDOM.render(
    <MuiThemeProvider theme={theme}>
        <React.Fragment>
            <CssBaseline />
            <App />
        </React.Fragment>
    </MuiThemeProvider>,
    document.getElementById("app")
);
