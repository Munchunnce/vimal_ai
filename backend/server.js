import express from 'express';
import { generate } from './chatbot.js';
import cors from 'cors';

const app = express();
app.use(express.json()); // This is a middleware.
app.use(cors());
const port = 3001;

app.get('/', (req, res) => {
  res.send('Welcome to ChatGPT!');
})

app.post('/chat', async (req, res) => {
    const { message } = req.body; // req.body se data get kar rhe hai mujhe app.use(express.json())
    console.log('Message', message);

    const result = await generate(message);
    res.json({ message: result });
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})
