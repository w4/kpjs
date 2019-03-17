import * as React from "react";
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../../../common/GetKeybaseUserForDomainEvent";
import { KeybaseUser, Proof } from "../../../common/KeybaseUser";

import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import { Typography, Link, IconButton } from "@material-ui/core";
import CircularProgress from '@material-ui/core/CircularProgress';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Divider from '@material-ui/core/Divider';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

interface UserProps {
    match: { params: { name: string }};
};

interface UserState {
    user: KeybaseUser;
}

export default class User extends React.Component<UserProps, UserState> {
    constructor(props: any) {
        super(props);
        this.state = {
            user: null
        };
    }

    async componentDidMount() {
        const { match: { params }} = this.props;

        const [ activeTab ] = await browser.tabs.query({ active: true });
        const domain = new URL(activeTab.url).hostname;

        await browser.tabs.sendMessage(activeTab.id, new GetKeybaseUserForDomainEvent(domain))
            .then((res: GetKeybaseUserForDomainResponse) => {
                this.setState({
                    user: res.keybaseUsers[params.name]
                });
            });
    }

    render() {
        if (this.state.user) {
            return <div>
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <IconButton color="inherit" aria-label="Back">
                            <ArrowBackIcon />
                        </IconButton>
                        <Grid container justify="center" alignItems="center">
                            <Typography variant="h6" color="inherit">{this.state.user.name}</Typography>
                        </Grid>
                    </Toolbar>
                </AppBar>

                <div className="container">
                    <Grid container justify="center" alignItems="center">
                        <Avatar src={this.state.user.avatar} style={{width: 60, height: 60}} />
                        <div style={{marginLeft: 3}}>
                            <Typography variant="subtitle1" style={{lineHeight: 1}}>{this.state.user.realName}</Typography>
                            <Typography variant="caption">{this.state.user.location}</Typography>
                        </div>
                    </Grid>

                    <Divider style={{margin: 8}} />

                    {Object.entries(this.state.user.proofs).map(([k, v]: [string, Proof[]]) => (
                        <Grid container alignItems="center" style={{margin: 3}}>
                            <img src={`https://keybase.io/images/paramproofs/services/${k.includes('.') ? 'web' : k}/logo_black_16@2x.png`} width="16px" height="16px" />
                            <Typography inline style={{marginLeft: 3}}>{v[0].name}</Typography>
                            {v.map(p => (<Typography inline style={{marginLeft: 3}}><Link href={p.url}>{p.tag}</Link></Typography>))}
                        </Grid>
                    ))}
                </div>
            </div>;
        } else if (this.state.user === null) {
            return <div>
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <Typography variant="h6" color="inherit">
                            KPJS
                        </Typography>
                    </Toolbar>
                </AppBar>

                <CircularProgress />
            </div>;
        } else {
            return <div className="container">Not found!</div>
        }
    }
}