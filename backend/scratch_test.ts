import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('ok'));
console.log('Starting server...');
app.listen(3002, () => {
  console.log('Server running on 3002');
});
