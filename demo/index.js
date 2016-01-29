//.factory("ringout", function($rootScope, $q, callMonitor, utils, logging, rcCore, rcPlatform, rcSIPUA, appstorage, settingsService, getLocaleString, $locale) { 'use strict';
var webPhone = RingCentral.WebPhone;

localStorage.webPhoneUUID = localStorage.webPhoneUUID || webPhone.utils.uuid();

var platform ;

function startCall(toNumber, fromNumber) {
    if (fromNumber == "")
        alert('Fill in the number');
    else {
        fromNumber = fromNumber || localStorage.webPhoneLogin;
        var countryId = null;
        platform
            .get('/restapi/v1.0/account/~/extension/~')
            .then(function (res) {
                var info = res.json();
                if (info && info.regionalSettings && info.regionalSettings.homeCountry) {
                    countryId = info.regionalSettings.homeCountry.id;
                }
            })
            .then(function () {
                console.log('SIP call to', toNumber, 'from', fromNumber);
                webPhone.sipUA.call(toNumber, fromNumber, countryId);
            });
    }
}

function mute(){
    webPhone.sipUA.mute(line);
    console.log('Call Mute');
}

function unmute(){
    webPhone.sipUA.unmute(line);
    console.log('Call Unmute');
}

function hold(){
    webPhone.sipUA.hold(line);
    console.log('Call Hold');
}

function unhold(){
    webPhone.sipUA.unhold(line);
    console.log('Call UnHold');
}

function answerIncomingCall(){
    webPhone.sipUA.answer(line);
    console.log('Answering Incoming Call');
}

function disconnect(){
    webPhone.sipUA.hangup(line);
    console.log('Hangup Call');
}

function isOnCall(){
    return webPhone.sipUA.onCall();
}


function reregister(){
    webPhone.sipUA.reregister();
    console.log('Reregistered SIP');
}


function unregisterSip(){
    webPhone.sipUA.unregister();
    console.log('Unregistered SIP');
}

function forceDisconnectSip(){
    webPhone.sipUA.forceDisconnect();
    console.log('Forcing SIP disconnection');
}


function startRecording(){
    line.record(true);
    console.log('Start Recording Call');
}

function stopRecording(){
    line.record(false);
    console.log('Stop Recording Call');
}


function callpark(){
    line.park();
    console.log('Call Parking');
}

function callflip(number){
    if(number=="")
        alert('Fill in the number');
    else
        line.flip(number)
}

function callTransfer(number){
    if(number=="")
        alert('Fill in the number');
    else {
        line.transfer(number)
        console.log('Call Transfer');
    }
}

function sendDTMF(DTMF){
    if(DTMF=="")
        alert('Fill in the DTMF');
    else {
        line.sendDTMF(DTMF)
        console.log('Send DTMF'+DTMF);
    }
}

function forward(number) {
    if (number == "")
        alert('Fill in the number');
    else {
        line.forward(number)
        console.log('Call Forwarding');
    }
}

function registerSIP(checkFlags, transport) {
    transport = transport || 'WSS';
    return platform
        .post('/client-info/sip-provision', {
            sipInfo: [{
                transport: transport
            }]
        })
        .then(function(res) {
            var data = res.json();

            if (!checkFlags || (typeof(data.sipFlags) === 'object' &&
                                //checking for undefined for platform v7.3, which doesn't support this flag
                                (data.sipFlags.outboundCallsEnabled === undefined || data.sipFlags.outboundCallsEnabled === true))) {
                console.log('SIP Provision data', data);
                 data = data.sipInfo[0];
                sipRegistrationData = data;
            }
            else {
                throw new Error('ERROR.sipOutboundNotAvailable'); //FIXME Better error reporting...
            }

            var headers = [];
            var endpointId = localStorage.webPhoneUUID;
            if (endpointId) {
                headers.push('P-rc-endpoint-id: ' + endpointId);
            }
            webPhone.utils.extend(data, {
                extraHeaders: headers
            });

            return webPhone.sipUA
                .register(data)
                .catch(function(e) {
                    var err = e && e.status_code && e.reason_phrase
                        ? new Error(e.status_code + ' ' + e.reason_phrase)
                        : (e && e.data)
                                  ? new Error('SIP Error: ' + e.data)
                                  : new Error('SIP Error: ' + (e || 'Unknown error'));
                    console.error('SIP Error: ' + ((e && e.data) || e));
                    return Promise.reject(err);
                });

        }).catch(function(e) {
            console.error(e);
            return Promise.reject(e);
        });
}

function app() {
    console.log('Sip Registered');
    webPhone.monitor.onUpdate(function() {
        console.log('Monitor update', arguments);
        document.getElementById('monitor').innerText = JSON.stringify(arguments, null, 2);

    });
}

function register(apikey,apisecret,username,password){
    var sdk = new RingCentral.SDK({
        appKey: apikey, //localStorage.webPhoneAppKey,
        appSecret: apisecret,//localStorage.webPhoneAppSecret,
        server: RingCentral.SDK.server.sandbox
    });
    platform = sdk.platform();
    platform
        .login({
            username: username,// localStorage.webPhoneLogin,
            password: password// localStorage.webPhonePassword
        })
        .then(function () {
            return registerSIP();
        })
        .then(app);
}