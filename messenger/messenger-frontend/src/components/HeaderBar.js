import React from "react";
import {connect} from "react-redux";
import {AppBar, RaisedButton} from "material-ui";

class HeaderBar extends React.Component {
    handleLogout = () => {
        this.props.history.push('/login');
        this.props.dispatch({type: 'API_LOGOUT'});
    }

    render() {
        return (
            <AppBar
                style={{height: 60}}
                title="Fabric Messenger"
                iconElementRight={(
                  <div style={styles.appbarRight}>
                    <div style={styles.username}>
                      {this.props.username}
                    </div>
                    <RaisedButton
                        style={styles.logoutButton}
                        label="Logout"
                        onClick={this.handleLogout}
                        secondary
                    />
                  </div>
                )}
            />
        );
    }
}

const styles = {
    username: {
        color: 'white',
        marginRight: 12,
    },
    appbarRight: {
      display: 'flex',
      height: '100%',
      alignItems: 'center',
      marginTop: -4,
      marginRight: 3
    },
    logoutButton: {
      height: 36,
    },
};

function mapStateToProps(state) {
    return {
        username: state.api.user.name,
    }
}

export default connect(mapStateToProps)(HeaderBar);
