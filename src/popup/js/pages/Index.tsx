import * as React from 'react';
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../../../common/GetKeybaseUserForDomainEvent";

import { Row } from "../components/Row";
import { AllowUserEvent, DeniedUserEvent } from '../../../common/GetUsersAwaitingConsentEvent';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import Typography from '@material-ui/core/Typography';
import DoneIcon from '@material-ui/icons/Done';
import { KeybaseUser } from '../../../common/KeybaseUser';


interface ToolbarProps {
}

interface ToolbarState {
    domain: string,
    keybaseUsers: {[name: string]: KeybaseUser},
    trustedUsers: string[],
    barredUsers: string[],
    needsApproval: string[]
}

const pillTheme = createMuiTheme({
    palette: {
        primary: green,
        secondary: red
    },
});

export class Index extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: any) {
        super(props);
        this.state = {
            domain: "",
            keybaseUsers: {},
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
            <MuiThemeProvider theme={pillTheme}>
                <div>
                    <Typography variant="h6" color="inherit">Trusted Users</Typography>
                    { this.state.trustedUsers.map((u) => (
                        <Chip
                            avatar={
                                <Avatar src={this.state.keybaseUsers[u].avatar}>
                                    {!this.state.keybaseUsers[u].avatar ? <FaceIcon /> : ''}
                                </Avatar>
                            }
                            color="primary"
                            label={u}
                            onClick={() => alert('clicked')}
                            onDelete={() => this.deny(u)} />
                    )) }
                </div>

                <div>
                    <Typography variant="h6" color="inherit">Barred Users</Typography>
                    { this.state.barredUsers.map((u) => (
                        <Chip
                            avatar={
                                <Avatar src={this.state.keybaseUsers[u].avatar}>
                                    {!this.state.keybaseUsers[u].avatar ? <FaceIcon /> : ''}
                                </Avatar>
                            }
                            color="secondary"
                            label={u}
                            onClick={() => alert('clicked')}
                            onDelete={() => this.approve(u)}
                            deleteIcon={<DoneIcon />} />
                    )) }
                </div>
            </MuiThemeProvider>

            <div>
                <Typography variant="h6" color="inherit">Needs Approval</Typography>
                { this.state.needsApproval.map((u) => (
                    <Chip
                        avatar={
                            <Avatar src={this.state.keybaseUsers[u].avatar}>
                                {!this.state.keybaseUsers[u].avatar ? <FaceIcon /> : ''}
                            </Avatar>
                        }
                        color="primary"
                        label={u}
                        onClick={() => alert('clicked')}
                        onDelete={() => this.approve(u)}
                        deleteIcon={<DoneIcon />} />
                )) }
            </div>
        </div>;
    }
}
