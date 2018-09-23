import * as ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import * as React from "react";
import { App } from "./App";

import 'typeface-open-sans-condensed';
import '../scss/app.sass';

ReactDOM.render(<HashRouter>
    <App />
</HashRouter>, document.getElementById('app'));
