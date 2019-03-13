import * as React from "react";
import { Switch, Route } from "react-router-dom";

import { Index } from "./pages/Index";
import { Users } from "./pages/Users";

export class App extends React.Component<any, any> {
    render() {
        return (
            <div>
                <h1 className="header text-center">KSJS</h1>

                <Switch>
                    <Route exact path="/" component={Index} />
                    <Route path="/users" component={Users} />
                </Switch>
            </div>
        );
    }
}
