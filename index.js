import app from "./app"
import cors from "cors"
import bodyParser from "body-parser"
import usersRoutes from "./routes/users"

const PORT = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use("/api", usersRoutes)

app.listen(3000, () => console.log("Server running at " + PORT))