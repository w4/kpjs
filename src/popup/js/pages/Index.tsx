import * as React from 'react';
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../../../common/GetKeybaseUserForDomainEvent";

import { Row } from "../components/Row";
import { AllowUserEvent, DeniedUserEvent } from '../../../common/GetUsersAwaitingConsentEvent';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';

interface ToolbarProps {
}

interface ToolbarState {
    domain: string,
    keybaseUsers: string[],
    trustedUsers: string[],
    barredUsers: string[],
    needsApproval: string[]
}

export class Index extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: any) {
        super(props);
        this.state = {
            domain: "",
            keybaseUsers: [],
            trustedUsers: [],
            barredUsers: [],
            needsApproval: []
        };
    }

    async componentDidMount() {
        // Get the active tab and store it in component state.
        const [ activeTab ] = await browser.tabs.query({ active: true });

        const domain = new URL(activeTab.url).hostname;

        this.setState({ domain });

        await this.updateUsers();
    }

    async updateUsers() {
        const [ activeTab ] = await browser.tabs.query({ active: true });

        await browser.tabs.sendMessage(activeTab.id, new GetKeybaseUserForDomainEvent(this.state.domain))
            .then((res: GetKeybaseUserForDomainResponse) => {
                this.setState({
                    keybaseUsers: res.keybaseUsers,
                    trustedUsers: res.trusted,
                    barredUsers: res.barred,
                    needsApproval: res.pending
                });
            });
    }

    approve = async (user: string) => {
        const [ activeTab ] = await browser.tabs.query({ active: true });
        browser.tabs.sendMessage(activeTab.id, new AllowUserEvent(this.state.domain, user))
            .then(this.updateUsers.bind(this));
    }

    deny = async (user: string) => {
        const [ activeTab ] = await browser.tabs.query({ active: true });
        browser.tabs.sendMessage(activeTab.id, new DeniedUserEvent(this.state.domain, user))
            .then(this.updateUsers.bind(this));
    }

    render() {
        return <div className="container">
            <Row header="Trusted Keybase Users">
                { this.state.trustedUsers.map((u) => (
                    <Chip
                        avatar={
                            <Avatar>
                                <FaceIcon />
                            </Avatar>
                        }
                        color="primary"
                        label={u}
                        onClick={() => alert('clicked')}
                        onDelete={() => this.deny(u)} />
                )) }
            </Row>
            <Row header="Barred Keybase Users">
                <ul>
                    { this.state.barredUsers.map((u) => <li>
                        { u }&nbsp;
                        <a href="#" onClick={ e => this.approve(u) } style={{ color: '#4CAF50' }}>approve</a>
                    </li>) }
                </ul>
            </Row>
            <Row header="Needs Approval">
                <ul>
                    { this.state.needsApproval.map((u) => <li>
                        { u }&nbsp;
                        <a href="#" onClick={ e => this.approve(u) } style={{ color: '#4CAF50' }}>approve</a>&nbsp;
                        <a href="#" onClick={ e => this.deny(u) } style={{ color: '#F44336' }}>deny</a>
                    </li>) }
                </ul>
            </Row>

        </div>;
    }
}
