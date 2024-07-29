import { JSEncrypt } from "jsencrypt";

import { publicRequestKey } from "../../utils/publicKeys";

const encrypted = (params) => {
  var encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicRequestKey);

  var encrypted = encrypt.encrypt(
    JSON.stringify({
      ...params,
    })
  );
  return encrypted;
};

export { encrypted };
