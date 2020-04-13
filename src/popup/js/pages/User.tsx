import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Redirect } from "react-router";
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../../../common/GetKeybaseUserForDomainEvent";
import { KeybaseUser, Proof } from "../../../common/KeybaseUser";

import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import { Typography, Link, IconButton } from "@material-ui/core";
import CircularProgress from '@material-ui/core/CircularProgress';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Divider from '@material-ui/core/Divider';
import Skeleton from '@material-ui/lab/Skeleton';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

interface MatchParams {
    name: string;
}

interface UserProps extends RouteComponentProps<MatchParams> {}

interface UserState {
    user: KeybaseUser;
    back: boolean;
}

class User extends React.Component<UserProps, UserState> {
    constructor(props: any) {
        super(props);
        this.state = {
            user: null,
            back: false
        };
    }

    async componentDidMount() {
        const { match: { params }} = this.props;

        const [ activeTab ] = await browser.tabs.query({ active: true });
        const domain = new URL(activeTab.url).hostname;

        await browser.tabs.sendMessage(activeTab.id, new GetKeybaseUserForDomainEvent(domain))
            .then((res: GetKeybaseUserForDomainResponse) => {
                setTimeout(() =>
                this.setState({
                    user: res.keybaseUsers[params.name]
                }), 1000)
            });
    }

    render() {
        if (this.state.back) {
            return <Redirect to={'/'} />;
        }

        if (this.state.user) {
            return <div>
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <IconButton color="inherit" aria-label="Back" style={{position: 'absolute', left: 0}} onClick={() => this.setState({ back: true })}>
                            <ArrowBackIcon />
                        </IconButton>

                        <Grid container justify="center" alignItems="center">
                            <Typography variant="h6" color="inherit" style={{ marginTop: '-.3rem' }}>{this.state.user.name}</Typography>
                        </Grid>
                    </Toolbar>
                </AppBar>

                <div className="container">
                    <Grid container alignItems="center">
                        <Avatar src={this.state.user.avatar} style={{width: 60, height: 60}} />
                        <div style={{marginLeft: 6}}>
                            <Typography variant="subtitle1" style={{fontSize: '1.3rem', lineHeight: 1}}>{this.state.user.realName}</Typography>
                            <Typography variant="caption" style={{fontSize: '.9rem'}}>{this.state.user.location}</Typography>
                        </div>
                    </Grid>

                    <Divider style={{margin: 8}} />

                    {Object.entries(this.state.user.proofs).map(([k, v]: [string, Proof[]]) => (
                        <Grid container alignItems="center" style={{margin: 3}}>
                            <img src={`https://keybase.io/images/paramproofs/services/${k.includes('.') ? 'web' : k}/logo_black_16@2x.png`} width="16px" height="16px" />
                            <Typography style={{marginLeft: 3}}>{v[0].name}</Typography>
                            {v.map(p => (<Typography style={{marginLeft: 3}}><Link href={p.url}>{p.tag}</Link></Typography>))}
                        </Grid>
                    ))}
                </div>
            </div>;
        } else if (this.state.user === null) {
            return <div>
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <IconButton color="inherit" aria-label="Back" style={{position: 'absolute', left: 0}} onClick={() => this.setState({ back: true })}>
                            <ArrowBackIcon />
                        </IconButton>

                        <Grid container justify="center" alignItems="center">
                            <Skeleton variant="text" />
                        </Grid>
                    </Toolbar>
                </AppBar>

                <div className="container">
                    <Grid container alignItems="center">
                        <Skeleton variant="circle" width={60} height={60} />
                        <div style={{marginLeft: 6, width: 'calc(100% - 120px)' }}>
                            <Typography variant="subtitle1" style={{fontSize: '1.2rem', lineHeight: 1}}><Skeleton variant="text" /></Typography>
                            <Typography variant="caption" style={{fontSize: '1rem'}}><Skeleton variant="text" /></Typography>
                        </div>
                    </Grid>

                    <Divider style={{margin: 8}} />

                    <Skeleton variant="rect" width={'100%'} height={150} />
                </div>
            </div>;
        } else {
            return <div className="container">Not found!</div>
        }
    }
}

export default withRouter(User);
