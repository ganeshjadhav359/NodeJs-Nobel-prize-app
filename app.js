const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

const { DBManager,
    promisifyInsertOne,
    promisifyInsertMany,
    promisifyFindAll,
    promisifyReadFile,
    promisifyFind
} =  require('./dbManger');
const db = new DBManager();
db.start().then(async()=>{
        try{
            
            let  data =  await promisifyReadFile(fs,'prize.json');
            const prizes =JSON.parse(data);
            let res = await promisifyInsertMany(db.db,'prize',prizes.prizes);

            data = await promisifyReadFile(fs,'country.json');
            const country = JSON.parse(data);
            res=await promisifyInsertMany(db.db,'country',country.countries);

            data = await promisifyReadFile(fs,'laureate.json');
            const laureate = JSON.parse(data);
            res=await promisifyInsertMany(db.db,'laureate',laureate.laureates);

        }
        catch(err){
            console.log(err);
            return err;
        }
}).catch(err=>{
    console.log(err);
});

const stopServer=()=>{
    db.stop();
}


app.get('/', async function (req, res) {
    //const data = await promisifyFindAll(db.db,'prize');
    //stopServer();
    return res.sendFile(__dirname+'/index.html');
});
app.post('/search',async function(req,res){
    let firstname ='';
    let surname ='';
    if(req.body.firstname)
        firstname = req.body.firstname;
    if(req.body.surname)
        surname = req.body.surname;
    
    const query = { 
        laureates:{
            $elemMatch: { 
                firstname : {$regex :`^${firstname}[a-zA-Z]*` , $options: 'i'} ,
                surname : {$regex : `^${surname}[a-zA-Z]*`,$options : 'i'}
            } 
        }
    };
    // console.log(JSON.stringify(query));
    try{
        const laureateMap =new Map();
        const prizes = await promisifyFind(db.db,'prize',query);
        const result =[];
        for(let prize of prizes){
            let laureateArray= [];
            for( let laureate of prize.laureates){
                //prize =json.parse(prize);
                if(laureateMap.has(laureate.id)){
                    laureate.laureateInfo =laureateMap.get(laureate.id);
                }
                else{
                    let qry =  { id : laureate.id };
                    const laureateData = await promisifyFind(db.db,'laureate',qry);
                    const saveLaureate = {bornCountry : laureateData[0].bornCountry,bornCity : laureateData[0].bornCity};
                    laureateMap.set(laureate.id,saveLaureate);
                    laureate.laureateInfo = saveLaureate;
                }
                
                laureateArray.push(laureate);
                // console.log(JSON.stringify(laureateData[0]));
            }
            prize.laureates= laureateArray;
            result.push(prize);
        }
        return res.json(result);
    }
    
    catch(err){
        console.log(err);
        return res.status(400).json({status: 400, message: `${err}`});
    }
})
app.listen(3100, function () {
  console.log('Example app listening on port 3100!');
});
