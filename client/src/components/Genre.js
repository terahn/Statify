import React, {Component} from 'react';
import './Genre.css'

class Genre extends Component {

    render() {
        return(
            <div className="genre-item">
                <div className="genre-name">{this.props.label}</div>
                <div className="genre-value" style={{width: this.props.value + '%'}}></div>
            </div>
            
        )
    }

    
}

export default Genre;