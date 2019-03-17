import * as React from "react";
import { HashRouter } from "react-router-dom";
import { Switch, Route } from "react-router-dom";

import { Index } from "./pages/Index";
import { Users } from "./pages/Users";

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

export class App extends React.Component<any, any> {
    render() {
        return (
            <HashRouter>
                <div>
                    <AppBar position="static">
                        <Toolbar variant="dense">
                            <Typography variant="h6" color="inherit">
                                KPJS
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <Switch>
                        <Route exact path="/" component={Index} />
                        <Route path="/users" component={Users} />
                    </Switch>
                </div>
            </HashRouter>
        );
    }
}
