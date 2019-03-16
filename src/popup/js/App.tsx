import * as React from "react";
import { HashRouter } from "react-router-dom";
import { Switch, Route } from "react-router-dom";

import { Index } from "./pages/Index";
import { Users } from "./pages/Users";

export class App extends React.Component<any, any> {
    render() {
        return (
            <HashRouter>
                <div>
                    <h1 className="header">KPJS</h1>

                    <Switch>
                        <Route exact path="/" component={Index} />
                        <Route path="/users" component={Users} />
                    </Switch>
                </div>
            </HashRouter>
        );
    }
}
