const express = require('express');
const app = express()
const dotenv = require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 8080;

const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const token = jwt.sign({ foo: 'bar' }, 'shhhhh');

app.use(cors())
app.use(express.json())

var MongoClient = require('mongodb').MongoClient;

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-u3y8yav-shard-00-00.aevdvxh.mongodb.net:27017,ac-u3y8yav-shard-00-01.aevdvxh.mongodb.net:27017,ac-u3y8yav-shard-00-02.aevdvxh.mongodb.net:27017/?ssl=true&replicaSet=atlas-vwcul5-shard-0&authSource=admin&retryWrites=true&w=majority`;
MongoClient.connect(uri, function (err, client) {

    function verifyJWT(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        const token = authHeader.split(' ')[1]
        console.log(token)
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            console.log(decoded);
        })
        next()
    }


    async function run() {
        try {
            const employeeCollection = client.db('employee_db').collection('employees')

            app.get('/employees', async (req, res) => {
                const allEmployees = await employeeCollection.find({}).toArray()
                res.send(allEmployees)
            })

            app.get('/employees/:id', verifyJWT, async (req, res) => {
                console.log(req.decoded)
                const id = req.params;
                const employeeDetail = await employeeCollection.findOne({ _id: ObjectId(id) })
                res.send(employeeDetail)
            })

            app.post("/employee", async (req, res) => {
                const employee = req.body;
                const result = await employeeCollection.insertOne(employee)
                const accessToken = jwt.sign(employee, process.env.ACCESS_TOKEN, {
                    expiresIn: '1d'
                })
                res.send({ accessToken })
            })


        } finally { }

    }
    run().catch(console.dir())

});



app.get("/", (req, res) => {
    res.send("Server is running")
})

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
})
