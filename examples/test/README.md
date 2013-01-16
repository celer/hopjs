To run this example:

First install all the depedencies
```shell
  npm install .
```
Next start the example:

```shell
  node app.js
```


Now visit http://localhost:3000/ in your browser 

*Next steps - Things to try doing with the example:*

1. Visit the documentation page and run all the examples

2. Open the JavaScript console in your browser and use the API 
 
```javascript
   UserService.create({ name: "user", email:"user@site.com", password:"foofoo"},function(err,result){ console.log(err,result}; });
```

*Hints*

Run app.js with node-dev instead of node, it will automatically restart the server when you make changes to the code

```shell
sudo npm install -g node-dev

node-dev app.js

```
