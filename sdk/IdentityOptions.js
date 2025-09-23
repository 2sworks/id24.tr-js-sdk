export class IdentityOptions {
    constructor(builder) {
        this.identityType = builder.identityType;
        this.nfcExceptionCount = builder.nfcExceptionCount;
        this.callConnectionTimeOut = builder.callConnectionTimeOut;
        this.videoRecordTime = builder.videoRecordTime;
        this.openIntroPage = builder.openIntroPage;
    }

    toJSON() {
        return {
            identityType: this.identityType,
            nfcExceptionCount: this.nfcExceptionCount,
            callConnectionTimeOut: this.callConnectionTimeOut,
            videoRecordTime: this.videoRecordTime,
            openIntroPage: this.openIntroPage
        };
    }
}
