/* @flow */

import {fork} from "redux-saga/effects";
import APISaga from "./APISaga";

export default function* () {
    yield [
        fork(APISaga),
    ]
};