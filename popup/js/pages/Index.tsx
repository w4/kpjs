import * as React from 'react';
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../../../common/GetKeybaseUserForDomainEvent";

import { Row } from "../components/Row";

interface ToolbarProps {
}

interface ToolbarState {
    domain: string,
    keybaseUsers: string[],
    trustedUsers: string[],
    barredUsers: string[]
}

const WriteUsersList = (props: { header: string, users: string[] }) => {
    if (props.users.length) {
        return <Row header={ props.header }>
            <ul>
                { props.users.map((u) => <li>{ u }</li>) }
            </ul>
        </Row>;
    } else {
        return <div />;
    }
};

export class Index extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: any) {
        super(props);
        this.state = {
            domain: "",
            keybaseUsers: [],
            trustedUsers: [],
            barredUsers: []
        };
    }

    async componentDidMount() {
        // Get the active tab and store it in component state.
        const [ activeTab ] = await browser.tabs.query({ active: true });

        const domain = new URL(activeTab.url).hostname;

        this.setState({ domain });

        await browser.tabs.sendMessage(activeTab.id, new GetKeybaseUserForDomainEvent(domain))
            .then((res: GetKeybaseUserForDomainResponse) => {
                this.setState({
                    keybaseUsers: res.keybaseUsers,
                    trustedUsers: res.trusted,
                    barredUsers: res.barred
                });
            });
    }

    render() {
        return <div className="container">
            <WriteUsersList header="Trusted Keybase Users" users={ this.state.trustedUsers } />
            <WriteUsersList header="Barred Keybase Users" users={ this.state.barredUsers } />
        </div>;
    }
}
