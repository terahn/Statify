import React, {Component} from 'react';
import {Radar, defaults} from 'react-chartjs-2';

class Chart extends Component {

    constructor(props) {
        super(props);
        
    }

    render() {
        return(
            <div className={this.props.className}>
            <Radar
                data={this.props.data}
                options={this.props.options}
                height={this.props.chartHeight}
            />
            </div>
        )
    }
}

export default Chart;