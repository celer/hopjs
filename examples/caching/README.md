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
  
  //Lets first create a user
  UserService.create({ name: "user", password:"password", email:"email@email.com" });
  //Now let's load that same user a few times
  UserService.load({id:0});  
  UserService.load({id:0});  
  UserService.load({id:0});  
 
```

If we look at the browsers network inspection tool you'll notice that HopJS has applied all the various HTTP caching headers to prevent 
the browser from requesting the object again.

Also if you look at the console log for the application you'll see the log messags that HopJS has created regarding caching. You should notice that even though we requested the object multiple times we only see that the item was saved once. 


```shell

# We can also use the redis-cli to pull up the cached copy of the item (within 60 seconds of it being cached)
redis-cli
# redis 127.0.0.1:6379> get /user/0

```

