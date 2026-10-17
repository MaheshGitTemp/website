var CryptoJS = require("crypto-js");


const password = "secret1234"


let convertCredentials = async (userobj,isEncrypt) => {

    let data;
    try {

        if(isEncrypt == true){
            data = encrypt(userobj.upassword);
            // console.log(data);
        }else{
            data = decrypt(userobj[0].upassword);
        }

        return data;

    } catch (e) {
        console.log(e);
    }
}



function encrypt(text) {
    try {

        var encrypted = CryptoJS.AES.encrypt(text, password);
        return encrypted.toString();
    
      } catch (error) {
        console.log(error);
      }
    }


function decrypt(encryptedText) {
    try {
        var decrypted = CryptoJS.AES.decrypt(encryptedText, password);
        return decrypted.toString(CryptoJS.enc.Utf8);
    
      } catch (error) {
        console.log(error)
      }

}

module.exports.convertCredentials = convertCredentials;