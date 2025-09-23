import {IdentifySdk} from "./IdentifySdk";
import {IdentifyLogLevels} from "../constants/identifyLogLevel.js";

export class IdentifySdkBuilder {
    constructor() {
        this.api = '';
        this.socket = {url: '', port: ''};
        this.stun = {url: '', port: ''};
        this.turn = {url: '', port: '', username: '', password: ''};
        this.myVideoElement = null;
        this.peerVideoElement = null;
        this.logLevel = IdentifyLogLevels.INFO;
        this.lifeCycle = {
            socket: {
                onConnectionLost() {
                },
                onError() {
                }
            },
            room: {
                onAgentCome(data) {
                },
                onAgentLeave(data) {
                }
            },
            videoCall: {
                onQueueUpdate(data) {
                },
                onCancel(data) {
                },
                onCall(data) {
                },
                onTerminate() {
                },
                onRefuse() {
                }
            }
        };
        this.options = null;
    }

    setApi(api) {
        this.api = api;
        return this;
    }

    setStun(url, port) {
        this.stun = {url, port};
        return this;
    }

    setTurn(url, port, username, password) {
        this.turn = {url, port, username, password};
        return this;
    }

    setMyVideoElement(myVideoElement) {
        this.myVideoElement = myVideoElement;
        return this;
    }

    setPeerVideoElement(peerVideoElement) {
        this.peerVideoElement = peerVideoElement;
        return this;
    }

    setLifeCycle(lifeCycle) {
        this.lifeCycle = lifeCycle;
        return this;
    }

    setOptions(options) {
        this.options = options;
        return this;
    }

    setLogLevel(logLevel) {
        this.logLevel = logLevel;
        return this;
    }

    build() {
        return new IdentifySdk(this);
    }
}
