import MFRC522 from "mfrc522-rpi";
import SoftSPI from "rpi-softspi";

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
const toHexString = (bytes) => {
  return bytes.map(function(byte) {
    if(byte > 9){
      return (byte & 0xFF).toString(16);
    } else {
      return "0" + (byte & 0xFF).toString(16);
    }
  }).join('')
}


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
		"Card read UID: 0x " + uid[0].toString(16) + " " + uid[1].toString(16) + " "  + uid[2].toString(16) + " " + uid[0].toString(16)
 	);

	//Scaned Card Selection
	const memoryCapacity = mfrc522.selectCard(uid);
	console.log("Card Memory Capacity:" + memoryCapacity);

	//Default key for authentication
  	const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

	//# Address for card 2  0x8ba1f109551bd432803012645ac136ddd64dba72
	let Salt = [0x8b,0xa1,0xf1,0x09,0x55,0x1b,0xd4,0x32,0x80,0x30,0x12,0x64,0x5a,0xc1,0x36,0xdd];

	//# Authenticate on Block 8 with key and uid
  	if (!mfrc522.authenticate(8, key, uid)) {
    		console.log("Authentication Error");
    		return;
  	}
	// Generate Hash


	//# Write last 4 Bytes + 16 dummy 0x00 of the address
	console.log("Block 8 will be filled with SALT:");
	mfrc522.writeDataToBlock(8, Salt);

	//# Address recovery
	let recoveredAddressPart1 = mfrc522.getDataForBlock(9);

	console.log("0x" + toHexString(recoveredAddressPart1) + toHexString(recoveredAddressPart2).slice(0,8))


	//# Stop
 	mfrc522.stopCrypto();
}, 1000);
