import MFRC522 from "mfrc522-rpi";
import SoftSPI from "rpi-softspi";
import sha256 from "sha256";


console.log(SoftSPI);

console.log("Scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");


//SPI Configuration
const softSPI = new SoftSPI({
	clock: 23, //pin number of SCLK
	mosi: 19, //pin number of MOSI
	miso: 21, //pin number of MISO
	client: 24 //pin number of CS
});

//mfrc522 Handler 
const mfrc522 = new MFRC522(softSPI).setResetPin(22).setBuzzerPin(18);

//Bytes array to Hex string conversion
//const toHexString = (bytes) => {
//  return bytes.map(function(byte) {
//    if(byte > 9){
//      return (byte & 0xFF).toString(16);
//    } else {
//      return "0" + (byte & 0xFF).toString(16);
//    }
//  }).join('')
//}


//main loop
setInterval(function() {
	//reset card
	mfrc522.reset();

	//scan for cards
	let response = mfrc522.findCard();

	//No card
	if (!response.status) {
		console.log("No Card");
		return;
	}

	console.log("Card detected, CardType: " + response.bitSize);

	//get UID of the card
	response = mfrc522.getUid();
	if (!response.status) {
		console.log("UID Scan Error");
		return;
	}

	const uid = response.data;
	console.log(
		"Card read UID: 0x " + uid[0].toString(16) + " " + uid[1].toString(16) + " "  + uid[2].toString(16) + " " + uid[3].toString(16)
 	);
    
    // Computing SALT block encryption key
    
    const uidString = uid[0].toString(16) + uid[1].toString(16) + uid[2].toString(16) + uid[3].toString(16);
    const HWKey = "12345678"

    const HashUidHWKey = sha256("" + uidString + HWKey, { asBytes: true })
    const saltKey = HashUidHWKey.slice(0,6)
    // print saltkey
    console.log(
		"Salt Key 0x " + saltKey[0].toString(16) + " " + saltKey[1].toString(16) + " "  + saltKey[2].toString(16) + " " + saltKey[3].toString(16) + " " + saltKey[4].toString(16) + " " + saltKey[5].toString(16)
 	);
    
    // oldKey is the default key for authentication
    const oldKey = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        
    // Authenticate on Block 8 with key and uid
    if (!mfrc522.authenticate(8, oldKey, uid)) {
        console.log("Authentication Error with default key");
        return;
    }

    // changing salt memory block(0) to saltkey
    //mfrc522.writeAuthenticationKey(8, saltKey);

    //console.log("Now we can use the new access key to store data in block 8...");

    //if (!mfrc522.authenticate(8, saltKey, uid)) {
    //    console.log("Authentication Error");
    //    return;
    //  }
    
    console.log("auth OK")
	//# Stop
 	mfrc522.stopCrypto();
}, 1000);
