 import admin from "../firebase-admin"

// POST
// domain/api/users
// Crear un nuevo usuario
// @body: Valores para crear un nuevo usuario
// return ** USERNAME del usuario creado **
async function createNewChef(req, res) {
  const body = req.body

  if (body.email && body.password && body.username && body.name && body.photoUrl && body.phoneNumber) {

    const usernameRef = admin.database().ref("/registeredUsernames").child(body.username)
    const usernameExists = usernameRef.once("value", snapshot => snapshot.exists())
    const exists = await usernameExists

    if (exists) {
      return res.status(422).json({ error: "El username ya ha sido tomado por otro usuario." })
    }

    admin.auth().createUser({
      email: body.email,
      emailVerified: true,
      phoneNumber: body.phoneNumber,
      photoUrl: body.photoUrl,
      password: body.password,
      displayName: body.name,
      disabled: false
    }).then(chefRecord => {
      const updatedInfo = {}

      updatedInfo["/users/chefs/" + chefRecord.uid + "/profileInfo"] = {
        email: body.email,
        name: body.name,
        username: body.username,
        photoUrl: body.photoUrl,
        phoneNumber: body.phoneNumber,
        role: "CHEF"
      }
      updatedInfo["/registeredUsernames/" + body.username] = true

      admin.database().ref().update(updatedInfo, err => {
        if (err) res.status(500).json({ error: err })
        else res.status(200).json({ createdUser: body.username })
      })
    }).catch(err => {
      res.status(500).json({ error: err })
    })
  } else {
    res.status(422).json({ error: "No se puede crear un nuevo usuario con la cantidad de datos proporcionados." })
  }
}

// GET
// domain/api/users/
// Obtener todos los usuarios
// return ** Toda la data de todos los usuarios **
function getAllUsers(req, res) {
  admin.auth().listUsers(1000, undefined).then(listUsersResult => {
    let users = []
    listUsersResult.users.forEach(userRecord => {
      users.push(userRecord.toJSON())
    })
    res.status(200).json({ users: users })
  }).catch(err => res.status(500).json({ error: err }))
}

// GET
// domain/api/users/:key
// Obtener usuario por key
// @params: key
// return ** User record **
function getUser(req, res) {
  if (req.params.key) {
    admin.auth().getUser(req.params.key).then(userRecord => {
      res.status(200).json({ user: userRecord })
    }).catch(err => {
      res.status(500).json({ error: err })
    })
  } else {
    res.status(422).json({ error: "No se encontró un id válido." })
  }
}

// PUT
// domain/api/users/:key
// Actualizar usuario
// @params: key // @body: referencia de firebase, Objeto con la data para actualizar 
// return ** data para la base de datos **
function updateUser(req, res) {
  if (req.params.key && req.body.ref) {
    const ref = req.body.ref
    const updateObject = req.body.updateObject || {}

    admin.auth().updateUser(req.params.key, {
      email: updateObject.email,
      emailVerified: updateObject.emailVerified,
      phoneNumber: updateObject.phoneNumber,
      password: updateObject.password,
      displayName: updateObject.displayName,
      photoURL: updateObject.photoUrl,
      disabled: updateObject.disabled
    }).then(userRecord => {
      if (userRecord) {
        const updatedInfo = {
          email: userRecord.email,
          phoneNumber: userRecord.phoneNumber,
          displayName: userRecord.displayName,
          photoUrl: userRecord.photoURL
        }
        res.status(200).json({ updatedUser: updatedInfo })
      } else {
        res.status(500).json({ error: "Ocurrió un error mientras se actualizaba al usuario. "})
      } 
    }).catch(err => {
      res.status(500).json({ error: err })
    })
  } else {
    res.status(422).json({ error: "No se obtuvieron los datos requeridos para eliminar al usuario." })
  }
}

// DELETE
// domain/api/users/:key
// Eliminar usuario
// @params: key // @body: referencia de firebase
// return ** USERNAME del usuario eliminado. ** (soft delete)
function deleteUser(req, res) {
  if (req.params.key && req.body.ref) {
    const key = req.params.key
    const ref = req.body.ref
    const userToDeleteRef = admin.database().ref(ref + "/" + key)
    let deletedUser

    userToDeleteRef.once("value", snapshot => {
      deletedUser = snapshot.val()
    }).then(() => {
      if (deletedUser) {
        const escapedEmail = deletedUser.profileInfo.email.replace(/\./g, "&dot;")
        const updatedInfo = {}

        updatedInfo["/deletedUsers/" + key] = deletedUser
        updatedInfo["/deletedUsersEmails/" + escapedEmail] = true
        updatedInfo["/registeredUsernames/" + deletedUser.profileInfo.username] = null
        updatedInfo[ref + "/" + key] = null

        admin.database().ref().update(updatedInfo, err => {
          if (err) {
            res.status(500).json({
              error: err,
              errorText: "Ocurrió un error mientras se eliminaba al usuario."
            })
          } else {
            res.status(200).json({ deletedUser: deletedUser.profileInfo.username })
          }
        })
      } else {
        res.status(400).json({ error: "No se encontró un usuario válido para eliminar." })
      }
    })
  } else {
    res.status(422).json({ error: "No se obtuvieron los datos requeridos para eliminar al usuario." })
  }
}

module.exports = {
  createNewChef,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
}