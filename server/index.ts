declare var require: any

const express = require('express');
import {Server} from 'socket.io';
const http =require('http');
const axios = require('axios')



const app = express();
const server = http.createServer(app);

type Users = {
   id:string;
   Login:User
}

type User = {
   ID: number;
   LOGIN: string;
   NAME: string;
};

type Talk = {
   USER1: string;
   USER2: string;
   CREATEDAT: string;
   TALK: number;
}
type Message = {
   USER: string;
   CREATEDAT: string;
   MASSAGE: string;
   TALK: number,
   ID: number,
}

const users:Users[] = []



const io = new Server(server,{
   cors:{
      origin: '*',
   }
})

io.on('connection',  socket => {

   console.log(socket.id)
  

   socket.on('user',user=>{
      if(user?.LOGIN){
         const findUser = users.find(el => el.Login.LOGIN == user.LOGIN);
         if(!findUser){
            users.push({
               id: socket.id,
               Login: user
            });
            console.log(users)
         }
      }
      emitUsers();
   });

   socket.on('disconnect', reson =>{
      console.log(`o user desconectou id:${socket.id}`)
      disconnectUser(socket);
   });

   socket.on('logout', user =>{
      console.log(`o user desconectou id:${socket.id}`)
      disconnectUser(socket);
   });

   socket.on('message',async (message:Message) =>{
      if(message.ID && message.TALK){
         const data = await axios.get(`http://192.168.5.3:3000/api/getTalk/${message.USER}/${message.TALK}`)
         const talk:Talk = data.data[0];
         users.forEach(user =>{
            if(user.Login.LOGIN != message.USER){
               if(talk.USER1 == user.Login.LOGIN || talk.USER2 == user.Login.LOGIN){
                  io.to(user.id).emit('recive_message',message);
                  io.to(user.id).emit('update_talks',message.USER);
               }
            }else if(user.Login.LOGIN == message.USER){
               io.to(user.id).emit('update_talks',null);
            }
         })
      }
     
   })

})


server.listen(3001, () => console.log('Servidor de Socket.IO rodando na porta 3001'));

const emitUsers = ()=>{
   users.forEach(user =>{
      io.to(user.id).emit('users',users);
      console.log(user.Login.LOGIN);
   });
}

const disconnectUser = (socket:any) =>{
   const userIndex = users.findIndex(user => user.id == socket.id);
      if(userIndex !== -1){
         users.splice(userIndex,1);
         emitUsers();
      }
}