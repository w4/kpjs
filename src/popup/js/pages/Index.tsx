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
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import ErrorOutlinedIcon from '@material-ui/icons/ErrorOutlined';
import { KeybaseUser } from '../../../common/KeybaseUser';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, withMobileDialog } from '@material-ui/core';
import Slide from '@material-ui/core/Slide';
import { Redirect } from 'react-router';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

function Transition(props: any) {
  return <Slide direction="up" {...props} />;
}

interface ToolbarProps {
}

interface ToolbarState {
    domain: string,
    keybaseUsers: {[name: string]: KeybaseUser},
    trustedUsers: string[],
    barredUsers: string[],
    needsApproval: string[],
    requiresApprovalDialogOpen: boolean,
    requiresApprovalDialogUser: string,
    redirectToProfile: string,
}

const pillTheme = createMuiTheme({
    palette: {
        primary: green,
        secondary: red
    },
});

export default class Index extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: any) {
        super(props);
        this.state = {
            domain: "",
            keybaseUsers: {},
            trustedUsers: [],
            barredUsers: [],
            needsApproval: [],
            requiresApprovalDialogOpen: false,
            requiresApprovalDialogUser: '',
            redirectToProfile: '',
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
        // TODO: get approval
        const [ activeTab ] = await browser.tabs.query({ active: true });
        browser.tabs.sendMessage(activeTab.id, new AllowUserEvent(this.state.domain, user))
            .then(this.updateUsers.bind(this));
    }

    deny = async (user: string) => {
        const [ activeTab ] = await browser.tabs.query({ active: true });
        browser.tabs.sendMessage(activeTab.id, new DeniedUserEvent(this.state.domain, user))
            .then(this.updateUsers.bind(this));
    }

    requiresApprovalDialogClose = (approved: boolean, user: string) => {
        if (approved == true) {
            this.approve(user);
        } else if (approved == false) {
            this.deny(user);
        }

        this.setState({ requiresApprovalDialogOpen: false });
    };

    getClickActionForUser = (name: string) => () => {
        // TODO: open profile
        this.setState({
            redirectToProfile: name
        });
    };

    getButtonActionForUser = (name: string) => () => {
        if (this.state.trustedUsers.includes(name)) {
            this.deny(name);
        } else {
            this.setState({
                requiresApprovalDialogUser: name,
                requiresApprovalDialogOpen: true
            });
        }
    };

    getButtonIconForUser = (name: string) => {
        if (this.state.trustedUsers.includes(name)) {
            return <CloseIcon />; // default button
        } else if (this.state.barredUsers.includes(name)) {
            return <CheckIcon />;
        } else {
            return <ErrorOutlinedIcon />
        }
    };

    render() {
        if (this.state.redirectToProfile) {
            return <Redirect to={`/user/${this.state.redirectToProfile}`} />
        }

        return <div>
            <AppBar position="static">
                <Toolbar variant="dense">
                    <Typography variant="h6" color="inherit">
                        KPJS
                    </Typography>
                </Toolbar>
            </AppBar>

            <div className="container" style={{minHeight: '11rem'}}>
                <MuiThemeProvider theme={pillTheme}>
                    { Object.entries(this.state.keybaseUsers).map(([name, u]) => (
                        <Chip
                            style={{margin: '1px'}}
                            avatar={
                                <Avatar src={u.avatar}>
                                    {!u.avatar ? <FaceIcon /> : ''}
                                </Avatar>
                            }
                            color={
                                this.state.barredUsers.includes(name)
                                    ? 'secondary'
                                    : (this.state.trustedUsers.includes(name)
                                        ? 'primary'
                                        : 'inherit')
                            }
                            label={name}
                            onClick={this.getClickActionForUser(name)}
                            onDelete={this.getButtonActionForUser(name)}
                            deleteIcon={this.getButtonIconForUser(name)} />
                    )) }
                </MuiThemeProvider>

                <Dialog
                    fullScreen
                    open={this.state.requiresApprovalDialogOpen}
                    onClose={this.requiresApprovalDialogClose.bind(this, null, null)}
                    TransitionComponent={Transition}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description">
                    <DialogTitle id="alert-dialog-title">Allow scripts from {this.state.requiresApprovalDialogUser}?</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            This will allow all scripts signed by this user to run on this website now and in the future.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.requiresApprovalDialogClose.bind(this, true, this.state.requiresApprovalDialogUser)} color="primary">
                            Allow
                        </Button>
                        <Button onClick={this.requiresApprovalDialogClose.bind(this, false, this.state.requiresApprovalDialogUser)} color="secondary">
                            Deny
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>;
    }
}