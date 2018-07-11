import express from "express"
import usersController from "../controllers/users"

const app = express.Router()

app.post("/users/chef", usersController.createNewChef)
app.get("/users", usersController.getAllUsers)
app.get("/users/:key", usersController.getUser)
app.put("/users/:key", usersController.updateUser)
app.delete("/users/:key", usersController.deleteUser)

export default app