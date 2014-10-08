Hop = require('../../index');
Okapi = require('okapi');
dialect = require('./db');
crypto = require('crypto');

Okapi.log=true;


var UserDAO = new Okapi.Object(dialect,"users");


UserDAO.column("id", {type: Okapi.ID }); 
UserDAO.column("email",{ type: Okapi.String, unique:true });
UserDAO.column("password", { type: Okapi.String }); 
UserDAO.column("salt", { type: Okapi.String }); 

UserDAO.createTable().done(function(err){ console.log(err) });
 
Hop.defineModel("User",function(user){
  user.field("id", "UserID","The user ID").integer().ID();
  user.field("email","Email","Email address").string();
  user.field("password","Password","Password").password();
  user.field("verifyPassword","Verify Password","Verify password").password();
});

/*
  Here are our code for managing users
*/ 

User={};

User.cryptPassword=function(salt,password){
  var sha1 = crypto.createHash("sha1");
  
  sha1.update(salt);
  sha1.update(password);

  return sha1.digest('hex');
}

User.create=function(input,onComplete){
  input.salt=(Math.random()*100000).toFixed(0);
 
 
  input.password = User.cryptPassword(input.salt,input.password);
 
  UserDAO.insert(input).done(function(err,user){
    if(err) return onComplete(Hop.DAOError("Unable to create user",err),null);
    return onComplete(null,new Hop.href("User.read",{id: user.id }));
  });
}

User.login=function(input,onComplete,request){
  UserDAO.find(function(q){
    q.eq("email",input.email);
  }).done(function(err,users){
    delete request.session.user;
    if(err) return onComplete(Hop.AuthError(),null);

    if(users.length>0){

      if(users[0].password == User.cryptPassword(users[0].salt,input.password)){
        users[0].href = new Hop.href("User.read",{id: users[0].id });
        request.session.user = users[0];
        return onComplete(null,true);
      } else { 
        return onComplete(Hop.AuthError(),null,401); 
      }
    } else {
      return onComplete(Hop.AuthError(),null,401); 
    }
  });
}

User.logout=function(input,onComplete,request){
  delete request.session.user;
  return onComplete(null,true);
}

User.list=function(input,onComplete){
  //FIXME add offset & limit 
  UserDAO.find().done(function(err,users){
    if(err) return onComplete(Hop.DAOError("Unable to list users",err));
  
    return onComplete(null,{ 
      items:  users.map(function(user){ 
        return { email: user.email, id: user.id, href: new Hop.href("User.read",{id: user.id}) };
      }) 
    });
  });
}


User.read=function(input,onComplete){
  UserDAO.find(input).done(function(err,user){
    if(err) return onComplete(Hop.DAOError("Unable to delete user",err));
    if(!user || user.length==0) return onComplete(null,null);
    user = user[0];
    user.href = new Hop.href("User.read",{id:user.id});
    return onComplete(null,user);
  });
}

User.current=function(input,onComplete,request){
  return onComplete(null,request.session.user);
}

User.update=function(input,onComplete){
  UserDAO.update(input).done(function(err,user){
    if(err) return onComplete(Hop.DAOError("Unable to update user",err));
    user.href = new Hop.href("User.read",{id:user.id});
    return onComplete(null,input);
  });
}

User.delete=function(input,onComplete,request){
  if(input.id != request.session.user.id) return onComplete("Not Authorized",null,400);

  UserDAO.delete(input).done(function(err,result){
    if(err) return onComplete(Hop.DAOError("Unable to delete user",err));
    return onComplete(null,true);
  });
}


Hop.Method.prototype.requireUser=function(){
  var self=this;
  this.addPreCall(function(request,input,onComplete,next){
    if(!request.session.user)
      return onComplete("Not Authorized",null,400);
    else next();
  },"auth");
}

Hop.defineClass("User",User,function(api){
  api.post("create","/users").demands("email","password");
  api.post("login","/users/login").demands("email","password");
  api.get("logout","/users/logout");
  api.get("current","users/current");

  api.each(function(api){
    api.list("list","/users");
    api.get("read","/users/:id");
    api.update("update","/users/:id").demands("id","email","password");
    api.del("delete","/users/:id");
  },function(method){
    method.requireUser();
  });
});

Hop.defineTestCase("User.create: Basic Test",function(test){
  var user = { email:"test@test.com", password:"password"};

  test.do("User.create").with(user).noError();
  test.do("User.create").with(user).errorContains("Unable to");
  test.do("User.current").noError().outputIsNull();
  test.do("User.login").with(user).noError().outputContains(true);
  test.do("User.current").noError().saveOutputAs("createdUser");
  test.do("User.read").with("createdUser").noError().outputContains("createdUser");
  test.do("User.list").with().noError();
  test.do("User.delete").with("createdUser").noError();
  test.do("User.logout").noError();
 
  test.do("User.read").with("createdUser").errorContains("Not Authorized");;
  test.do("User.delete").with("createdUser").errorContains("Not Authorized");;
   
});

Hop.defineTestCase("User.delete: Session Test",function(test){
  var user1 = { email:"test1@test.com", password:"password"};
  var user2 = { email:"test2@test.com", password:"password"};

  test.do("User.create").with(user1).noError();
  test.do("User.create").with(user2).noError();
  test.do("User.login").with(user2).noError();
  test.do("User.current").with().noError().saveOutputAs("user2");
  test.do("User.login").with(user1).noError();
  test.do("User.current").with().noError().saveOutputAs("user1");
  test.do("User.delete").with("user2").errorContains("Not Authorized");

  test.do("User.delete").with("user1").noError();
  test.do("User.login").with(user2).noError();
  test.do("User.delete").with("user2").noError();
});


module.exports={ UserDAO: UserDAO };

