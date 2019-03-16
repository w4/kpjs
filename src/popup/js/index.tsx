import * as ReactDOM from "react-dom";
import * as React from "react";
import { App } from "./App";
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from "@material-ui/core/CssBaseline";

import "typeface-open-sans-condensed";
import "../scss/app.sass";

const theme = createMuiTheme();

ReactDOM.render(
    <MuiThemeProvider theme={theme}>
        <React.Fragment>
            <CssBaseline />
            <App />
        </React.Fragment>
    </MuiThemeProvider>,
    document.getElementById("app")
);
