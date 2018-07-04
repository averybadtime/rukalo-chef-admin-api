import * as admin from "firebase-admin"

import serviceAccount from "./service-account"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rukalo-chef.firebaseio.com/"
})

export default admin