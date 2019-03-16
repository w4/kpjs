import * as React from "react";
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import { getConfig, setConfig, ConfigKey } from '../../../common/config';

interface OptionProps {
    label: string;
    config: ConfigKey;
}

interface OptionState {
    selectedOption: string;
}

export class Option extends React.Component<OptionProps, OptionState> {
    state = {
        selectedOption: ''
    };

    async componentDidMount() {
        this.setState({ selectedOption: await getConfig(this.props.config) });
    }

    updateValue = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        await setConfig(this.props.config, value);
        this.setState({ selectedOption: value });
    };

    render() {
        return <TextField
            select
            fullWidth
            label={this.props.label}
            value={this.state.selectedOption}
            onChange={this.updateValue.bind(this)}
            margin="normal"
            variant="outlined">
            { Object.entries(this.props.config.options).map((o) => {
                return <MenuItem key={o[0]} value={o[0]}>{o[1]}</MenuItem>;
            }) }
        </TextField>;
    }
}
