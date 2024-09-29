import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import client from "./database/db"

const app = express();

client.connect((err)=>{
  err
  ? console.log(`error en la conexion ${err.message}`)
  : console.log("conexion exitosa a la DB")
})

app.use(cors({
  credentials: true
}))
app.use(bodyParser.json())

app.get('/users', async (req, res)=>{
  try{
    const response = await client.query("SELECT * FROM person;")
    res.status(200).json(response.rows)
  }catch{
    res.status(500).send({message: 'Error al obtener usuarios'})
  }
})

const server = createServer(app)
server.listen(3000, ()=>{
  console.log("Server is running on port 3000 \n http://localhost:3000")
})