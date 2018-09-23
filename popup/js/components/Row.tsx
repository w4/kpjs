import * as React from "react";

interface RowProps {
    header: string
}

interface RowState {
}

export class Row extends React.Component<RowProps, RowState> {
    render() {
        return <div>
            <div className="row-header">{this.props.header}</div>

            <div className="row">
                {this.props.children}
            </div>
        </div>;
    }
}
