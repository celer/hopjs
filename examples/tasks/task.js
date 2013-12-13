Hop = require('../../index');
Okapi = require('okapi');
dialect = require('./db');
crypto = require('crypto');

Okapi.log=true;

UserDAO = require('./user').UserDAO;

var TaskDAO = new Okapi.Object(dialect,"tasks");



TaskDAO.column("id", {type: Okapi.ID }); 
TaskDAO.column("title",{ type: Okapi.String });
TaskDAO.column("description", { type: Okapi.String }); 
TaskDAO.column("createdBy", { type: Okapi.IDRef, ref:{ dao: UserDAO, column:"id" }});
TaskDAO.column("assignedTo", { type: Okapi.IDRef, ref:{ dao: UserDAO, column:"id" }});

 

//FIXME make this take no lambda
Okapi.createTables(TaskDAO,function(){});
 
Hop.defineModel("Task",function(user){
  user.field("id", "TaskID","The user ID").integer().ID();
  user.field("title","Title","Task Title").string();
  user.field("description","Description","Task Description").string();
  user.field("createdBy","Created By","Created by").integer().ID();
  user.field("assignedTo","Assigned To","Assigned to").integer().ID();
});


Task={};

Task.create=function(input,onComplete,request){
  input.createdBy = request.session.user.id;
  TaskDAO.insert(input).done(function(err,task){
    if(err) return onComplete(Hop.DAOError("Unable to create task",err));
    return onComplete(null,new Hop.href("Task.read",{id: task.id }));
  });
}

Task.read=function(input,onComplete){
  TaskDAO.find({id: input.id }).first(function(err,task){
    if(err) return onComplete(Hop.DAOError("Unable to read task",err));
    if(task){
      var assignedTo = task.assignedTo*1;
      var createdBy = task.createdBy*1;

      //task.assignedTo = { href: new Hop.href("User.read",{id: assignedTo }) }
      //task.createdBy = { href: new Hop.href("User.read", {id: createdBy  }) }

      task.assignedTo= { href: new Hop.href("User.read",{id:assignedTo}), id: assignedTo }
      task.createdBy= { href: new Hop.href("User.read",{id:createdBy}), id: createdBy }

    
      return onComplete(null, task);
    } else return onComplete(null,null);
  });
}


Task.update=function(input,onComplete){
  //FIXME need to pull an ID from the task
  TaskDAO.update(input).done(function(err,task){
    if(err) return onComplete(Hop.DAOError("Unable to update task",err));
    task.assignedTo = new Hop.href("User.read",{id:task.assignedTo}); 
    task.createdBy = new Hop.href("User.read",{id:task.createdBy});
    return onComplete(null,task);
  });
}

Task.delete=function(input,onComplete){
  TaskDAO.delete(input).done(function(err,res){
    if(err) return onComplete(Hop.DAOError("Unable to delete tasks",err));
    return onComplete(null,true);
  });
}

Task.list=function(input,onComplete){
  //FIXME add offset & limit
  TaskDAO.find().limit(input.limit).offset(input.offset).orderBy("id","asc").done(function(err,tasks){
    if(err) return onComplete(Hop.DAOError("Unable to list tasks",err));
    tasks.forEach(function(task){
      task.href = new Hop.href("Task.read", { id: task.id }); 
      task.assignedTo= { href: new Hop.href("User.read",{id:task.assignedTo}), id: task.assignedTo }
      task.createdBy= { href: new Hop.href("User.read",{id:task.createdBy}), id: task.createdBy }
    });
    return onComplete(err,{ items: tasks });      
  });
}


Hop.defineClass("Task",Task,function(api){
  api.create("create","/tasks").demands("title","description","assignedTo").requireUser();
  api.read("read","/tasks/:id").requireUser();
  api.update("update","/tasks/:id").requireUser();
  api.del("delete","/tasks/:id").requireUser();
  api.list("list","/tasks/").requireUser();
});

Hop.defineTestCase("Task.list",function(test){
  var user1 = { email:"test1@test.com", password:"password"};
  var user2 = { email:"test2@test.com", password:"password"};
  var validTask = { title: "Test Task", description:"Description", assignedTo:1 };
  
  test.do("User.create").with(user1).noError();
  test.do("User.login").with(user1).noError();
  test.do("User.current").with().noError().saveOutputAs("user1");

  for(var i = 0;i<100;i++){
    test.do("Task.create").with(validTask).noError().saveOutputAs("savedTask"+i);
  }

  test.do("Task.list").with().noError().arrayContains("items","savedTask1");
  
  test.do("Task.list").with({offset:50}).noError().arrayContains("items","savedTask52");
  
  for(var i = 0;i<100;i++){
    test.do("Task.delete").with("savedTask"+i).noError();
  }

  test.do("User.delete").with("user1").noError();
  test.do("User.logout").with().noError();
});

Hop.defineTestCase("Task.create",function(test){
  var user1 = { email:"test1@test.com", password:"password"};
  var user2 = { email:"test2@test.com", password:"password"};
  var validTask = { title: "Test Task", description:"Description", assignedTo:1 };
  
  test.do("User.create").with(user1).noError();
  test.do("User.login").with(user1).noError();
  test.do("User.current").with().noError().saveOutputAs("user1");

  test.do("Task.create").with(validTask).noError().saveOutputAs("savedTask");
  test.do("Task.read").with("savedTask",{ expand:"fo"}).noError();
  test.do("Task.delete").with("savedTask").noError();
  test.do("User.delete").with("user1").noError();
  test.do("User.logout").with().noError();
});




