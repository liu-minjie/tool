
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