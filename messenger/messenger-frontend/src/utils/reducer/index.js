/* @flow */

import {combineReducers} from "redux";
import {routerReducer} from "react-router-redux";


import APIReducer from "./APIReducer";

export default combineReducers({
    routing: routerReducer,
    api: APIReducer,
})
