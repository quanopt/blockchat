import React from "react";
import {getMuiTheme, MuiThemeProvider} from "material-ui/styles";
import {applyMiddleware, createStore} from "redux";
import createSagaMiddleware from "redux-saga";
import reducer from "./utils/reducer";
import saga from "./utils/saga";
import { Switch, Route } from 'react-router-dom';
import {Provider} from "react-redux";
import injectTapEventPlugin from "react-tap-event-plugin";
import {connectedRouter, routerMiddleware, syncHistoryWithStore} from "react-router-redux";
import createHistory from 'history/createBrowserHistory'

import MessengerTheme from "./MessengerTheme";
import LoginPage from "./containers/LoginPage";
import SignUpPage from "./containers/SignUpPage";
import DashboardPage from "./containers/DashboardPage";

const history = createHistory();
const redrutMiddleware = routerMiddleware(history);
const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    reducer,
    applyMiddleware(redrutMiddleware, sagaMiddleware)
);
sagaMiddleware.run(saga);
injectTapEventPlugin();

class App extends React.Component {
    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(MessengerTheme)}>
                <Provider store={store}>
                    <Switch>
                        {/*<div style={{width: '100%', height: '100%', padding: 0, margin: 0}}>*/}
                        <Route exact path="/" component={LoginPage} />
                        <Route exact path="/login" component={LoginPage} />
                        <Route exact path="/signup" component={SignUpPage} />
                        <Route exact path="/dashboard" component={DashboardPage} />
                        {/*</div>*/}
                    </Switch>
                </Provider>
            </MuiThemeProvider>
        );
    }
}

export default App;
