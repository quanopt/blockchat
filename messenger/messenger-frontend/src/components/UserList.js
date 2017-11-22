import React from "react";
import {connect} from "react-redux";
import {Paper, List, ListItem, makeSelectable} from "material-ui";

import TextItem from "../components/TextItem";

let SelectableList = makeSelectable(List);

class UserList extends React.Component {
    render() {
        let userList = [];
        this.props.users.forEach((u, i) => {
            userList.push((<ListItem key={"user_list_item_" + i} value={i} primaryText={u} />));
        });

        return (
            <Paper style={this.props.style}>
                <TextItem text="Users" />
                <SelectableList
                    value={this.props.selectedUser}
                    onChange={this.selectUser}>
                    {userList}
                </SelectableList>
            </Paper>
        );
    }

    selectUser = (event, index) => {
        this.props.dispatch({type: "DASHBOARD_SELECT", index: index});
    }
}

function mapStateToProps(state) {
    return {
        users: state.api.users.map(u => u.Fullname),
        selectedUser: state.api.selectedUser
    }
}

export default connect(mapStateToProps)(UserList);
