"use strict";

const fs = require('fs');
const spawn = require('child_process').spawn;
const shell = require('shelljs');
const request = require('request');
const btoa = require('btoa');
const WebCrypto = require("node-webcrypto-ossl");
const ASN1 = require('./asn1');
const Base64 = require('./base64');
const Hex = require('./hex');
const certData = require('./certData');


// global variables
//CA = "https://acme-staging.api.letsencrypt.org",
const CA = "https://acme-v01.api.letsencrypt.org";
const TERMS = "https://letsencrypt.org/documents/LE-SA-v1.1.1-August-1-2016.pdf";
const OPENSSL_HEX = /(?:\(stdin\)= |)([a-f0-9]{512,1024})/;
const ACCOUNT_EMAIL = 'xx@xx.xx';
const DNS = ['DNS:xx.xxx.xx'];
const webcrypto = new WebCrypto();


let ACCOUNT_PUBKEY; 
let DOMAINS;
let CSR;
let pemData;
let commands = {};
let results = {};
let checkTimer;


const hex2b64 = (hex) => {
    if (!OPENSSL_HEX.test(hex)) {
        return null;
    }
    hex = OPENSSL_HEX.exec(hex)[1];
    const bytes = [];
    while(hex.length >= 2){
        bytes.push(parseInt(hex.substring(0, 2), 16));
        hex = hex.substring(2, hex.length);
    }
    return b64(new Uint8Array(bytes));
}


const makeDhparam = () => {
    console.log('makeDhparam........');
    executeCommand('openssl dhparam -out dhparam.pem 4096');

    shell.exec('nginx -s stop');
    executeCommand('cp chained.pem /etc/ssl/certs/chained.pem');
    executeCommand('cp dhparam.pem /etc/ssl/certs/dhparam.pem');
    executeCommand('cp domain.key /etc/ssl/private/domain.key');
    killProcess();
    console.log('all over');
}
const writeCert = (data) => {
    console.log('writeCert....');
    fs.writeFile('chained.pem', data, (error) => {
        if (error) {
            console.log(data);
            process.exit(1);
        }
        makeDhparam();
    });
}


const executeCommand = (cmd, ret) => {
    let  value = shell.exec(cmd, {silent: true});
    if (value.code !== 0) {
        console.error(cmd);
        process.exit(1);
    }

    if (ret) {
        value = JSON.stringify(value);
        value = value.substring(1);
        value = value.substring(0, value.length - 1);
        value = value.replace(/\\n/g, '');
        return value;
    }
}

const fail = (msg, err) => {
    console.error(msg, err);
    ACCOUNT_PUBKEY = undefined;
    CSR = undefined;
    DOMAINS = undefined;
    commands = {};
    results = {};
    killProcess();
}



const killProcess = (count, cb) => {
    count = count || 0;
    setTimeout(() => {
        while (true) {
            let ret = shell.exec('pgrep "python2"', {silent: true});
            let pid = JSON.stringify(ret);

            if (pid) {
                pid = pid.replace(/[^\d]/g, '');
            }

            if (!pid) {
                break
            }

            ret = shell.exec(`ps -f -p ${pid}`, {silent: true});
            ret = JSON.stringify(ret);
            if (ret.indexOf('python2 -c import BaseHTTPServer') !== -1) {
                console.log('kill ' + pid);
                shell.exec('kill ' + pid);
            }
        }


        let ret = shell.exec('nginx', {silent: true});

        if (ret.code !== 0) {
            ret = shell.exec('nginx -s reload');
            if (ret.code !== 0) {
                count++;
                if (count < 6) {
                    console.log('try again kill ---------------');
                    killProcess(count, cb);
                } else {
                    console.log('can not kill process!!!!!!!!!!!');
                }
            } else {
                cb && cb();
            }
        } else {
            cb && cb();
        }
    }, 500);
}
const makeServer = (cmd) => {
    shell.exec('nginx -s stop');
    
    const child = spawn('node', ['python.js', cmd], {
        stdio:  'ignore', //[ 'ignore', out, err ],
        detached: true,
    });
    child.unref();
    return (cb) => {
        try {
            process.kill( child.pid );
        } catch (e) {
            console.log(e);
        }
        killProcess(0, cb);
    }
}

const b64 = (bytes) => {
    const str64 = typeof(bytes) === "string" ? btoa(bytes) : btoa(String.fromCharCode.apply(null, bytes));
    return str64.replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

const sha256 = (bytes, callback) => {
    const hash = webcrypto.subtle.digest({name: "SHA-256"}, bytes);
    hash.then((result) => {
        callback(new Uint8Array(result), undefined);
    }).catch((error) => {
        callback(undefined, error);
    });
}

// helper function to get a nonce via an ajax request to the ACME directory
const getNonce = (callback) => {
    console.log('getNonce..........');
    const cachebuster = b64(webcrypto.getRandomValues(new Uint8Array(8)));
    request.head(CA + "/directory?cachebuster=" + cachebuster, (err, res, body) => {
        console.log('nonce: ', res.headers['replay-nonce']);
        callback(res.headers['replay-nonce'], undefined);
    }).on('error', () => {
        console.error('nonce error !!!!!!!!');
        callback(undefined, {});
    });
}





const checkAllDomains = () => {
    // check to see if all confirmed
    let all_confirmed = true;
    for(let domain in DOMAINS){
        if(DOMAINS[domain]['confirmed'] !== true){
            all_confirmed = false;
        }
    }

    // not all confirmed, so don't request certificate yet
    if(!all_confirmed){
        return;
    }

    // all confirmed, so get certificate!
    console.log('signing certificate...');

    request.post({url: CA + "/acme/new-cert", encoding: null, form: JSON.stringify({
        "header": ACCOUNT_PUBKEY['jwk'],
        "protected": CSR['protected'],
        "payload": CSR['payload'],
        "signature": CSR['sig'],
    })}, (err,res, body) => { 
        console.log(res.statusCode)
        if(res.statusCode === 201){
            // format cert into PEM format
            const crt64 = btoa(String.fromCharCode.apply(null, body));
            let pem = "-----BEGIN CERTIFICATE-----\n";
            for(let i = 0; i < Math.ceil(crt64.length / 64.0); i++){
                pem += crt64.substr(i * 64, 64) + "\n";
            }
            pem += "-----END CERTIFICATE-----";
            pemData = pem;
            if (certData) {
                writeCert(pemData + '\n' + certData);
            }
        } else{
            fail("Certificate signature failed. Please start back at Step 1. " + String.fromCharCode.apply(null,  body), true);
        }
    }).on('error', () => {
        console.log(arguments);
    });
}

const confirmDomainCheckIsRunning = (d, callback) => {
    const d_ = d.replace(/\./g, "_");

    // if anything is missing, start over
    if(!(ACCOUNT_PUBKEY && CSR && DOMAINS)){
        return fail("Something went wrong. Please go back to Step 1.", true);
    }

    // if the signature is missing, fail
    const challenge_sig = hex2b64(results[d_]);
    if(challenge_sig === null){
        return fail("You need to run the above signature command and paste the output in the text box.");
    }
    DOMAINS[d]['challenge_sig'] = challenge_sig;

    // function to check on challenge status
    const checkOnChallenge = () => {
        console.log('checking on status... ' + d);
        request.get(DOMAINS[d]['challenge_uri'], (err, res, body) => {
            if (res.statusCode === 202){
                const check = JSON.parse(body);
                if(check['status'] === "pending"){
                    console.log(d + ' still testing... ');
                    setTimeout(checkOnChallenge, 1000);
                } else if (check['status'] === "valid"){
                    console.log('Domain: ' + d + ' verified! ');
                    DOMAINS[d]['confirmed'] = true;
                    callback();
                    clearTimeout(checkTimer);
                    checkTimer = setTimeout(checkAllDomains, 3000);
                } else {
                    fail("status: Domain challenge failed. Please start back at Step 1. " + body, true);
                }
            } else {
                fail("code: Domain challenge failed. Please start back at Step 1. " + body, true);
            }
        });
    }

    // request the challenge be checked
    console.log('testing ' + d + '... ');

    request.post(DOMAINS[d]['challenge_uri'], {form: JSON.stringify({
        "header": ACCOUNT_PUBKEY['jwk'],
        "protected": DOMAINS[d]['challenge_protected'],
        "payload": DOMAINS[d]['challenge_payload'],
        "signature": DOMAINS[d]['challenge_sig'],
    })}, (err,res, body) => { 
        if(res.statusCode === 202){
            console.log('done testing ' + d);
            setTimeout(checkOnChallenge, 1000);
        }else{
            fail("Domain challenge failed. Please start back at Step 1. " + body, true);
        }
    }).on('error', () => {
        console.log(arguments);
        killProcess();
    });
}

const validateInitialSigs = () => {

    if(!(ACCOUNT_PUBKEY && CSR && DOMAINS)){
        return fail("Something went wrong. Please go back to Step 1.", true);
    }

    // parse account registration signature
    const account_sig = hex2b64(results[0]);
    const missing_msg = "You need to run the above commands and paste the output in the text boxes below each command.";
    if(!account_sig){
        return fail(missing_msg);
    }
    ACCOUNT_PUBKEY['sig'] = account_sig;

    // parse new-authz signatures
    for(let d in DOMAINS){
        const d_ = d.replace(/\./g, "_");
        const domain_sig = hex2b64(results[d_]);
        if(!domain_sig){
            return fail(missing_msg);
        }
        DOMAINS[d]['request_sig'] = domain_sig;
    }

    // parse csr signature
    const csr_sig = hex2b64(results[1]);
    if(!csr_sig){
        return fail(missing_msg);
    }
    CSR['sig'] = csr_sig;

    // request challenges for each domain
    const domains = []
    for(let d in DOMAINS){
        domains.push(d);
    }
    let i = 0;
    const requestChallenges = () => {
        const d = domains[i];
        console.log('validating domain: ' + d + ' .............');
        const d_ = d.replace(/\./g, "_");

        request.post(CA + "/acme/new-authz", {form: JSON.stringify({
            "header": ACCOUNT_PUBKEY['jwk'],
            "protected": DOMAINS[domains[i]]['request_protected'],
            "payload": DOMAINS[domains[i]]['request_payload'],
            "signature": DOMAINS[domains[i]]['request_sig'],
        })}, (err,res, body) => { 
            if(res.statusCode === 201){
                const resp = JSON.parse(body);
                if (!resp.challenges) {
                    return
                }

                for(let c = 0; c < resp['challenges'].length; c++){
                    if(resp['challenges'][c]['type'] === "http-01"){
                        const keyAuthorization = resp['challenges'][c]['token'] + "." + ACCOUNT_PUBKEY['thumbprint'];
                        DOMAINS[d]['challenge_uri'] = resp['challenges'][c]['uri'];
                        DOMAINS[d]['server_data'] = keyAuthorization;
                        DOMAINS[d]['server_uri'] = ".well-known/acme-challenge/" + resp['challenges'][c]['token'];
                        
                        const link = "http://" + d + "/" + DOMAINS[d]['server_uri'];
                        DOMAINS[d]['challenge_payload'] = b64(JSON.stringify({
                            resource: "challenge",
                            keyAuthorization: keyAuthorization,
                        }));
                        DOMAINS[d]['challenge_protected'] = b64(JSON.stringify({
                            nonce: res.headers["replay-nonce"],
                        }));
                        break;
                    }
                }

                // populate step 4 template for this domain



                const cmd = "PRIV_KEY=./account.key; " +
                    "echo -n \"" + DOMAINS[d]['challenge_protected'] + "." + DOMAINS[d]['challenge_payload'] + "\" | " +
                    "openssl dgst -sha256 -hex -sign $PRIV_KEY";

                results[d_] =  executeCommand(cmd, true);


                const server = "python2 -c \"import BaseHTTPServer; \\\n" +
                    "    h = BaseHTTPServer.BaseHTTPRequestHandler; \\\n" +
                    "    h.do_GET = lambda r: r.send_response(200) or r.end_headers() " +
                            "or r.wfile.write('" + DOMAINS[d]['server_data'] + "'); \\\n" +
                    "    s = BaseHTTPServer.HTTPServer(('0.0.0.0', 80), h); \\\n" +
                    "    s.serve_forever()\"";

                const callback = makeServer(server);


                // append this domain to step 4
                confirmDomainCheckIsRunning(d, () => {
                    setTimeout( () => {
                        callback(() => {
                            if (i < (domains.length - 1)) {
                                i += 1;
                                requestChallenges();
                            } else {
                                console.log('Step 3, 4 complete!');
                            }
                        });
                    }, 1000);
                });
            } else {
                fail("Domain failed. Please start back at Step 1. " + body, true);
            }
        }).on('error', () => {
            console.log(arguments);
        });
    }

    // register the account
    console.log('register the account........');
    request.post(CA + "/acme/new-reg", {form: JSON.stringify({
        "header": ACCOUNT_PUBKEY['jwk'],
        "protected": ACCOUNT_PUBKEY['protected'],
        "payload": ACCOUNT_PUBKEY['payload'],
        "signature": ACCOUNT_PUBKEY['sig'],
    })}, (err,res,body) => { 
        if (res.statusCode === 201 || res.statusCode === 409) {
            console.log("account registered");
            requestChallenges();
        } else {
            console.error('register code: ', res.statusCode);
        }
    }).on('error', () => {
        console.log(arguments);
    });
}

const validateCSR = () => {

    // make sure there's an account public key and email
    if(!(ACCOUNT_PUBKEY)){
        return fail("Need to complete Step 1 first.");
    }


    executeCommand('openssl genrsa 4096 > domain.key');
    executeCommand('cp -f /etc/ssl/openssl.cnf .');
    executeCommand('echo "[SAN]\nsubjectAltName=' + DNS.join(',') + '" >> ./openssl.cnf');
    let csr = executeCommand('openssl req -new -sha256 -key domain.key -subj "/" -reqexts SAN -config "./openssl.cnf"', true);
    csr = csr.replace('-----BEGIN CERTIFICATE REQUEST-----', '-----BEGIN CERTIFICATE REQUEST-----\n')
    csr = csr.replace('-----END CERTIFICATE REQUEST-----', '\n-----END CERTIFICATE REQUEST-----')
    

    const unarmor = /-----BEGIN CERTIFICATE REQUEST-----([A-Za-z0-9+\/=\s]+)-----END CERTIFICATE REQUEST-----/;
    if(!unarmor.test(csr)){
        return fail("Your CSR isn't formatted correctly.");
    }

    // find domains in the csr
    const domains = [];
    try{
        const csrAsn1 = ASN1.decode(Base64.decode(unarmor.exec(csr)[1]));

        // look for commonName in attributes
        if(csrAsn1.sub[0].sub[1].sub){
            const csrIds = csrAsn1.sub[0].sub[1].sub;
            for(let i = 0; i < csrIds.length; i++){
                const oidRaw = csrIds[i].sub[0].sub[0];
                const oidStart = oidRaw.header + oidRaw.stream.pos;
                const oidEnd = oidRaw.length + oidRaw.stream.pos + oidRaw.header;
                const oid = oidRaw.stream.parseOID(oidStart, oidEnd, Infinity);
                if(oid === "2.5.4.3"){
                    const cnRaw = csrIds[i].sub[0].sub[1];
                    const cnStart = cnRaw.header + cnRaw.stream.pos;
                    const cnEnd = cnRaw.length + cnRaw.stream.pos + cnRaw.header;
                    domains.push(cnRaw.stream.parseStringUTF(cnStart, cnEnd));
                }
            }
        }

        // look for subjectAltNames
        if(csrAsn1.sub[0].sub[3].sub){

            // find the PKCS#9 ExtensionRequest
            const xtns = csrAsn1.sub[0].sub[3].sub;
            for(let i = 0; i < xtns.length; i++){
                const oidRaw = xtns[i].sub[0];
                const oidStart = oidRaw.header + oidRaw.stream.pos;
                const oidEnd = oidRaw.length + oidRaw.stream.pos + oidRaw.header;
                const oid = oidRaw.stream.parseOID(oidStart, oidEnd, Infinity);
                if(oid === "1.2.840.113549.1.9.14"){

                    // find any subjectAltNames
                    for(let j = 0; j < xtns[i].sub[1].sub.length ? xtns[i].sub[1].sub : 0; j++){
                        for(let k = 0; k < xtns[i].sub[1].sub[j].sub.length ? xtns[i].sub[1].sub[j].sub : 0; k++){
                            const oidRaw = xtns[i].sub[1].sub[j].sub[k].sub[0];
                            const oidStart = oidRaw.header + oidRaw.stream.pos;
                            const oidEnd = oidRaw.length + oidRaw.stream.pos + oidRaw.header;
                            const oid = oidRaw.stream.parseOID(oidStart, oidEnd, Infinity);
                            if(oid === "2.5.29.17"){

                                // add each subjectAltName
                                const sans = xtns[i].sub[1].sub[j].sub[k].sub[1].sub[0].sub;
                                for(let s = 0; s < sans.length; s++){
                                    const sanRaw = sans[s];
                                    const tag = sanRaw.tag.tagNumber;
                                    if(tag !== 2)
                                        continue; // ignore any other subjectAltName type than dNSName (2)
                                    const sanStart = sanRaw.header + sanRaw.stream.pos;
                                    const sanEnd = sanRaw.length + sanRaw.stream.pos + sanRaw.header;
                                    domains.push(sanRaw.stream.parseStringUTF(sanStart, sanEnd));
                                }
                            }
                        }
                    }
                }
            }
        }
    }catch(err){
        return fail("Failed validating CSR.");
    }

    // reject CSRs with no domains
    if(domains.length === 0){
        return fail("Couldn't find any domains in the CSR.");
    }

    // update the globals
    CSR = {csr: b64(new Uint8Array(Base64.decode(unarmor.exec(csr)[1])))};
    DOMAINS = {};
    let shortest_domain = domains[0];
    for(let d = 0; d < domains.length; d++){
        DOMAINS[domains[d]] = {};
        if(shortest_domain.length < domains[d].length){
            shortest_domain = domains[d];
        }
    }

    //build account registration payload
    getNonce((nonce, err) => {
        ACCOUNT_PUBKEY['protected'] = b64(JSON.stringify({nonce: nonce}));
        ACCOUNT_PUBKEY['payload'] = b64(JSON.stringify({
            resource: "new-reg",
            contact: ["mailto:" + ACCOUNT_EMAIL],
            agreement: TERMS,
        }));
    });

    //build csr payload
    getNonce((nonce, err) => {
        CSR['protected'] = b64(JSON.stringify({nonce: nonce}));
        CSR['payload'] = b64(JSON.stringify({
            resource: "new-cert",
            csr: CSR['csr'],
        }));
    });

    //build domain payloads
    const buildDomain =  (domain) => {
        getNonce((nonce, err) => {
            DOMAINS[domain]['request_protected'] = b64(JSON.stringify({nonce: nonce}));
            DOMAINS[domain]['request_payload'] = b64(JSON.stringify({
                resource: "new-authz",
                identifier: {
                    type: "dns",
                    value: domain,
                },
            }));
        });
    }

    domains.forEach( (item) => {
        buildDomain(item);
    })

    //Wait for all the data payloads to finish building
    const waitForPayloads = () => {

        // check to see if account, csr, and domain new-authz are built
        let still_waiting = false;
        if(ACCOUNT_PUBKEY['payload'] === undefined || CSR['payload'] === undefined){
            still_waiting = true;
        }
        for(let d in DOMAINS){
            if(DOMAINS[d]['request_payload'] === undefined){
                still_waiting = true;
            }
        }

        // wait another period for nonces to load
        if(still_waiting){
            setTimeout(waitForPayloads, 1000);
        }

        // show the success text (simulate a delay so it looks like we thought hard)
        else {

            let cmd  = "PRIV_KEY=./account.key; " +
                "echo -n \"" + ACCOUNT_PUBKEY['protected'] + "." + ACCOUNT_PUBKEY['payload'] + "\" | " +
                "openssl dgst -sha256 -hex -sign $PRIV_KEY";
            commands[0] = cmd;


            // build the domain signature commands
            for(let d in DOMAINS){
                const d_ = d.replace(/\./g, "_");
                cmd =  "PRIV_KEY=./account.key; " +
                    "echo -n \"" + DOMAINS[d]['request_protected'] + "." + DOMAINS[d]['request_payload'] + "\" | " +
                    "openssl dgst -sha256 -hex -sign $PRIV_KEY";
                    
                commands[d_] = cmd;
            }

            // build the csr registration signature command
            cmd = "PRIV_KEY=./account.key; " +
                    "echo -n \"" + CSR['protected'] + "." + CSR['payload'] + "\" | " +
                    "openssl dgst -sha256 -hex -sign $PRIV_KEY";

            commands[1] = cmd;

            console.log('Found domains! Proceed to Step 3!');

            Object.keys(commands).forEach( (key) => {
                results[key] = executeCommand(commands[key], true);
            });

            validateInitialSigs();
        }
    }
    setTimeout(waitForPayloads, 1000);
}

const validateAccount = () => {

    executeCommand('openssl genrsa 4096 > account.key');

    let pubkey = executeCommand('openssl rsa -in account.key -pubout', true);
    pubkey = pubkey.replace('-----BEGIN PUBLIC KEY-----', '-----BEGIN PUBLIC KEY-----\n');
    pubkey = pubkey.replace('-----END PUBLIC KEY-----', '\n-----END PUBLIC KEY-----');

    const unarmor = /-----BEGIN PUBLIC KEY-----([A-Za-z0-9+\/=\s]+)-----END PUBLIC KEY-----/;


    // find RSA modulus and exponent
    let exponent;
    let modulus;

    try {
        const pubkeyAsn1 = ASN1.decode(Base64.decode(unarmor.exec(pubkey)[1]));
        const modulusRaw = pubkeyAsn1.sub[1].sub[0].sub[0];
        const modulusStart = modulusRaw.header + modulusRaw.stream.pos + 1;
        const modulusEnd = modulusRaw.length + modulusRaw.stream.pos + modulusRaw.header;
        const modulusHex = modulusRaw.stream.hexDump(modulusStart, modulusEnd);
        modulus = Hex.decode(modulusHex);
        const exponentRaw = pubkeyAsn1.sub[1].sub[0].sub[1];
        const exponentStart = exponentRaw.header + exponentRaw.stream.pos;
        const exponentEnd = exponentRaw.length + exponentRaw.stream.pos + exponentRaw.header;
        const exponentHex = exponentRaw.stream.hexDump(exponentStart, exponentEnd);
        exponent = Hex.decode(exponentHex);
    } catch (err) {
        return fail("Failed validating RSA public key.", err);
    }

    // generate the jwk header and bytes
    const jwk = {
        "e": b64(new Uint8Array(exponent)),
        "kty": "RSA",
        "n": b64(new Uint8Array(modulus)),
    }

    const jwk_bytes = [].map.call(JSON.stringify(jwk), (item) => {
        return item.charCodeAt(0);
    });

    sha256(new Uint8Array(jwk_bytes), (hash, err) => {
        if (err) {
            return fail("Thumbprint failed: " + err.message);
        }

        // update the globals
        ACCOUNT_PUBKEY = {
            pubkey: pubkey,
            jwk: {
                alg: "RS256",
                jwk: jwk,
            },
            thumbprint: b64(hash),
        };

       setTimeout(() => {
            console.log("Looks good! Proceed to Step 2!");
            validateCSR();
        }, 300);
    });
}

validateAccount();




// function getCert () {
//     request.get('https://gethttpsforfree.com/', function (err, res, body) {
//       var start = '-----BEGIN CERTIFICATE-----'
//       body = body.substring(body.indexOf(start));
//       var end = '-----END CERTIFICATE-----';
//       body = body.substring(0, body.indexOf(end) + end.length);
//       certData = body;

//       if (pemData) {
//         writeCert(pemData + '\n' + certData);
//       }
//     });
// }
