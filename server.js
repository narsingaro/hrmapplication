var express=require("express");
var moment=require("moment");
var jsforce = require('jsforce');
var bodyParser=require("body-parser");
var cron = require('cron');
var nodemailer = require('nodemailer');
var ejs=require('ejs');
var conn = new jsforce.Connection();
var app=express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('static'));
app.set('port', process.env.PORT || 1345);
var server = app.listen(app.get("port"));
//app.listen(8083);
var users=[];
app.engine('html', ejs.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.locals.title = 'Hello';
app.locals.moment = moment;
var cronJob = cron.job("0 45 15 * * *", function(){
  console.log('testing');
  let mailtransporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: 'narsingarao920@gmail.com',
      clientId: '769789805622-i9b5vp2cj3gi2bo5o5tec2jj478d1oia.apps.googleusercontent.com',
      clientSecret: '13ku4aqk0gcEFLNohRkRoxgT',
      refreshToken: '1/NN7lzV-CWtCQIJidrBpANUKJVCBrKYifHi7rXgW2PU4',
      accessToken: 'ya29.GlsyBiyDlocPozO5VQHhprX5YIbADWZFC8jZlVsduFhDrsU0R157wmObfFISMkl5QC_P8z7OFDY7LM_qeB23Uk0QblrTZ_N-2ZpOyOc_hyqFHtdceU65HNeHfhPp',
    }
  });
  salesforceLogin(function(err, userInfo) {
    var birthdayemails=[];
    var anniversaryemails=[];
    var d= new Date();
    var month=d.getMonth()+1;
    var date=d.getDate();
    var year=d.getFullYear();
    conn.sobject("Contact").select('Email__c,Name,Birthdate,Birthday_Message__c') .sort('Name').where("CALENDAR_MONTH(BirthDate)="+month+" AND DAY_IN_MONTH(BirthDate)="+date)
      .execute(function(err, records) {
        if(err){console.log(err);}
        for(var i=0;i<records.length;i++){
          emailnew={
            email:records[i].Email__c,
            name:records[i].Name,
            message:records[i].Birthday_Message__c
          }
          birthdayemails.push(emailnew);
        }
        console.log(birthdayemails);
        for (var i=0;i<birthdayemails.length;i++){
          ejs.renderFile('views/birthdaywishes.html',{ name : birthdayemails[i].name , message : birthdayemails[i].message},function(err, data){
            if(err){return console.error(err);}
            let mailOptions={
              from: 'narsingarao920@gmail.com',
              to: birthdayemails[i].email,
              subject: "birthday wishes",
              html:  data
            };
            mailtransporter.sendMail(mailOptions, function (error, info) {
              if(error){return console.error(error);}
              console.log('Message sent: %s', info.messageId);
            });
          });
        }
      });
    conn.sobject("Contact").select('Email__c,Name,Date_of_Joining__c,Anniversary_Message__c').sort('Name')
      .where("CALENDAR_MONTH(Date_of_Joining__c)="+month+" AND DAY_IN_MONTH(Date_of_Joining__c)="+date+" AND CALENDAR_YEAR(Date_of_Joining__c)!="+year)
      .execute(function(err, records) {
        if(err){console.log(err);}
        for(var i=0;i<records.length;i++){
          var emailnew={
            email:records[i].Email__c,
            name:records[i].Name,
            message:records[i].Anniversary_Message__c
          }
          anniversaryemails.push(emailnew);
        }
        console.log(anniversaryemails);
        for (var i=0;i<anniversaryemails.length;i++){
          ejs.renderFile('views/anniversarywishes.html',{ name : anniversaryemails[i].name , message : anniversaryemails[i].message},function(err, data){
            if(err){return console.error(err);}
            let mailOptions={
              from: 'narsingarao920@gmail.com',
              to: anniversaryemails[i].email,
              subject: "anniversary wishes",
              html:  data
            };
            mailtransporter.sendMail(mailOptions, function (error, info) {
              if(error){return console.error(error);}
              console.log('Message sent: %s', info.messageId);
            });
          });
        }
      });
    }); 
});
cronJob.start();
function salesforceLogin(callback){
  console.log('salesforceLogin()');
  conn.login('harikirankavuru@resourceful-bear-368169.com','Hari@1234vTbjwQZAFkdu2afCDOpqSvJSr', function(err, userInfo) {
    callback(err,userInfo);
  });
}

function getBirthdays(callback){
  salesforceLogin(function(err, userInfo) {
      if (err) { return console.error(err); }
      var today=new Date();
      conn.query('SELECT Name,Birthdate FROM Contact group by Birthdate,Name order by calendar_month(Birthdate),DAY_IN_MONTH(Birthdate)',function(err, result) {
        if(err){ return console.error(err); }
        var birthdays=[];
        for(var i=0;i<result.records.length;i++){
          var birthdate=new Date(result.records[i].Birthdate);
          if(birthdate.getMonth() >= today.getMonth()){
            if(birthdate.getDate()>= today.getDate()){
            	result.records[i].Birthdate=moment(result.records[i].Birthdate).format("MMMM Do");
              birthdays.push(result.records[i]);
            }
          }
        }
        callback(birthdays);
      });
  });
}

function getHolidays(callback){
  salesforceLogin(function(err, userInfo) {
      if (err) { return console.error(err); }
      conn.sobject("Holidays__c").select("Id,Name,Date__c").where("Date__c >= TODAY").sort("Date__c,Name").limit(4).execute(function(err,records){
        if(err) { return console.log(err); }
        var offset1=4;
        conn.sobject("Holidays__c").select("Id").where("Date__c>= TODAY").sort("Date__c").execute(function(err,records1){
          if(err){ return console.error(err);}
          var noOfRecords=records1.length;
          console.log(noOfRecords);
          if(offset1>=noOfRecords){
            callback(false,offset1,records);
          }
          else{
            callback(true,offset1,records);
          }
        });
      });
  });
}

function holidayList(callback){
  salesforceLogin(function(err, userInfo) {
      if (err) { return console.error(err); }
      conn.sobject("Holidays__c").select("Id,Name,Date__c").where("Date__c >= TODAY").sort("Date__c,Name").execute(function(err,records){
        if(err) { return console.log(err); }
        callback(records);
      });
  });
}

function employeeDetails(Id,Position,callback){
  var id=Id;
  var position=Position;
  salesforceLogin(function(err, userInfo){
    if(position == 'HR'){
      conn.sobject("Contact")
      .select('Active__c,address__c,empid__c,Email__c,Name,Phone__c') 
      .sort('empid__c')
      .limit(10)
      .offset(0)
      .execute(function(err, records) {
        if(err){console.log(err);}
        callback(records);
      });
    }
    else if(position == 'Lead'){
      conn.sobject("Contact").select('Active__c,address__c,empid__c,Email__c,Name,Phone__c').sort('empid__c').where("Id ='"+id+"' OR Reporting_Lead__c ='"+id+"'")
      .execute(function(err, records) {
        if(err){console.log(err);}
        callback(records);
        });
    }  
    else{
      conn.query("SELECT Active__c,address__c,empid__c,Email__c,Name,Phone__c FROM Contact where Id ='"+id+"'", function(err, result) {
        if (err) { return console.error(err); }
        if (!result.done) {
          console.log("next records URL : " + result.nextRecordsUrl);
        }
        callback(result.records);
      });
    }     
  });
}

function employeeDetailview(Id,callback){
  var empid=Id;
  salesforceLogin(function(err, userInfo){
    conn.sobject("Contact")
                 .select('Id,Active__c,address__c,empid__c,Email__c,LastName,Phone__c,Username__c,Password__c,Designation__c,Reporting_Lead__r.Name,Date_of_Joining__c,Birthdate,Birthday_Message__c,Anniversary_Message__c') 
                 .sort('empid__c')
                 .where("empid__c = '"+empid +"'")
                 .limit(1)
                 .execute(function(err, records) {
                  if(err){
                    console.log(err);
                  }
                  console.log(records.length);
                  console.log(records);
                  callback(records);
                  }); 
  }); 
}

app.get("/",function(req,res){
	res.render("login");
});

app.post("/loginuser",function(req,res){
  salesforceLogin(function(err, userInfo){
    conn.query("SELECT Id,Designation__c FROM Contact where Username__c ='"+req.body.username+"' and Password__c ='"+req.body.password+"'", function(err, result) {
      if (err) { return console.error(err); }
      if(result.totalSize >0){
        var detail={
         Id:result.records[0].Id,
         position:result.records[0].Designation__c
        }
        res.send(detail);
       }
       else{
        res.send('invalid');
       }
    });
  });
});

app.post("/login",function(req,res){
  var detail={
        Id:req.body.empId,
        position:req.body.empPosition
      }
  getBirthdays(function(data){
    console.log("getBirthdays()");
    var birthdays=data;
    getHolidays(function(showMore1,offset1,holidays1){
      console.log("getHolidays()");
      employeeDetails(detail.Id,detail.position,function(employees){
        console.log("employeeDetails()");
        res.render('Home',{details : detail,birthdays1 : birthdays,showmore : showMore1 ,offset : offset1,holidays : holidays1,employee : employees });
      });      
    });
  });
});

app.post('/listofemployee',function(req,res){
  var Id=req.body.Id;
  var position=req.body.position;
  employeeDetails(Id,position,function(employees){
    res.render('employeetable',{ employee : employees });
  });
});

app.get('/getHolidays',function(req,res){
  getHolidays(function(showMore1,offset1,holidays1){
    res.render('holidayList',{showmore : showMore1 ,offset : offset1,holidays : holidays1});
  });
});

app.post('/getMoreHolidays',function(req,res){
  var offset=parseInt(req.body.offset);
  salesforceLogin(function(err, userInfo) {
      if (err) { return console.error(err); }
      conn.sobject("Holidays__c").select("Id,Name,Date__c").where("Date__c >= TODAY").sort("Date__c,Name").offset(offset).limit(4).execute(function(err,records){
        if(err) { return console.log(err); }
        conn.sobject("Holidays__c").select("Id").where("Date__c>= TODAY").sort("Date__c").execute(function(err,records1){
          if(err){ return console.error(err);}
          var noOfRecords=records1.length;
          var offset1=offset+4;
          if(offset1>=noOfRecords){
            res.render('holidayList',{showmore : false ,offset : offset1,holidays : records });
          }
          else{
            res.render('holidayList',{showmore : true ,offset : offset1,holidays : records });
          }
        });
      });
  });
});

app.get('/addholidaypage',function(req,res)
{
  res.render("addholiday");
});

app.post('/addHoliday',function(req,res){
  var name=req.body.holidayname;
  var date= req.body.date;
  salesforceLogin(function(err, userInfo) {
      console.log('conn.login');
      if (err) { return console.error(err); }
      conn.sobject("Holidays__c").create({ Name : name,Date__c : date },function(err, rets) {
        if (err) { return console.error(err); }
        if (rets.success) {
          res.send('Your Holiday Added successfully');
        }
        else{
          res.send('Your Holiday Not Added...Try Again!!!');
        } 
      });
  });
});

app.get('/addemployeepage',function(req,res)
{
 salesforceLogin(function(err, userInfo)
    {
      conn.sobject("Contact")
      .select('Id,Name') 
      .sort('empid__c')
      .where("Designation__c ='"+"Lead'")
      .limit(10)
      .execute(function(err, records) {
        if(err){console.log(err);}
        console.log(records.length);
        res.render('addemployeepage',{employee : records});
      });           
    });  
});

app.get('/removeholidaypage',function(req,res)
{
  holidayList(function(data){
    res.render("removeholiday",{ holidays : data });
  });
});

app.post('/removeHoliday',function(req,res){
  var id=req.body.holidayId;
  conn.sobject("Holidays__c").destroy(id, function(err, ret) {
    if (err) { return console.error(err); }
    if(ret.success){
      res.send("Holiday Removed Successfully!!");
    }
    else{
      res.send("Sorry Holiday Not Removed....Try Again!!");
    }
  });
});

app.get('/empdetails',function (req, res)
{ 
var Id=req.query.id;
 employeeDetailview(Id,function(employees){
    res.render('empdetailview',{emp1 : employees});
  });
});

app.post('/addreportinglead',function(req,res)
{
 var reportinglead=req.body.reportinglead;
   salesforceLogin(function(err, userInfo)
     {
      console.log("with in conn");
               conn.sobject("Contact")
                 .select('Id,Name') 
                 .sort('empid__c')
                 .where("Designation__c ='"+"Lead'")
                 .limit(10)
                 .execute(function(err, records) {
                  if(err){console.log(err);}
                  console.log(records.length);
                  console.log(records);
                  res.render('reportinglead',{employee : records,reportinglead:reportinglead});
                 });           
     });
});

/*app.post('/loademployee',function(req,res)
{
     // res.render('employeetable',{employee : projects});
     var offset=parseInt(req.body.offset);

      conn.login("narsingarao540@resourceful-bear-63130.com","pnrao@123FgDhIV7rJmVAZwWoCaIqFkD40", function(err, userInfo)
     {
               conn.sobject("employee1__c")
                 .select('Active__c,address__c,empid__c,Email__c,employeename__c,Phone__c') 
                 .sort('empid__c')
                 .limit(2)
                 .offset(offset)
                 .execute(function(err, records) {
                  console.log(records.length);
                  console.log(records);
                    offset= 2+ offset;
                    console.log(offset);
                  res.render('loademployeetable',{employee : records , offset1:offset});

                 });
            
     });
});*/

app.get('/removeemployee',function(req,res)
{
  salesforceLogin(function(err, userInfo) {
               conn.sobject("Contact")
                 .select('Active__c,address__c,empid__c,Email__c,Name,Phone__c,Id') 
                 .sort('empid__c')
                 .limit(10)
                 .execute(function(err, records) {
                  console.log(records.length+"remove");
                  console.log(records);
                  res.render('removeemptable',{employee : records});

                 });
            
     });
});

app.get('/activelistofemployee',function(req,res)
{
  salesforceLogin(function(err, userInfo) {
      console.log("with in conn");
               conn.sobject("Contact")
                 .select('Active__c,address__c,empid__c,Email__c,Name,Phone__c') 
                 .sort('empid__c')
                 .where("Active__c = true")
                 .limit(10)
                 .execute(function(err, records) {
                  console.log(records.length);
                  console.log(records);
                  res.render('employeetable',{employee : records});
                 });           
     });
});

app.get('/inactivelistofemployee',function(req,res)
{
 salesforceLogin(function(err, userInfo) {
      console.log("with in conn");
               conn.sobject("Contact")
                 .select('Active__c,address__c,empid__c,Email__c,Name,Phone__c') 
                 .sort('empid__c')
                 .where("Active__c = false")
                 .limit(10)
                 .execute(function(err, records) {
                  console.log(records.length);
                  console.log(records);
                  res.render('employeetable',{employee : records});
                 });           
     });
});

app.post('/deactivate',function (req, res)
{
  salesforceLogin(function(err, userInfo) {
    var empid = req.body.Id;
    var value1 = req.body.value;
    if(value1== 'true'){
      conn.sobject("Contact").update({Id : empid, Active__c : false },function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log('Updated Successfully : ' + ret.id);
        res.send('Updated successfully');
      });
    }
    else{
      conn.sobject("Contact").update({Id : empid, Active__c : true },function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log('Updated Successfully : ' + ret.id);
        res.send('Updated successfully');
      });  
    }        
  });
});

app.post('/addemployee',function (req, res)
{
	salesforceLogin(function(err, userInfo) {
    conn.sobject("contact").create({LastName : req.body.employeename,Username__c :req.body.username,Password__c:req.body.password,Designation__c:req.body.designation, Active__c : true,address__c :req.body.address,Email__c :req.body.Email,Phone__c : req.body.phone,Birthdate:req.body.birthdate,Date_of_Joining__c:req.body.joindate,Birthday_Message__c:req.body.birthmsg,Anniversary_Message__c:req.body.annimsg}, function(err, ret) {
      if (err || !ret.success) { return console.error(err, ret); }
      console.log("Created record id : " + ret.id);
    });
    res.send("employee details added successfully");
  });
});

app.post('/updateemployee',function (req, res)
{
  var empid=req.body.empid;
  var position=req.body.position;
  var Id=req.body.userid;
  var message='';
  salesforceLogin(function(err, userInfo) {
    if(req.body.reportinglead != 'null'){
      conn.sobject("Contact").update({ Id:req.body.Id,Username__c :req.body.username,Reporting_Lead__c :req.body.reportinglead,Password__c:req.body.password,Designation__c:req.body.designation,LastName : req.body.employeename,Active__c :req.body.Active,address__c :req.body.address,Email__c :req.body.Email,Phone__c : req.body.phone,Birthdate:req.body.birthdate,Date_of_Joining__c:req.body.joindate,Birthday_Message__c:req.body.birthmsg,Anniversary_Message__c:req.body.annimsg}, function(err, ret) {
        if (err || !ret.success) {
          message='failed to update the employee details'; 
          return console.error(err, ret);
        }
        else{
          console.log('Updated Successfully : ' + ret.id);
          message='successfully updated the employee details';
        }
      });
    }
    else{
      conn.sobject("Contact").update({ Id:req.body.Id,Username__c :req.body.username,Reporting_Lead__c :null,Password__c:req.body.password,Designation__c:req.body.designation,LastName : req.body.employeename,Active__c :req.body.Active,address__c :req.body.address,Email__c :req.body.Email,Phone__c : req.body.phone,Birthdate:req.body.birthdate,Date_of_Joining__c:req.body.joindate,Birthday_Message__c:req.body.birthmsg,Anniversary_Message__c:req.body.annimsg},	function(err, ret) {
        if (err || !ret.success) {
          message='failed to update the employee details'; 
          return console.error(err, ret);
        }
        else{
          message='successfully updated the employee details';
          console.log('Updated Successfully : ' + ret.id);
        }
      });
    }
    getBirthdays(function(data2){
      ejs.renderFile('views/sticky.html',{birthdays1 : data2},function(err, data2){
    	  if(err){console.log(err);}
        employeeDetailview(empid,function(employee){
          ejs.renderFile('views/empdetailview.html',{emp1 : employee},function(err, data){
            if(err){console.log(err);}
            employeeDetails(Id,position,function(employees){
              ejs.renderFile('views/employeetable.html',{ employee : employees },function(err, data1){
                if(err){console.log(err);}
                var fulldetails={
                    emptable:data1,
                    empdetailtable:data,
                    birthdays:data2,
                    message:message
                };
                res.send(fulldetails);
              });
            });
          });
        });
      });
    });
  });
});



