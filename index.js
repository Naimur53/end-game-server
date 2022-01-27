const express = require('express')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

//middle war
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());


// mongo 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.icikx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('end-game');
        const usersCollection = database.collection('users');
        const requestForPostCollection = database.collection('requestForPost');

        app.put('/user', async (req, res) => {
            const user = req.body;
            console.log('put user', user);
            const filter = { email: user.email };
            const options = { upsert: true }
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
            console.log(result);
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });
        //make admin
        app.put('/user/makeAdmin', async (req, res) => {
            console.log('user put');
            const email = req?.body?.email
            console.log(email);
            const filter = { email };
            const options = { upsert: true }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.post('/requestForPost', async (req, res) => {
            const data = req.body
            console.log(data);
            const result = await requestForPostCollection.insertOne(data)
            res.json(result);
        });
        // get post 
        app.get('/findAllRequestPost', async (req, res) => {
            const query = { status: 'pending' }
            console.log(query);
            const result = await requestForPostCollection.find(query).toArray();
            console.log(result, 'request post');
            res.json(result);
        });
        app.delete('/deletePost/:_id', async (req, res) => {
            const id = req.params._id;
            const filter = { _id: ObjectId(id) }
            console.log(id);
            const cursor = await requestForPostCollection.deleteOne(filter);
            res.json({ _id: id });
        });
        //make admin
        app.put('/updateStatus/:_id', async (req, res) => {
            console.log('approve ');
            const id = req.params._id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = { $set: { status: 'approve' } }
            const result = await requestForPostCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.json({ _id: id });
        });
        app.get('/allApprovePost', async (req, res) => {
            const query = { status: 'approve' }
            console.log(query);
            const result = await requestForPostCollection.find(query).toArray();
            console.log(result, 'request post');
            res.json(result);
        });
        app.get('/getBlogs', async (req, res) => {
            const query = { status: 'approve' }
            const cursor = requestForPostCollection.find(query);
            const page = req.query.page;
            const size = parseInt(req.query.size);
            console.log(size, page);
            const count = await cursor.count();
            let blogs;
            if (page !== 'undefined') {
                blogs = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                blogs = await cursor.toArray();
                console.log('get all blog');
            }

            res.json({
                count,
                blogs
            });
        });
        app.get('/details/:_id', async (req, res) => {
            const id = req.params._id;
            const filter = { _id: ObjectId(id) }
            console.log(id);
            const cursor = await requestForPostCollection.findOne(filter);
            res.json(cursor);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running end game server')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})

