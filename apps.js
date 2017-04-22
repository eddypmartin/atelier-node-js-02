const express = require('express')
const i18n = require('i18n-2');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID;
const app = express();

app.set('port', process.env.PORT || 8081);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');



app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))  // pour utiliser le dossier public
app.use(bodyParser.json())  // pour traiter les données JSON
// var db // variable qui contiendra le lien sur la BD
app.use(cookieParser());

i18n.expressBind(app, {
    // setup some locales - other locales default to en silently
    locales: ['fr', 'en'],
    // change the cookie name from 'lang' to 'locale'
    cookieName: 'locale'
});

app.use(function(req, res, next) {
    req.i18n.setLocaleFromCookie();
    next();
});


var db // variable qui contiendra le lien sur la BD
/* connexion local sur le serveur de MongoDB sur le port: 27017 */
MongoClient.connect('mongodb://127.0.0.1:27017/carnet_adresse', (err, database) => {
  if (err) return console.log(err)
  db = database

})


var oGlobal;

// ------------------------------------------ route globale
app.all('*', function(req, res, next) {

	console.log("req.get('host') " +  req.get('host'))
    console.log('0 #### req.cookies.locale = ' + req.cookies.locale)
    console.log('1 ### url ' + req.url + '\n')
    var rxLocal = /^\/(fr|en)/i;
    if(rxLocal.test(req.url)){
        var arr = rxLocal.exec(req.url);
        var local=arr[1];
        console.log(' 1 ####  Local ' + local + '\n') 
        req.i18n.setLocale(local);
        console.log('req.i18n.getLocale() = ' + req.i18n.getLocale())
        console.log('req.i18n.__(hello) = ' + req.i18n.__('hello'))
        //  req.i18n.setLocaleFromCookie();
        console.log(' 1 ###  Local ' + local + '\n') 
    } else { // permet de modifier les url qui ne contienne (en|fr)
        // req.i18n.setLocale('en');
        if (req.url == '/')
        {
         res.redirect('/fr/');
        }
        else
        {
          res.redirect('/fr' + req.url);   
        } 

}
oGlobal = {
			titrePrincipal : "atelier-node.js",
			url : req.url,
			domaine : req.get('host'),
			locale : req.i18n.getLocale(),
			oMenu : [
				"accueil",
				"province",
				"tableau",
				"importer",
				"formulaire"
				]
}

console.log("req.url = " + req.url )  

	next()
  
})

app.get('/:locale(fr|en)/accueil', function(req,res){
	locale = req.params.locale
		res.redirect('/'+ locale +'/')
})
// --------------------------------------- route /
app.get('/:locale(fr|en)/', function(req,res){


	res.render('index', {
				locale : req.i18n.getLocale(),
				oGlobal : oGlobal,

	  			titre : 'Accueil Express et Jade',
	  			message: 'Vive Node.js Express et Jade'
	  		})

})

// --------------------------------------- route /tableau
app.get('/:locale(fr|en)/tableau', function(req,res){

db.collection('provinces').find().sort({code:-1}).toArray( (err, result) => {
      if (err) return console.log(err)

      	console.log(result)



	res.render('index', {

				data : result,
				oGlobal : oGlobal,

	  			titre : 'Éditeur de collection',
	  			message: 'Table adresse'
	  		})

})

})

// --------------------------------------- route /tableau
app.get('/:locale(fr|en)/province', function(req,res){

	fs.readFile('public/data/collection_provinces.json', (err, data) => {
  		if (err) throw err;
  		console.log(data);
  		oData = JSON.parse(data)

		res.render('index', {

						data : oData,
						oGlobal : oGlobal,

			  			titre : 'Provinces du Canada',
			  			message: 'Table provinces'
			  		})
	});

	

})

// --------------------------------------- route /importer
app.get('/:locale(fr|en)/importer', function(req,res){

	fs.readFile('public/data/collection_provinces.json', (err, data) => {
  		if (err) throw err;
  		console.log(data);
  		oData = JSON.parse(data)

  		db.collection('provinces').insertMany(oData, (err, result) => {
      if (err) return console.log(err)
      console.log('sauvegarder dans la BD')
// console.log(result)
      // res.end( JSON.stringify(result.ops));
     
		res.render('index', {

						data : oData,
						oGlobal : oGlobal,

			  			titre : 'Provinces du Canada',
			  			message: 'Table provinces'
			  		})
    })

	});

	

})
// -------------------------------------------------------- route détruire
app.get('/:locale(fr|en)/detruire', function(req,res){
	console.log('req.query.champ  = ' + req.query.champ )
	if (req.query.champ == '' && req.query.valeur == '')
	{
		oCritere = {}	
	}
	else
	{	
	oCritere = JSON.parse('{"' + req.query.champ + '":"' + req.query.valeur  + '"}')
	}
	console.log(oCritere)

	db.collection('provinces').remove(oCritere,  (err, result) => {
	      if (err) return console.log(err)
	      // console.log(result)
	  		res.redirect('/formulaire')
	})	
})



// -------------------------------------------------------- route détruire
app.get('/:locale(fr|en)/formulaire', function(req,res){
/*

*/
		res.render('index', {

						oGlobal : oGlobal,

			  			titre : 'Provinces du Canada',
			  			message: 'Table provinces'
			  		})

})



http.createServer(app).listen(app.get('port'), function(){
  console.log('Le serveur Express écoute sur le port ' + app.get('port'));
});