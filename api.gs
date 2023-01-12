function doGet(e) {
      const privateKey = "[PRIVATE_KEY]";
      
      if(!e.parameter.token){
        const response = [{status: 400, message: "Token vazio"}];

          return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
      }

      if(!parseJwt(e.parameter.token, privateKey)){
          const response = [{status: 401, message: "Token inválido"}];

          return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);  
      }

      var url = "[GOOGLE_SHEET_URL]";
      
      const ss = SpreadsheetApp.openByUrl(url);
      
      //name of your sheet, in my case is "Base"
      const ws = ss.getSheetByName("Base");
      
      // the region of the data that your want delivery
      const data = ws.getRange("A1").getDataRegion().getValues();
      
      //cut the header row of your data
      const headers = data.shift();

      //each row of your speadsheet will be a object where the keys will be the header
      const jsonArray = data.map(r => {
        let obj = {};
        headers.forEach((h,i) => {
          obj[h] = r[i];
        });
        return obj;
      });
      
      //convert in JSON and delivery
      const response = [{status: 200, data: jsonArray}];
      return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

//this function 
function parseJwt(jsonWebToken, privateKey) {
  if (jsonWebToken) {
    const [header, payload, signature] = jsonWebToken.split('.');
    const signatureBytes = Utilities.computeHmacSha256Signature(`${header}.${payload}`, privateKey);
    const validSignature = Utilities.base64EncodeWebSafe(signatureBytes);

    if (signature === validSignature.replace(/=+$/, '')) {
      const blob = Utilities.newBlob(Utilities.base64Decode(payload)).getDataAsString();
      const { exp, ...data } = JSON.parse(blob);
      if (new Date(exp * 1000) < new Date()) {
        throw new Error('The token has expired');
      }
      Logger.log(data);
      return true;
    } else {
      Logger.log('🔴', 'Invalid Signature');
      return false;
    }
  } else{
    return false;
  }

};
