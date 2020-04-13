import * as React from "react";
import { HashRouter, withRouter } from "react-router-dom";
import { Switch, Route } from "react-router-dom";

import Index from "./pages/Index";
import User from "./pages/User";

export class App extends React.Component<any, any> {
    render() {
        return (
            <HashRouter>
                <div>
                    <Switch>
                        <Route exact path="/" component={Index} />
                        <Route path="/user/:name" component={User} />
                    </Switch>
                </div>
            </HashRouter>
        );
    }
}
