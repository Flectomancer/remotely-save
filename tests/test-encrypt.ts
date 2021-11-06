import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { base64ToBase32, bufferToArrayBuffer } from "../src/misc";
import {
  decryptArrayBuffer,
  decryptBase32ToString,
  encryptArrayBuffer,
  encryptStringToBase32,
} from "../src/encrypt";

describe("Encryption tests", () => {
  beforeEach(function () {
    global.window = {
      crypto: require("crypto").webcrypto,
    } as any;
  });

  it("should encrypt string", async () => {
    const k = "dkjdhkfhdkjgsdklxxd";
    const password = "hey";
    expect(await encryptStringToBase32(k, password)).to.not.equal(k);
  });

  it("should encrypt and decrypt string and get the same result returned", async () => {
    const k = "jfkkjkjbce7983ycdeknkkjckooAIUHIDIBIE((*BII)njD/d/dd/d/sjxhux";
    const password = "hfiuibec989###oiu982bj1`";
    const enc = await encryptStringToBase32(k, password);
    // console.log(enc);
    const dec = await decryptBase32ToString(enc, password);
    // console.log(dec);
    expect(dec).equal(k);
  });

  it("should encrypt text file and get the same result as openssl", async () => {
    const fileContent = (
      await fs.readFileSync(
        path.join(__dirname, "static_assets", "sometext.txt")
      )
    ).toString("utf-8");
    const password = "somepassword";
    const saltHex = "8302F586FAB491EC";
    const enc = await encryptStringToBase32(
      fileContent,
      password,
      undefined,
      saltHex
    );

    // two command returns same result:
    // cat ./sometext.txt | openssl enc -p -aes-256-cbc -S 8302F586FAB491EC -pbkdf2 -iter 10000 -base64 -pass pass:somepassword
    // openssl enc -p -aes-256-cbc -S 8302F586FAB491EC -pbkdf2 -iter 10000 -base64 -pass pass:somepassword -in ./sometext.txt
    const opensslBase64Res =
      "U2FsdGVkX1+DAvWG+rSR7MSa+yJav1zCE7SSXiBooqwI5Q+LMpIthpk/pXkLj+25";
    // we output base32, so we need some transformation
    const opensslBase32Res = base64ToBase32(opensslBase64Res);

    expect(enc).equal(opensslBase32Res);
  });

  it("should encrypt binary file and get the same result as openssl", async () => {
    const testFolder = path.join(__dirname, "static_assets", "mona_lisa");
    const testFileName =
      "1374px-Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg";
    const fileArrBuf = bufferToArrayBuffer(
      await fs.readFileSync(path.join(testFolder, testFileName))
    );
    const password = "somepassword";
    const saltHex = "8302F586FAB491EC";
    const enc = await encryptArrayBuffer(
      fileArrBuf,
      password,
      undefined,
      saltHex
    );
    const opensslArrBuf = bufferToArrayBuffer(
      await fs.readFileSync(path.join(testFolder, testFileName + ".enc"))
    );

    expect(Buffer.from(enc).equals(Buffer.from(opensslArrBuf))).to.be.true;
  });

  it("should descypt binary file and get the same result as openssl", async () => {
    const testFolder = path.join(__dirname, "static_assets", "mona_lisa");
    const testFileName =
      "1374px-Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg";
    const fileArrBuf = bufferToArrayBuffer(
      await fs.readFileSync(path.join(testFolder, testFileName + ".enc"))
    );
    const password = "somepassword";
    const dec = await decryptArrayBuffer(fileArrBuf, password);
    const opensslArrBuf = bufferToArrayBuffer(
      await fs.readFileSync(path.join(testFolder, testFileName))
    );

    expect(Buffer.from(dec).equals(Buffer.from(opensslArrBuf))).to.be.true;
  });
});
