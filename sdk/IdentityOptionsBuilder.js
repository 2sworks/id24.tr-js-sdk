import {IdentityOptions} from "./IdentityOptions.js";

export class IdentifyOptionBuilder {
    constructor() {
        this.identityType = [];
        this.nfcExceptionCount = 3;
        this.callConnectionTimeOut = 10000;
        this.videoRecordTime = 5000;
        this.openIntroPage = true;
    }

    setIdentityType(identityType) {
        if (Array.isArray(identityType)) {
            this.identityType = identityType;
        }
        return this;
    }

    setNfcExceptionCount(nfcExceptionCount) {
        this.nfcExceptionCount = nfcExceptionCount;
        return this;
    }

    setCallConnectionTimeOut(callConnectionTimeOut) {
        this.callConnectionTimeOut = callConnectionTimeOut;
        return this;
    }

    setVideoRecordTime(videoRecordTime) {
        this.videoRecordTime = videoRecordTime;
        return this;
    }

    setOpenIntroPage(openIntroPage) {
        this.openIntroPage = openIntroPage;
        return this;
    }

    build() {
        return new IdentityOptions(this);
    }
}