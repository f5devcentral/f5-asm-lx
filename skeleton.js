const axios = require('axios');
console.log('start script')
axios.get('http://127.0.0.1:8080')
  .then(response => {
    console.log(response.data.url);
    console.log(response.data.explanation);
  })
  .catch(error => {
    console.log(error);
  });
