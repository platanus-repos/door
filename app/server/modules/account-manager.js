
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var crypto = require('crypto');
var dbPort = 27017;
var dbHost = global.host;
var dbName = 'login-testing';

// use moment.js for pretty date-stamping //
var moment = require('moment');

var AM = {}; 
	AM.db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}));
	AM.db.open(function(e, d){
		if (e) {
			console.log(e);
		}	else{
			console.log('connected to database :: ' + dbName);
		}
	});
	AM.accounts = AM.db.collection('accounts');

module.exports = AM;

AM.manualLogin = function(pass, callback)
{
console.log(pass);
	AM.accounts.findOne({pass:crypto.createHash('sha256').update(pass).digest("hex")}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}
		else {
			callback(null, o);
		}
			});
}


// record insertion, update & deletion methods //

AM.signup = function(newData, callback)
{
	AM.accounts.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{
			AM.accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else {
					newData.pass = crypto.createHash('sha256').update(newData.pass).digest("hex");
					AM.accounts.insert(newData, callback(null));
					}
			});
		}
	});
};

AM.update = function(newData, callback)
{
	AM.accounts.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			AM.accounts.save(o); callback(o);
		}	else{
			AM.saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				AM.accounts.save(o); callback(o);	
			});
		}
	});
};

AM.registerCard = function(username, cardId, callback)
{
	AM.accounts.findOne({user:username}, function(e, o){
		
		AM.saltAndHash(cardId, function(hash){
			o.pass = hash;
			AM.accounts.save(o); callback(o);	
		});
	});
};

AM.setPassword = function(oldp, newp, callback)
{
	AM.accounts.findOne({pass:oldp}, function(e, o){
		AM.saltAndHash(newp, function(hash){
			o.pass = hash;
			AM.accounts.save(o); callback(o);
		});
	});
};

AM.validateLink = function(pid, callback)
{
	AM.accounts.findOne({pass:pid}, function(e, o){
		callback(o ? 'ok' : null);
	});
};

AM.saltAndHash = function(pass, callback)
{
	callback(crypto.createHash('sha256').update(pass).digest("hex"));
};

AM.delete = function(id, callback)
{
	AM.accounts.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

AM.getEmail = function(email, callback)
{
	AM.accounts.findOne({email:email}, function(e, o){ callback(o); });
}

AM.getObjectId = function(id)
{
// this is necessary for id lookups, just passing the id fails for some reason //	
	return AM.accounts.db.bson_serializer.ObjectID.createFromHexString(id);
}

AM.getAllRecords = function(callback)
{
	AM.accounts.find().toArray(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

AM.delAllRecords = function(id, callback) 
{
	AM.accounts.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

AM.findById = function(id, callback) 
{
	AM.accounts.findOne({_id: this.getObjectId(id)}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


AM.findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	AM.accounts.find( { $or : a } ).toArray(
	    function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
