import * as React from "react";
import { Option } from "./components/Option";
import { ConfigKey } from '../../common/config';

export class App extends React.Component<any, any> {
    render() {
        return (
            <div style={{width: '100%'}}>
                <h1 className="header text-center">KPJS</h1>

                <Option
                    label="Allow unsigned scripts on domains without a Keybase owner"
                    config={ConfigKey.ALLOW_UNSIGNED_DOMAINS}></Option>

                <Option
                    label="Allow unsigned scripts on domains with a Keybase owner"
                    config={ConfigKey.ALLOW_MIXED_SCRIPTS}></Option>

                <Option
                    label="Trust all Keybase-proven owners of a domain on first load"
                    config={ConfigKey.TRUSTED_FIRST_LOAD}></Option>
            </div>
        );
    }
}
